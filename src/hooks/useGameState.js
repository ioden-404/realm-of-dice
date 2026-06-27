import { useReducer, useCallback, useRef, useEffect } from 'react'
import { CLASSES } from '../data/classes.js'
import { PHASES, TURN_STATES, ALLY_NAMES, ENEMY_NAMES, TEAMS, BOARD_COLS, BOARD_ROWS } from '../data/config.js'
import { rollInitiative } from '../systems/initiative.js'
import { resolveAbility, processStartOfTurn, processEndOfTurn, checkRageComeback, resolveOpportunityAttacks, resolveAllyReactions, processGuardianDamage } from '../systems/combat.js'
import { getAccessibleCells, getValidTargets, getAdjacentEnemies, canMoveTo } from '../systems/movement.js'
import { decideAction } from '../systems/ai.js'
import { generateTerrain, TERRAIN_TYPES } from '../systems/terrain.js'
import { MONSTERS } from '../data/monsters.js'
import { ACTS, generateCampaignMap, generateShopItems, applyCampaignRest, applyConsumable, applyNewPaliers, applyPalierToCharacter, pickRelics, MINOR_RELICS, MAJOR_RELICS, XP_PALIERS, GOLD_REWARDS, teamHasHealer, SURVIVAL_POTION } from '../data/campaign.js'
import { generateShopEquipment, generateTreasureEquipment } from '../data/equipment.js'
import { UNIVERSAL_ACTIONS, COMBAT_ITEMS } from '../data/items.js'
import { LEVEL_UP_TREES, LEVEL_THRESHOLDS } from '../data/levelUpTrees.js'
import { NARRATIVE_EVENTS, RUN_MODIFIERS } from '../data/modifiers.js'

function resolveModifiers(modifierIds = []) {
  const result = { enemyHpMult: 1, goldMult: 1, restHealMult: 1, allyHpMult: 1, allyAtkBonus: 0, xpMult: 1, extraEnemy: false, fogOfWar: false, shopCostMult: 1, treasureGoldMult: 1, combatGoldMult: 1, extraRelics: false }
  for (const id of modifierIds) {
    const mod = RUN_MODIFIERS.find(m => m.id === id)
    if (!mod) continue
    const a = mod.apply
    if (a.enemyHpMult) result.enemyHpMult *= a.enemyHpMult
    if (a.goldMult) result.goldMult *= a.goldMult
    if (a.restHealMult) result.restHealMult *= a.restHealMult
    if (a.allyHpMult) result.allyHpMult *= a.allyHpMult
    if (a.allyAtkBonus) result.allyAtkBonus += a.allyAtkBonus
    if (a.xpMult) result.xpMult *= a.xpMult
    if (a.extraEnemy) result.extraEnemy = true
    if (a.fogOfWar) result.fogOfWar = true
    if (a.shopCostMult) result.shopCostMult *= a.shopCostMult
    if (a.treasureGoldMult) result.treasureGoldMult *= a.treasureGoldMult
    if (a.combatGoldMult) result.combatGoldMult *= a.combatGoldMult
    if (a.extraRelics) result.extraRelics = true
  }
  return result
}

function createCharacter(classId, team, index) {
  const classData = CLASSES[classId]
  const name = team === TEAMS.ALLY ? ALLY_NAMES[classId] : ENEMY_NAMES[classId]
  const id = `${team}-${classId}`

  let position
  if (team === TEAMS.ALLY) {
    const positions = [{ x: 0, y: 1 }, { x: 0, y: 3 }, { x: 1, y: 0 }, { x: 1, y: 3 }, { x: 1, y: 2 }]
    position = positions[index] || { x: 0, y: index % BOARD_ROWS }
  } else {
    position = _enemySlots[index] || { x: BOARD_COLS - 1, y: index % BOARD_ROWS }
  }

  return {
    id,
    name,
    classId,
    classData,
    team,
    emoji: classData.emoji,
    hp: classData.hp,
    maxHp: classData.hp,
    ac: classData.ac,
    attackBonus: classData.attackBonus,
    movement: classData.movement,
    range: classData.range,
    position,
    actionUsed: false,
    bonusActionUsed: false,
    reactionUsed: false,
    movementUsed: 0,
    statuses: [],
    cooldowns: {},
    uses: {},
    concentration: null,
    isDead: false,
    initiative: 0,
    animation: null
  }
}

let _enemySlots = []

function shuffleEnemySlots() {
  _enemySlots = []
  for (let x = BOARD_COLS - 2; x < BOARD_COLS; x++) {
    for (let y = 0; y < BOARD_ROWS; y++) _enemySlots.push({ x, y })
  }
  for (let i = _enemySlots.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [_enemySlots[i], _enemySlots[j]] = [_enemySlots[j], _enemySlots[i]]
  }
}

function createMonster(monsterId, index, allMonsterIds) {
  const monsterData = MONSTERS[monsterId]
  const sameTypeCount = allMonsterIds.filter(m => m === monsterId).length
  const sameTypeIndex = allMonsterIds.slice(0, index + 1).filter(m => m === monsterId).length
  const name = sameTypeCount > 1
    ? `${monsterData.name} ${'ABCDE'[sameTypeIndex - 1]}`
    : monsterData.name
  const id = `enemy-${monsterId}-${index}`

  return {
    id,
    name,
    classId: monsterData.aiProfile,
    classData: monsterData,
    team: TEAMS.ENEMY,
    emoji: monsterData.emoji,
    hp: monsterData.hp,
    maxHp: monsterData.hp,
    ac: monsterData.ac,
    attackBonus: monsterData.attackBonus,
    movement: monsterData.movement,
    range: monsterData.range,
    position: _enemySlots[index] || { x: BOARD_COLS - 1, y: index % BOARD_ROWS },
    actionUsed: false,
    bonusActionUsed: false,
    reactionUsed: false,
    movementUsed: 0,
    statuses: monsterData.initialStatuses ? monsterData.initialStatuses.map(s => ({ ...s })) : [],
    cooldowns: {},
    uses: {},
    concentration: null,
    isDead: false,
    initiative: 0,
    animation: null
  }
}

function stripToBaseKit(character) {
  const tree = LEVEL_UP_TREES[character.classId]
  if (!tree) return character
  const newClassData = JSON.parse(JSON.stringify(character.classData))
  newClassData.abilities = {
    actions: [...tree.baseKit.actions],
    bonusActions: [...tree.baseKit.bonusActions],
    reactions: [...tree.baseKit.reactions]
  }
  return { ...character, classData: newClassData, level: 1, chosenAbilities: [] }
}

function checkLevelUps(xp, characters) {
  const allies = Object.values(characters).filter(c => c.team === 'ally')
  const pending = []
  for (const char of allies) {
    const currentLevel = char.level || 1
    for (const threshold of LEVEL_THRESHOLDS) {
      if (xp >= threshold.xp && currentLevel < threshold.level) {
        pending.push({ characterId: char.id, level: currentLevel + 1 })
        break
      }
    }
  }
  return pending
}

function applyLevelUpAbility(characters, characterId, ability) {
  const char = characters[characterId]
  if (!char) return characters
  const newClassData = JSON.parse(JSON.stringify(char.classData))
  const cat = ability.category || 'actions'
  newClassData.abilities[cat] = [...newClassData.abilities[cat], { ...ability }]
  const newUses = { ...char.uses }
  if (ability.maxUses > 0) {
    newUses[ability.id] = ability.maxUses
  }
  return {
    ...characters,
    [characterId]: {
      ...char,
      classData: newClassData,
      uses: newUses,
      level: (char.level || 1) + 1,
      chosenAbilities: [...(char.chosenAbilities || []), ability.id]
    }
  }
}

function getAllyPosition(index) {
  const positions = [{ x: 0, y: 1 }, { x: 0, y: 3 }, { x: 1, y: 0 }, { x: 1, y: 4 }, { x: 1, y: 2 }]
  return positions[index] || { x: 0, y: index }
}

function resolveCampaignPhase(state, gameEnd) {
  if (!gameEnd) return null
  if (state.story?.active) return gameEnd === PHASES.DEFEAT ? PHASES.DEFEAT : PHASES.STORY
  if (!state.campaign.active) return gameEnd
  if (gameEnd === PHASES.DEFEAT) return PHASES.CAMPAIGN_DEFEAT
  const node = state.campaign.currentNode
  if (node?.type === 'boss' && state.campaign.act >= ACTS.length - 1) {
    return PHASES.CAMPAIGN_COMPLETE
  }
  return PHASES.CAMPAIGN_MAP
}

function advanceCampaignAfterCombat(campaign) {
  return {
    ...campaign,
    currentLayer: campaign.currentLayer + 1,
    lastNodeId: campaign.currentNode?.id || campaign.lastNodeId,
    currentNode: null
  }
}

function initUses(character) {
  const uses = {}
  const classData = character.classData
  const allAbilities = [
    ...classData.abilities.actions,
    ...classData.abilities.bonusActions,
    ...classData.abilities.reactions
  ]
  for (const ability of allAbilities) {
    if (ability.maxUses > 0) {
      uses[ability.id] = ability.maxUses
    }
  }
  return uses
}

function resolveItemUse(character, item, targetCell, terrain, characters) {
  const logs = []
  const effects = []
  let newTerrain = { ...terrain }

  if (item.effect === 'heal') {
    const match = item.healDice.match(/(\d+)d(\d+)(?:\+(\d+))?/)
    if (match) {
      let total = 0
      for (let i = 0; i < parseInt(match[1]); i++) total += Math.floor(Math.random() * parseInt(match[2])) + 1
      total += parseInt(match[3]) || 0
      const heal = Math.min(total, character.maxHp - character.hp)
      effects.push({ type: 'heal', targetId: character.id, amount: heal })
      logs.push(`🧪 ${character.name} boit une potion — +${heal} PV`)
    }
  } else if (item.effect === 'acBoost') {
    effects.push({ type: 'addStatus', targetId: character.id, status: { type: 'defensePosture', acBonus: item.acBonus, duration: (item.duration || 3) + 1 } })
    logs.push(`🛡️ ${character.name} boit une potion de résistance — +${item.acBonus} CA`)
  } else if (item.effect === 'purify') {
    effects.push({ type: 'removeStatus', targetId: character.id, statusType: 'poison' })
    effects.push({ type: 'removeStatus', targetId: character.id, statusType: 'cursedMark' })
    effects.push({ type: 'removeStatus', targetId: character.id, statusType: 'antiHeal' })
    logs.push(`💊 ${character.name} utilise un antidote`)
  } else if (item.effect === 'createTerrain' && targetCell) {
    const size = item.aoeSize || 1
    for (let dx = 0; dx < size; dx++) {
      for (let dy = 0; dy < size; dy++) {
        const key = `${targetCell.x + dx},${targetCell.y + dy}`
        if (targetCell.x + dx < 7 && targetCell.y + dy < 5 && !terrain[key]?.type?.match(/blocking/)) {
          newTerrain[key] = { type: item.terrainType, emoji: item.terrainEmoji, label: item.terrainLabel, duration: item.duration }
        }
      }
    }
    logs.push(`${item.emoji} ${character.name} lance ${item.name} !`)
  } else if (item.effect === 'ignite' && targetCell) {
    const keysToIgnite = []
    const checkAndIgnite = (x, y) => {
      const key = `${x},${y}`
      if (terrain[key]?.type === 'oil' || newTerrain[key]?.type === 'oil') keysToIgnite.push(key)
    }
    checkAndIgnite(targetCell.x, targetCell.y)
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        checkAndIgnite(targetCell.x + dx, targetCell.y + dy)
      }
    }
    if (keysToIgnite.length > 0) {
      const allOilKeys = Object.keys(newTerrain).filter(k => newTerrain[k]?.type === 'oil')
      for (const k of allOilKeys) {
        newTerrain[k] = { type: 'fire', emoji: '🔥', label: 'Feu', duration: item.fireDuration, damage: item.fireDamage }
      }
      for (const char of Object.values(characters)) {
        if (char.isDead) continue
        const ck = `${char.position.x},${char.position.y}`
        if (newTerrain[ck]?.type === 'fire') {
          effects.push({ type: 'damage', targetId: char.id, amount: item.fireDamage })
        }
      }
      logs.push(`🔥 L'huile s'enflamme ! Zone de feu créée !`)
    } else {
      const key = `${targetCell.x},${targetCell.y}`
      newTerrain[key] = { type: 'fire', emoji: '🔥', label: 'Feu', duration: item.fireDuration, damage: item.fireDamage }
      logs.push(`🔥 ${character.name} allume un feu !`)
    }
  }

  return { logs, effects, terrain: newTerrain }
}

function tickDynamicTerrain(terrain) {
  const updated = {}
  for (const [key, cell] of Object.entries(terrain)) {
    if (cell.duration !== undefined && cell.duration !== null) {
      if (cell.duration > 1) {
        updated[key] = { ...cell, duration: cell.duration - 1 }
      }
    } else {
      updated[key] = cell
    }
  }
  return updated
}

function checkFireOnMagicAttack(ability, target, terrain) {
  if (!ability.magical) return { terrain, logs: [], effects: [] }
  const fireAbilities = ['boule-de-feu', 'sort-mineur', 'eclair', 'dragon-breath']
  if (!fireAbilities.includes(ability.id) && !ability.id?.includes('feu') && !ability.id?.includes('fire')) return { terrain, logs: [], effects: [] }

  const targetKey = `${target.position.x},${target.position.y}`
  if (terrain[targetKey]?.type !== 'oil') return { terrain, logs: [], effects: [] }

  const newTerrain = { ...terrain }
  const allOilKeys = Object.keys(newTerrain).filter(k => newTerrain[k]?.type === 'oil')
  for (const k of allOilKeys) {
    newTerrain[k] = { type: 'fire', emoji: '🔥', label: 'Feu', duration: 3, damage: 6 }
  }
  return { terrain: newTerrain, logs: ['🔥 Le sort enflamme l\'huile !'], effects: [] }
}

function generateEnemyTeam(allyClasses) {
  const allClasses = Object.keys(CLASSES)
  const shuffled = [...allClasses].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3)
}

const SAVE_KEY = 'rod-campaign-save'

function saveCampaignState(state) {
  try {
    const data = {
      characters: state.characters,
      initiativeOrder: state.initiativeOrder,
      campaign: state.campaign,
      stats: state.stats,
      selectedClasses: state.selectedClasses,
      pendingPaliers: state.pendingPaliers,
      pendingLevelUps: state.pendingLevelUps,
      campaignEvent: state.campaignEvent,
      combatResult: state.combatResult,
      combatInventory: state.combatInventory,
      campaignMode: true,
      phase: PHASES.CAMPAIGN_MAP
    }
    localStorage.setItem(SAVE_KEY, JSON.stringify(data))
  } catch {}
}

function loadCampaignState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data.campaign?.active) return null
    if (!data.characters || !Object.keys(data.characters).length) return null
    if (!data.campaign?.map) return null
    return data
  } catch { return null }
}

function clearCampaignSave() {
  try { localStorage.removeItem(SAVE_KEY) } catch {}
}

const STORY_SAVE_KEY = 'rod-story-save'

function saveStoryState(story) {
  try {
    localStorage.setItem(STORY_SAVE_KEY, JSON.stringify({
      chapterId: story.chapterId,
      sequenceId: story.sequenceId,
      blockIndex: story.blockIndex,
      choices: story.choices,
      companion: story.companion,
      completed: story.completed
    }))
  } catch {}
}

function loadStoryState() {
  try {
    const raw = localStorage.getItem(STORY_SAVE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

function clearStoryState() {
  try { localStorage.removeItem(STORY_SAVE_KEY) } catch {}
}

function freshStats() {
  return { damageDealt: 0, damageReceived: 0, healingDone: 0, rounds: 1, enemiesKilled: 0, combatsWon: 0, elitesWon: 0, bossesWon: 0, allyDeaths: 0, potionsUsed: 0 }
}

const initialState = {
  phase: PHASES.HUB,
  selectedClasses: [],
  characters: {},
  initiativeOrder: [],
  currentTurnIndex: 0,
  round: 1,
  turnState: TURN_STATES.IDLE,
  selectedAbility: null,
  selectedCategory: null,
  movementRemaining: 0,
  originalPosition: null,
  originalMovementUsed: 0,
  validTargets: [],
  validMoves: [],
  log: [],
  stats: freshStats(),
  pendingAO: null,
  terrain: {},
  terrainTheme: null,
  terrainThemeName: '',
  campaign: { active: false, act: 0, map: null, currentLayer: 0, lastNodeId: null, visitedNodes: [], currentNode: null, rewards: [], xp: 0, appliedPaliers: [], evolved: false, relics: [], gold: 0, inventory: [], equipment: {}, equipmentInventory: [] },
  campaignEvent: null,
  pendingPaliers: [],
  pendingLevelUps: [],
  combatResult: null,
  combatInventory: [],
  campaignMode: false,
  visualEvents: [],
  pendingCutIn: null,
  pendingReaction: null,
  runBestiary: {},
  combatObjective: null,
  storyGrid: null,
  story: {
    active: false,
    chapterId: null,
    sequenceId: null,
    blockIndex: 0,
    choices: {},
    companion: null,
    completed: []
  }
}

function applyEffects(state, effects) {
  let newChars = { ...state.characters }
  let newStats = { ...state.stats }
  const visualEvents = []

  for (const effect of effects) {
    const char = newChars[effect.targetId || effect.characterId]
    if (!char) continue

    switch (effect.type) {
      case 'damage': {
        const updated = { ...char, hp: Math.max(0, char.hp - effect.amount) }
        if (updated.hp === 0 && !updated.isDead) {
          updated.isDead = true
          updated.animation = 'death'
          updated._deathRound = newStats?.rounds || 1
        } else if (effect.amount > 0 && !updated.isDead) {
          updated.animation = 'shake'
        }
        if (char.team === TEAMS.ENEMY) {
          newStats = { ...newStats, damageDealt: newStats.damageDealt + effect.amount }
        } else {
          newStats = { ...newStats, damageReceived: newStats.damageReceived + effect.amount }
        }
        newChars = { ...newChars, [char.id]: updated }
        if (effect.amount > 0) visualEvents.push({ type: 'damage', amount: effect.amount, charId: char.id, position: char.position, id: `dmg-${Date.now()}-${Math.random()}` })
        break
      }
      case 'heal': {
        if (char.isDead && effect.amount <= 0) break
        const healed = { ...char, hp: Math.min(char.maxHp, char.hp + effect.amount) }
        if (healed.hp > 0 && char.isDead) healed.isDead = false
        healed.animation = 'heal'
        newStats = { ...newStats, healingDone: newStats.healingDone + effect.amount }
        newChars = { ...newChars, [char.id]: healed }
        if (effect.amount > 0) visualEvents.push({ type: 'heal', amount: effect.amount, charId: char.id, position: char.position, id: `heal-${Date.now()}-${Math.random()}` })
        break
      }
      case 'addStatus': {
        const existing = char.statuses.findIndex(s => s.type === effect.status.type)
        let newStatuses
        if (existing >= 0) {
          newStatuses = [...char.statuses]
          newStatuses[existing] = effect.status
        } else {
          newStatuses = [...char.statuses, effect.status]
        }
        newChars = { ...newChars, [char.id]: { ...char, statuses: newStatuses } }
        break
      }
      case 'removeStatus': {
        const filtered = char.statuses.filter(s => s.type !== effect.statusType)
        newChars = { ...newChars, [char.id]: { ...char, statuses: filtered } }
        break
      }
      case 'tickStatuses': {
        const ticked = char.statuses
          .map(s => s.duration !== undefined ? { ...s, duration: s.duration - 1 } : s)
          .filter(s => s.duration === undefined || s.duration > 0)
        newChars = { ...newChars, [char.id]: { ...char, statuses: ticked } }
        break
      }
      case 'move': {
        newChars = { ...newChars, [char.id]: { ...char, position: effect.position } }
        break
      }
      case 'extraMovement': {
        break
      }
      case 'useReaction': {
        const hasFreeReaction = char.relicEffects?.some(r => r.type === 'freeReaction') && !char._freeReactionUsed
        if (hasFreeReaction) {
          newChars = { ...newChars, [char.id]: { ...char, _freeReactionUsed: true } }
        } else {
          newChars = { ...newChars, [char.id]: { ...char, reactionUsed: true } }
        }
        break
      }
      case 'breakConcentration': {
        const concTarget = char.concentration?.targetId
        let updated2 = { ...char, concentration: null }
        newChars = { ...newChars, [char.id]: updated2 }
        if (concTarget && newChars[concTarget]) {
          const target = newChars[concTarget]
          const filteredStatuses = target.statuses.filter(s => s.source !== char.id)
          newChars = { ...newChars, [concTarget]: { ...target, statuses: filteredStatuses } }
        }
        break
      }
      case 'setConcentration': {
        newChars = { ...newChars, [char.id]: { ...char, concentration: effect.spell } }
        break
      }
      case 'revive': {
        if (char.isDead) {
          newChars = { ...newChars, [char.id]: { ...char, isDead: false, hp: effect.hp || 1, animation: 'heal' } }
        }
        break
      }
      case 'resetAction': {
        newChars = { ...newChars, [char.id]: { ...char, actionUsed: false } }
        break
      }
      case 'resetCooldowns': {
        const resetCDs = {}
        newChars = { ...newChars, [char.id]: { ...char, cooldowns: resetCDs } }
        break
      }
    }
  }

  return { characters: newChars, stats: newStats, visualEvents }
}

function checkGameEnd(characters, objective, round) {
  const allyAlive = Object.values(characters).some(c => c.team === TEAMS.ALLY && !c.isDead && !c.isCrystal && !c.isEscort)
  const enemyAlive = Object.values(characters).some(c => c.team === TEAMS.ENEMY && !c.isDead)

  if (!allyAlive) return PHASES.DEFEAT

  if (objective) {
    if (objective.type === 'killLeader') {
      const leader = Object.values(characters).find(c => c.isLeader)
      if (leader?.isDead) return PHASES.VICTORY
    }
    if (objective.type === 'survive' && round > objective.turns) {
      return PHASES.VICTORY
    }
    if (objective.type === 'protect') {
      const crystal = Object.values(characters).find(c => c.isCrystal)
      if (crystal?.isDead) return PHASES.DEFEAT
    }
    if (objective.type === 'escort') {
      const anyAllyEscaped = Object.values(characters).some(c => c.team === TEAMS.ALLY && !c.isDead && !c.isCrystal && c.position?.x >= 6)
      if (anyAllyEscaped) return PHASES.VICTORY
      const npc = Object.values(characters).find(c => c.isEscort)
      if (npc?.isDead) return PHASES.DEFEAT
    }
  }

  if (!enemyAlive) return PHASES.VICTORY
  return null
}

function gameReducer(state, action) {
  switch (action.type) {
    case 'LOAD_CAMPAIGN': {
      const saved = loadCampaignState()
      if (!saved || !saved.campaign?.map || !Object.keys(saved.characters || {}).length) {
        clearCampaignSave()
        return state
      }
      return { ...state, ...saved }
    }

    case 'GO_TO_TEAM_SELECT': {
      return { ...state, phase: PHASES.TEAM_SELECT, selectedClasses: [], campaignMode: action.payload?.campaignMode || false }
    }

    case 'GO_TO_HUB': {
      return { ...state, phase: PHASES.HUB, selectedClasses: [] }
    }

    case 'TOGGLE_CLASS': {
      const { classId } = action.payload
      const selected = state.selectedClasses.includes(classId)
        ? state.selectedClasses.filter(c => c !== classId)
        : state.selectedClasses.length < 3
          ? [...state.selectedClasses, classId]
          : state.selectedClasses
      return { ...state, selectedClasses: selected }
    }

    case 'START_COMBAT': {
      const { allyClasses } = action.payload
      const enemyClasses = generateEnemyTeam(allyClasses)
      const characters = {}

      allyClasses.forEach((classId, i) => {
        const char = createCharacter(classId, TEAMS.ALLY, i)
        char.uses = initUses(char)
        characters[char.id] = char
      })

      shuffleEnemySlots()
      enemyClasses.forEach((classId, i) => {
        const char = createCharacter(classId, TEAMS.ENEMY, i)
        char.uses = initUses(char)
        characters[char.id] = char
      })

      const initiativeOrder = rollInitiative(characters)
      const firstChar = characters[initiativeOrder[0]]
      const firstIsEnemy = firstChar?.team === TEAMS.ENEMY

      const { terrain, theme: terrainTheme, themeName } = generateTerrain()

      return {
        ...state,
        phase: PHASES.COMBAT,
        characters,
        initiativeOrder,
        currentTurnIndex: 0,
        round: 1,
        turnState: firstIsEnemy ? TURN_STATES.ENEMY_TURN : TURN_STATES.IDLE,
        terrain,
        terrainTheme,
        terrainThemeName: themeName,
        combatInventory: [],
        log: [
          { text: `🗺️ ${themeName}`, type: 'system' },
          { text: '⚔️ Le combat commence !', type: 'system' },
          { text: `--- Tour de ${firstChar.name} (${firstChar.classData.name}) ---`, type: 'turn' }
        ],
        stats: freshStats()
      }
    }

    case 'ADD_LOG': {
      const newLog = [...state.log, ...action.payload.entries.map(text => ({
        text,
        type: action.payload.logType || 'info'
      }))]
      return { ...state, log: newLog.slice(-50) }
    }

    case 'START_MOVE': {
      const current = state.characters[state.initiativeOrder[state.currentTurnIndex]]
      const extraMove = current.statuses.find(s => s.type === 'extraMovement')
      const totalMovement = current.movement + (extraMove ? extraMove.amount : 0)
      const remaining = totalMovement - current.movementUsed
      const validMoves = getAccessibleCells(current.position, remaining, state.characters, current.id, state.terrain)

      return {
        ...state,
        turnState: TURN_STATES.MOVING,
        movementRemaining: remaining,
        originalPosition: { ...current.position },
        originalMovementUsed: current.movementUsed,
        validMoves
      }
    }

    case 'MOVE_DIRECTION': {
      const current = state.characters[state.initiativeOrder[state.currentTurnIndex]]
      const { dx, dy } = action.payload
      const newX = current.position.x + dx
      const newY = current.position.y + dy

      if (!canMoveTo(current.position, { dx, dy }, state.characters, current.id, state.terrain)) {
        return state
      }

      const terrainKey = `${newX},${newY}`
      const terrainCell = state.terrain[terrainKey]
      const isDifficultTerrain = terrainCell && terrainCell.type === TERRAIN_TYPES.DIFFICULT
      const moveCost = isDifficultTerrain ? Math.min(2, state.movementRemaining) : 1

      if (state.movementRemaining < 1) return state
      if (!isDifficultTerrain && state.movementRemaining < moveCost) return state

      const aoResult = resolveOpportunityAttacks(current, current.position, { x: newX, y: newY }, state.characters)
      const pendingAOs = [...(state.pendingAOs || [])]
      if (aoResult.effects.length > 0) {
        pendingAOs.push({ effects: aoResult.effects, logs: aoResult.logs })
      }

      const newChars = {
        ...state.characters,
        [current.id]: {
          ...current,
          position: { x: newX, y: newY },
          movementUsed: current.movementUsed + moveCost,
          facingRight: dx !== 0 ? dx > 0 : current.facingRight
        }
      }

      const newRemaining = state.movementRemaining - moveCost
      const newValidMoves = getAccessibleCells(
        { x: newX, y: newY }, newRemaining, newChars, current.id, state.terrain
      )

      return {
        ...state,
        characters: newChars,
        movementRemaining: newRemaining,
        validMoves: newValidMoves,
        pendingAOs
      }
    }

    case 'CONFIRM_MOVE': {
      let updatedChars = { ...state.characters }
      let aoLogs = []
      let aoVisuals = []

      for (const ao of (state.pendingAOs || [])) {
        const applied = applyEffects({ characters: updatedChars, stats: state.stats }, ao.effects)
        updatedChars = applied.characters
        aoVisuals.push(...(applied.visualEvents || []))
        aoLogs.push(...ao.logs.map(t => ({ text: t, type: t.includes('Raté') ? 'miss' : 'info' })))
      }

      const current = updatedChars[state.initiativeOrder[state.currentTurnIndex]]
      if (current?.isDead) {
        const gameEnd = checkGameEnd(updatedChars, state.combatObjective, state.round)
        return {
          ...state,
          characters: updatedChars,
          log: [...state.log, ...aoLogs].slice(-50),
          turnState: TURN_STATES.IDLE,
          movementRemaining: 0,
          validMoves: [],
          visualEvents: aoVisuals,
          pendingAOs: [],
          originalPosition: null,
          originalMovementUsed: 0,
          phase: resolveCampaignPhase(state, gameEnd) || state.phase
        }
      }

      return {
        ...state,
        characters: updatedChars,
        turnState: TURN_STATES.IDLE,
        originalPosition: null,
        originalMovementUsed: 0,
        validMoves: [],
        pendingAOs: [],
        log: [...state.log, ...aoLogs].slice(-50),
        visualEvents: aoVisuals
      }
    }

    case 'CANCEL_MOVE': {
      const current = state.characters[state.initiativeOrder[state.currentTurnIndex]]
      if (!state.originalPosition) return { ...state, turnState: TURN_STATES.IDLE }

      const restored = {
        ...current,
        position: state.originalPosition,
        movementUsed: state.originalMovementUsed
      }

      return {
        ...state,
        characters: { ...state.characters, [current.id]: restored },
        turnState: TURN_STATES.IDLE,
        originalPosition: null,
        originalMovementUsed: 0,
        movementRemaining: 0,
        validMoves: [],
        pendingAOs: []
      }
    }

    case 'SELECT_CATEGORY': {
      return {
        ...state,
        turnState: TURN_STATES.SELECTING_ACTION,
        selectedCategory: action.payload.category
      }
    }

    case 'SELECT_ABILITY': {
      const { ability } = action.payload
      const current = state.characters[state.initiativeOrder[state.currentTurnIndex]]

      if (ability.targetType === 'self') {
        return { ...state, selectedAbility: ability }
      }

      const targets = getValidTargets(current, ability, state.characters)

      if (targets.length === 0) {
        return {
          ...state,
          log: [...state.log, { text: '❌ Aucune cible valide à portée', type: 'warning' }]
        }
      }

      return {
        ...state,
        turnState: TURN_STATES.SELECTING_TARGET,
        selectedAbility: ability,
        validTargets: targets.map(t => t.id)
      }
    }

    case 'EXECUTE_ABILITY': {
      const { ability, targetId, isBonusAction } = action.payload
      let current = state.characters[state.initiativeOrder[state.currentTurnIndex]]
      const target = targetId ? state.characters[targetId] : current

      if (targetId && target && target.id !== current.id) {
        current = { ...current, facingRight: target.position.x > current.position.x }
      }

      const result = resolveAbility(current, target, ability, state.characters, state.terrain)

      let terrainAfterAbility = state.terrain
      if (result.terrain && target) {
        const pos = target.position
        terrainAfterAbility = { ...terrainAfterAbility, [`${pos.x},${pos.y}`]: result.terrain }
      }
      if (ability.magical && target) {
        const fireCheck = checkFireOnMagicAttack(ability, target, terrainAfterAbility)
        if (fireCheck.terrain !== terrainAfterAbility) {
          terrainAfterAbility = fireCheck.terrain
          result.logs.push(...fireCheck.logs)
        }
      }

      const charsWithFacing = { ...state.characters, [current.id]: current }
      let { characters: newChars, stats: newStats, visualEvents: newVisuals } = applyEffects(
        { characters: charsWithFacing, stats: state.stats },
        result.effects
      )

      const newCooldowns = { ...current.cooldowns }
      if (ability.cooldown > 0) {
        newCooldowns[ability.id] = ability.cooldown + 1
      }

      const newUses = { ...current.uses }
      if (ability.maxUses > 0 && newUses[ability.id] !== undefined) {
        newUses[ability.id] = Math.max(0, newUses[ability.id] - 1)
      }

      const updatedCurrent = {
        ...newChars[current.id],
        cooldowns: newCooldowns,
        uses: newUses,
        actionUsed: isBonusAction ? newChars[current.id].actionUsed : true,
        bonusActionUsed: isBonusAction ? true : newChars[current.id].bonusActionUsed
      }

      if (ability.effect === 'advantage') {
        updatedCurrent.statuses = [...(updatedCurrent.statuses || []),
          { type: 'advantage', duration: 1 }]
      }

      let finalChars = { ...newChars, [current.id]: updatedCurrent }

      let extraLogs = [...result.logs]
      let rageEffects = []

      const deadChars = Object.values(finalChars).filter(c => c.isDead && c.hp === 0)
      for (const dead of deadChars) {
        if (finalChars[dead.id].hp === 0 && !finalChars[dead.id]._rageProcessed) {
          const rageResult = checkRageComeback(dead, finalChars)
          extraLogs.push(...rageResult.logs)
          rageEffects.push(...rageResult.effects)
          finalChars = {
            ...finalChars,
            [dead.id]: { ...finalChars[dead.id], _rageProcessed: true }
          }
        }
      }

      let allVisuals = [...(newVisuals || [])]

      if (rageEffects.length > 0) {
        const rageApplied = applyEffects({ characters: finalChars, stats: newStats }, rageEffects)
        finalChars = rageApplied.characters
        allVisuals.push(...(rageApplied.visualEvents || []))
      }

      let reactionToPrompt = null
      if (targetId && ability.damage && current.team !== (state.characters[targetId]?.team)) {
        const allyReact = resolveAllyReactions(targetId, current.id, result.damage || 0, finalChars)
        if (allyReact.effects.length > 0) {
          const targetChar = finalChars[targetId]
          const isAllyReacting = targetChar?.team === TEAMS.ALLY
          if (isAllyReacting && targetChar?.reactionsEnabled !== false) {
            reactionToPrompt = { effects: allyReact.effects, logs: allyReact.logs, reactionName: allyReact.logs[0] || '' }
          } else {
            const reactApplied = applyEffects({ characters: finalChars, stats: newStats }, allyReact.effects)
            finalChars = reactApplied.characters
            allVisuals.push(...(reactApplied.visualEvents || []))
            extraLogs.push(...allyReact.logs)
          }
        }
      }

      let needInitiativeRefresh = false

      for (const id of Object.keys(finalChars)) {
        const ch = finalChars[id]
        if (ch.team !== TEAMS.ENEMY || ch.isDead || !ch.classData?.bossPhases || ch._phaseTriggered) continue
        const phase = ch.classData.bossPhases[0]
        if (ch.hp / ch.maxHp > phase.threshold) continue

        finalChars = { ...finalChars, [id]: { ...ch, _phaseTriggered: true } }

        if (phase.effect === 'enrage') {
          finalChars[id] = { ...finalChars[id], attackBonus: ch.attackBonus + (phase.atkBonus || 0), movement: ch.movement + (phase.movementBonus || 0), statuses: [...ch.statuses, { type: 'rage', duration: 99 }] }
          extraLogs.push(`🔥 ${ch.name} entre en rage furieuse ! (+${phase.atkBonus} ATK, +${phase.movementBonus} mouvement)`)
          if (phase.spawnReinforcements) {
            shuffleEnemySlots()
            phase.spawnReinforcements.forEach((mId, i) => {
              const reinforcement = createMonster(mId, Object.keys(finalChars).length + i, phase.spawnReinforcements)
              reinforcement.uses = initUses(reinforcement)
              const openSlots = _enemySlots.filter(s => !Object.values(finalChars).some(c => !c.isDead && c.position.x === s.x && c.position.y === s.y))
              if (openSlots.length > 0) reinforcement.position = openSlots[i % openSlots.length]
              finalChars = { ...finalChars, [reinforcement.id]: reinforcement }
              extraLogs.push(`⚠️ ${reinforcement.name} rejoint le combat !`)
            })
            needInitiativeRefresh = true
          }
        }

        if (phase.effect === 'fly') {
          finalChars[id] = { ...finalChars[id], statuses: [...finalChars[id].statuses, { type: 'flying', duration: (phase.flyDuration || 1) + 1 }] }
          extraLogs.push(`🐉 ${ch.name} s'envole ! Intouchable pendant ${phase.flyDuration} tour !`)
        }

        if (phase.effect === 'charge') {
          finalChars[id] = { ...finalChars[id], _chargeReady: true, _chargeEvery: phase.chargeEveryNTurns || 2, _chargeDamage: phase.chargeDamage, _chargeRange: phase.chargeRange || 3 }
          extraLogs.push(`🐂 ${ch.name} gratte le sol... Il se prépare à charger !`)
        }
      }

      const gameEnd = checkGameEnd(finalChars, state.combatObjective, state.round)

      const newLog = [...state.log, ...extraLogs.map(text => ({
        text,
        type: text.includes('CRITIQUE') || text.includes('FATAL') ? 'critical' :
              text.includes('soins') || text.includes('💚') ? 'heal' :
              text.includes('Raté') ? 'miss' : 'info'
      }))]

      const resolvedPhase2 = resolveCampaignPhase(state, gameEnd)
      let execChars = finalChars
      let execCampaign = state.campaign
      let execEvent = state.campaignEvent
      let execPendingPaliers = state.pendingPaliers
      let execCombatResult = state.combatResult
      let execLevelUps = state.pendingLevelUps
      if (resolvedPhase2 === PHASES.CAMPAIGN_MAP) {
        const runMods = resolveModifiers(state.campaign.modifiers)
        const hasHeal = teamHasHealer(finalChars)
        const restBonus1 = (state.campaign.gloryUpgrades?.['rest-bonus'] || 0) * 0.05
        execChars = { ...finalChars, ...applyCampaignRest(finalChars, (hasHeal ? 0.3 : 0.45) + restBonus1) }
        const nodeType = state.campaign.currentNode?.type
        const eliteXpBonus = nodeType === 'elite' ? (state.campaign.gloryUpgrades?.['xp-boost'] || 0) : 0
        const xpGain = (nodeType === 'boss' ? 3 : nodeType === 'elite' ? 2 : 1) + eliteXpBonus
        const newXp = (state.campaign.xp || 0) + Math.floor(xpGain * runMods.xpMult)
        const palierResult = applyNewPaliers(execChars, newXp, state.campaign.appliedPaliers || [])
        execChars = palierResult.characters
        const baseGold = nodeType === 'boss' ? GOLD_REWARDS.boss : nodeType === 'elite' ? GOLD_REWARDS.elite : GOLD_REWARDS.combat
        const goldGain = Math.floor(baseGold * runMods.goldMult * (nodeType !== 'boss' && nodeType !== 'elite' ? runMods.combatGoldMult : 1))
        execCampaign = { ...advanceCampaignAfterCombat(state.campaign), xp: newXp, appliedPaliers: palierResult.appliedPaliers, evolved: palierResult.didEvolve || state.campaign.evolved, gold: (state.campaign.gold || 0) + goldGain }
        execPendingPaliers = palierResult.pendingChoices || []
        execCombatResult = { victory: true, gold: goldGain, xp: xpGain }
        newStats = { ...newStats, combatsWon: (newStats.combatsWon || 0) + 1 }
        if (nodeType === 'elite') newStats.elitesWon = (newStats.elitesWon || 0) + 1
        if (nodeType === 'boss') newStats.bossesWon = (newStats.bossesWon || 0) + 1
        execLevelUps = checkLevelUps(newXp, execChars)
        if (nodeType === 'elite') {
          execEvent = { type: 'relic-minor', relics: pickRelics(MINOR_RELICS, 2, state.campaign.relics || []), rewardSelected: false, nodeId: state.campaign.currentNode.id }
        } else if (nodeType === 'boss') {
          execEvent = { type: 'relic-major', relics: pickRelics(MAJOR_RELICS, 2, state.campaign.relics || []), rewardSelected: false, nodeId: state.campaign.currentNode.id }
        }
      }

      const relics = state.campaignRelics || []
      let relicTrackers = { ...(state.campaignRelicTrackers || {}) }

      if (current.team === TEAMS.ALLY) {
        const enemyKilled = Object.values(finalChars).some(c =>
          c.team === TEAMS.ENEMY && c.isDead && state.characters[c.id] && !state.characters[c.id].isDead
        )

        if (enemyKilled && relics.some(r => r.type === 'healOnKill') && finalChars[current.id]) {
          const healVal = relics.find(r => r.type === 'healOnKill').value || 5
          const cur = finalChars[current.id]
          finalChars = { ...finalChars, [current.id]: { ...cur, hp: Math.min(cur.maxHp, cur.hp + healVal) } }
          if (execChars[current.id]) {
            const ec = execChars[current.id]
            execChars = { ...execChars, [current.id]: { ...ec, hp: Math.min(ec.maxHp, ec.hp + healVal) } }
          }
          extraLogs.push(`🧛 Amulette vampirique ! ${current.name} récupère ${healVal} PV`)
        }
      }

      const newlyDead = Object.values(finalChars).filter(c =>
        c.team === TEAMS.ENEMY && c.isDead && state.characters[c.id] && !state.characters[c.id].isDead
      )
      if (newlyDead.length > 0 && current.team === TEAMS.ALLY) {
        newStats = { ...newStats, enemiesKilled: (newStats.enemiesKilled || 0) + newlyDead.length }
      }

      const newAllyDeaths = Object.values(finalChars).filter(c =>
        c.team === TEAMS.ALLY && c.isDead && state.characters[c.id] && !state.characters[c.id].isDead
      ).length
      if (newAllyDeaths > 0) {
        newStats = { ...newStats, allyDeaths: (newStats.allyDeaths || 0) + newAllyDeaths }
      }

      let newRunBestiary = { ...state.runBestiary }
      for (const dead of newlyDead) {
        const monsterId = dead.id?.replace(/^enemy-/, '').replace(/-\d+$/, '')
        if (monsterId) newRunBestiary[monsterId] = (newRunBestiary[monsterId] || 0) + 1
      }

      if (relics.some(r => r.type === 'autoRage')) {
        for (const id of Object.keys(finalChars)) {
          const c = finalChars[id]
          if (c.team === TEAMS.ALLY && !c.isDead && c.hp / c.maxHp < 0.25 && !hasStatus(c, 'rage')) {
            finalChars = { ...finalChars, [id]: { ...c, statuses: [...c.statuses, { type: 'rage', duration: 3 }] } }
            extraLogs.push(`💢 Pierre de rage ! ${c.name} entre en rage !`)
          }
        }
      }

      if (current.team === TEAMS.ENEMY && targetId && finalChars[targetId]) {
        const targetChar = finalChars[targetId]
        if (targetChar.team === TEAMS.ALLY && targetChar.isDead && !relicTrackers.phoenixUsed && relics.some(r => r.type === 'phoenixRevive')) {
          const phoenixRelic = relics.find(r => r.type === 'phoenixRevive')
          const reviveHp = Math.floor(targetChar.maxHp * (phoenixRelic.hpPercent || 0.5))
          finalChars = { ...finalChars, [targetId]: { ...targetChar, hp: reviveHp, isDead: false, animation: 'heal' } }
          relicTrackers = { ...relicTrackers, phoenixUsed: true }
          extraLogs.push(`🔥 Plume du phénix ! ${targetChar.name} revient avec ${reviveHp} PV !`)
        }
      }

      let cutInData = null
      if (current.team === TEAMS.ALLY) {
        const enemyKilled = Object.values(finalChars).some(c =>
          c.team === TEAMS.ENEMY && c.isDead && state.characters[c.id] && !state.characters[c.id].isDead
        )
        const isCrit = extraLogs.some(t => t.includes('CRITIQUE'))
        if (enemyKilled) {
          cutInData = { classId: current.classId, type: 'kill' }
        } else if (isCrit) {
          cutInData = { classId: current.classId, type: 'crit' }
        }
      }

      const refreshedInitiative = needInitiativeRefresh ? rollInitiative(execChars) : state.initiativeOrder
      const refreshedTurnIndex = needInitiativeRefresh
        ? refreshedInitiative.indexOf(state.initiativeOrder[state.currentTurnIndex])
        : state.currentTurnIndex

      return {
        ...state,
        characters: execChars,
        initiativeOrder: refreshedInitiative,
        currentTurnIndex: refreshedTurnIndex >= 0 ? refreshedTurnIndex : state.currentTurnIndex,
        terrain: terrainAfterAbility,
        stats: newStats,
        pendingReaction: reactionToPrompt,
        campaignRelicTrackers: relicTrackers,
        runBestiary: newRunBestiary,
        log: newLog.slice(-50),
        turnState: gameEnd ? TURN_STATES.IDLE : TURN_STATES.IDLE,
        selectedAbility: null,
        selectedCategory: null,
        validTargets: [],
        phase: resolvedPhase2 || state.phase,
        pendingCutIn: cutInData,
        campaign: execCampaign,
        campaignEvent: execEvent,
        pendingPaliers: execPendingPaliers,
        pendingLevelUps: execLevelUps,
        combatResult: execCombatResult,
        visualEvents: [
          ...(result.d20Roll ? [{ type: 'dice', value: result.d20Roll, isCrit: result.isCrit, isFail: result.isCritFail, id: `d20-${Date.now()}` }] : []),
          ...allVisuals
        ]
      }
    }

    case 'END_TURN': {
      const current = state.characters[state.initiativeOrder[state.currentTurnIndex]]
      const { effects } = processEndOfTurn(current)
      const { characters: newChars } = applyEffects(
        { characters: state.characters, stats: state.stats }, effects
      )

      const cooldownsReduced = { ...current.cooldowns }
      for (const key of Object.keys(cooldownsReduced)) {
        if (cooldownsReduced[key] > 0) cooldownsReduced[key]--
      }

      const resetCurrent = {
        ...newChars[current.id],
        actionUsed: false,
        bonusActionUsed: false,
        movementUsed: 0,
        cooldowns: cooldownsReduced,
        animation: null
      }

      let nextIndex = state.currentTurnIndex + 1
      let newRound = state.round
      let updatedChars = { ...newChars, [current.id]: resetCurrent }

      let updatedTerrain = state.terrain
      if (nextIndex >= state.initiativeOrder.length) {
        nextIndex = 0
        newRound++
        for (const id of Object.keys(updatedChars)) {
          updatedChars[id] = { ...updatedChars[id], reactionUsed: false }
        }
        updatedTerrain = tickDynamicTerrain(updatedTerrain)
      }

      let loopGuard = state.initiativeOrder.length * 2
      while (updatedChars[state.initiativeOrder[nextIndex]]?.isDead || updatedChars[state.initiativeOrder[nextIndex]]?.isCrystal) {
        if (--loopGuard <= 0) break
        nextIndex++
        if (nextIndex >= state.initiativeOrder.length) {
          nextIndex = 0
          newRound++
          for (const id of Object.keys(updatedChars)) {
            updatedChars[id] = { ...updatedChars[id], reactionUsed: false }
          }
          updatedTerrain = tickDynamicTerrain(updatedTerrain)
        }
      }

      let nextChar = updatedChars[state.initiativeOrder[nextIndex]]
      const isEnemy = nextChar?.team === TEAMS.ENEMY

      if (isEnemy && nextChar && (state.campaignRelics || []).some(r => r.type === 'slowAdjacent')) {
        const adjToAlly = Object.values(updatedChars).some(c =>
          c.team === TEAMS.ALLY && !c.isDead &&
          Math.max(Math.abs(c.position.x - nextChar.position.x), Math.abs(c.position.y - nextChar.position.y)) <= 1
        )
        if (adjToAlly && nextChar.movement > 1) {
          nextChar = { ...nextChar, movement: nextChar.movement - 1 }
          updatedChars = { ...updatedChars, [nextChar.id]: nextChar }
        }
      }

      const startResult = nextChar ? processStartOfTurn(nextChar, state.terrain) : { logs: [], effects: [] }
      if (nextChar) {
        const guardianResult = processGuardianDamage(nextChar, updatedChars)
        startResult.logs.push(...guardianResult.logs)
        startResult.effects.push(...guardianResult.effects)
      }
      let turnVisuals = []
      if (startResult.effects.length > 0) {
        const applied = applyEffects({ characters: updatedChars, stats: state.stats }, startResult.effects)
        updatedChars = applied.characters
        turnVisuals = applied.visualEvents || []
      }

      try {
        const nc = nextChar?.id ? updatedChars[nextChar.id] : null
        if (nc && nc._chargeReady && nc.team === TEAMS.ENEMY && !nc.isDead) {
          const turnsSincePhase = (nc._chargeTurnCount || 0) + 1
          updatedChars = { ...updatedChars, [nc.id]: { ...updatedChars[nc.id], _chargeTurnCount: turnsSincePhase } }
          if (turnsSincePhase % (nc._chargeEvery || 2) === 0) {
            const allyTargets = Object.values(updatedChars).filter(c => c.team === TEAMS.ALLY && !c.isDead && !c.isCrystal && c.position)
            if (allyTargets.length > 0) {
              const bossPos = updatedChars[nc.id].position
              const target = allyTargets.sort((a, b) => {
                const da = Math.abs(a.position.x - bossPos.x) + Math.abs(a.position.y - bossPos.y)
                const db = Math.abs(b.position.x - bossPos.x) + Math.abs(b.position.y - bossPos.y)
                return da - db
              })[0]
              if (target && target.position) {
                const chargeDmg = Math.floor(Math.random() * 8) + Math.floor(Math.random() * 8) + 6
                const dx = target.position.x > bossPos.x ? 1 : target.position.x < bossPos.x ? -1 : 0
                const dy = target.position.y > bossPos.y ? 1 : target.position.y < bossPos.y ? -1 : 0
                if (dx !== 0 || dy !== 0) {
                  const chargeRange = nc._chargeRange || 3
                  const chargeEffects = []
                  let finalPos = { ...bossPos }
                  startResult.logs.push(`🐂 ${nc.name} CHARGE !`)
                  for (let step = 1; step <= chargeRange; step++) {
                    const cx = bossPos.x + dx * step
                    const cy = bossPos.y + dy * step
                    if (cx < 0 || cx >= BOARD_COLS || cy < 0 || cy >= BOARD_ROWS) break
                    const blocked = Object.values(updatedChars).find(c => !c.isDead && c.position.x === cx && c.position.y === cy && c.team === TEAMS.ENEMY)
                    if (blocked) break
                    const hitChar = Object.values(updatedChars).find(c => !c.isDead && c.position.x === cx && c.position.y === cy && c.team === TEAMS.ALLY)
                    if (hitChar) {
                      chargeEffects.push({ type: 'damage', targetId: hitChar.id, amount: chargeDmg })
                      startResult.logs.push(`💥 ${hitChar.name} est percuté ! ${chargeDmg} dégâts !`)
                    }
                    finalPos = { x: cx, y: cy }
                  }
                  updatedChars = { ...updatedChars, [nc.id]: { ...updatedChars[nc.id], position: finalPos } }
                  if (chargeEffects.length > 0) {
                    const chargeApplied = applyEffects({ characters: updatedChars, stats: state.stats }, chargeEffects)
                    updatedChars = chargeApplied.characters
                    turnVisuals.push(...(chargeApplied.visualEvents || []))
                  }
                }
              }
            }
          }
        }

        if (nc && nc.statuses?.some(s => s.type === 'flying') && nc.team === TEAMS.ENEMY) {
          const flyStatus = nc.statuses.find(s => s.type === 'flying')
          if (flyStatus && flyStatus.duration <= 1) {
            const landX = 2 + Math.floor(Math.random() * 3)
            const landY = Math.floor(Math.random() * BOARD_ROWS)
            updatedChars = { ...updatedChars, [nc.id]: { ...updatedChars[nc.id], position: { x: landX, y: landY } } }
            const firePositions = [
              { x: landX - 1, y: landY }, { x: landX + 1, y: landY },
              { x: landX, y: landY - 1 }, { x: landX, y: landY + 1 }
            ].filter(p => p.x >= 0 && p.x < BOARD_COLS && p.y >= 0 && p.y < BOARD_ROWS)
            for (const p of firePositions) {
              updatedTerrain = { ...updatedTerrain, [`${p.x},${p.y}`]: { type: TERRAIN_TYPES.FIRE, emoji: '🔥', label: 'Feu draconique', damage: 6, duration: 3 } }
            }
            startResult.logs.push(`🐉 ${nc.name} atterrit et crée des flammes !`)
          }
        }
      } catch (e) {
        // Boss mechanic error - continue without crash
      }

      const gameEnd = checkGameEnd(updatedChars, state.combatObjective, state.round)
      if (gameEnd) {
        const resolvedPhase = resolveCampaignPhase(state, gameEnd)
        let restChars = updatedChars
        let endCampaign = state.campaign
        let endEvent = state.campaignEvent
        let endPendingPaliers = state.pendingPaliers
        let endCombatResult = state.combatResult
        let endLevelUps = state.pendingLevelUps
        if (resolvedPhase === PHASES.CAMPAIGN_MAP) {
          const runMods2 = resolveModifiers(state.campaign.modifiers)
          const hasHeal2 = teamHasHealer(updatedChars)
          const restBonus2 = (state.campaign.gloryUpgrades?.['rest-bonus'] || 0) * 0.05
          restChars = { ...updatedChars, ...applyCampaignRest(updatedChars, (hasHeal2 ? 0.3 : 0.45) + restBonus2) }
          const nodeType = state.campaign.currentNode?.type
          const eliteXpBonus2 = nodeType === 'elite' ? (state.campaign.gloryUpgrades?.['xp-boost'] || 0) : 0
          const xpGain = (nodeType === 'boss' ? 3 : nodeType === 'elite' ? 2 : 1) + eliteXpBonus2
          const newXp = (state.campaign.xp || 0) + Math.floor(xpGain * runMods2.xpMult)
          const palierResult2 = applyNewPaliers(restChars, newXp, state.campaign.appliedPaliers || [])
          restChars = palierResult2.characters
          const baseGold2 = nodeType === 'boss' ? GOLD_REWARDS.boss : nodeType === 'elite' ? GOLD_REWARDS.elite : GOLD_REWARDS.combat
          const goldGain2 = Math.floor(baseGold2 * runMods2.goldMult * (nodeType !== 'boss' && nodeType !== 'elite' ? runMods2.combatGoldMult : 1))
          endCampaign = { ...advanceCampaignAfterCombat(state.campaign), xp: newXp, appliedPaliers: palierResult2.appliedPaliers, evolved: palierResult2.didEvolve || state.campaign.evolved, gold: (state.campaign.gold || 0) + goldGain2 }
          endPendingPaliers = palierResult2.pendingChoices || []
          endCombatResult = { victory: true, gold: goldGain2, xp: xpGain }
          endLevelUps = checkLevelUps(newXp, restChars)
          if (nodeType === 'elite') {
            endEvent = { type: 'relic-minor', relics: pickRelics(MINOR_RELICS, 2, state.campaign.relics || []), rewardSelected: false, nodeId: state.campaign.currentNode.id }
          } else if (nodeType === 'boss') {
            endEvent = { type: 'relic-major', relics: pickRelics(MAJOR_RELICS, 2, state.campaign.relics || []), rewardSelected: false, nodeId: state.campaign.currentNode.id }
          }
        }
        return {
          ...state,
          characters: restChars,
          phase: resolvedPhase,
          campaign: endCampaign,
          campaignEvent: endEvent,
          pendingPaliers: endPendingPaliers,
          pendingLevelUps: endLevelUps,
          combatResult: endCombatResult,
          visualEvents: turnVisuals,
          currentTurnIndex: nextIndex,
          round: newRound,
          log: [...state.log, ...startResult.logs.map(t => ({ text: t, type: 'info' }))].slice(-50),
          stats: { ...state.stats, rounds: newRound }
        }
      }

      const obj = state.combatObjective
      let extraObjLogs = []

      if (obj?.type === 'stopReinforcements' && obj.spawnRounds?.includes(newRound)) {
        const mId = obj.spawnMonster || 'goblin'
        shuffleEnemySlots()
        const reinforcement = createMonster(mId, Object.keys(updatedChars).length, [mId])
        reinforcement.uses = initUses(reinforcement)
        const openSlots = _enemySlots.filter(s => !Object.values(updatedChars).some(c => !c.isDead && c.position.x === s.x && c.position.y === s.y))
        if (openSlots.length > 0) reinforcement.position = openSlots[0]
        updatedChars = { ...updatedChars, [reinforcement.id]: reinforcement }
        const newInitOrder = rollInitiative(updatedChars)
        extraObjLogs.push(`⚠️ Des renforts arrivent ! ${reinforcement.name} rejoint le combat !`)
        return {
          ...state,
          characters: updatedChars,
          initiativeOrder: newInitOrder,
          terrain: updatedTerrain,
          currentTurnIndex: newInitOrder.indexOf(state.initiativeOrder[nextIndex]),
          round: newRound,
          turnState: isEnemy ? TURN_STATES.ENEMY_TURN : TURN_STATES.IDLE,
          selectedAbility: null, selectedCategory: null, validTargets: [], validMoves: [],
          log: [...state.log, ...startResult.logs.map(t => ({ text: t, type: 'info' })), ...extraObjLogs.map(t => ({ text: t, type: 'system' })), { text: `--- Tour de ${nextChar.name} (${nextChar.classData.name}) ---`, type: 'turn' }].slice(-50),
          stats: { ...state.stats, rounds: newRound },
          visualEvents: turnVisuals
        }
      }

      let storySpawnLogs = []
      const storyConfig = state.story?.combatConfig
      if (storyConfig?.enemies && state.story?.active) {
        const pendingGroups = storyConfig.enemies.filter(g => g.spawnRound === newRound)
        for (const group of pendingGroups) {
          shuffleEnemySlots()
          for (let i = 0; i < group.count; i++) {
            const reinforcement = createMonster(group.monsterId, Object.keys(updatedChars).length + i, [group.monsterId])
            reinforcement.uses = initUses(reinforcement)
            const openSlots = _enemySlots.filter(s => !Object.values(updatedChars).some(c => !c.isDead && c.position.x === s.x && c.position.y === s.y))
            if (openSlots.length > 0) reinforcement.position = openSlots[i % openSlots.length]
            updatedChars = { ...updatedChars, [reinforcement.id]: reinforcement }
            storySpawnLogs.push(`⚠️ ${reinforcement.name} émerge du brouillard !`)
          }
        }

        if (storyConfig.respawnAfter) {
          const deadEnemies = Object.values(updatedChars).filter(c => c.team === TEAMS.ENEMY && c.isDead && c._deathRound && newRound - c._deathRound >= storyConfig.respawnAfter)
          for (const dead of deadEnemies) {
            const openSlots = _enemySlots.filter(s => !Object.values(updatedChars).some(c => !c.isDead && c.position.x === s.x && c.position.y === s.y))
            if (openSlots.length > 0) {
              updatedChars = { ...updatedChars, [dead.id]: { ...dead, hp: dead.maxHp, isDead: false, position: openSlots[0], animation: null, _deathRound: null } }
              storySpawnLogs.push(`👤 Une silhouette se reforme...`)
            }
          }
        }

        if (storySpawnLogs.length > 0 || pendingGroups.length > 0) {
          const newInitOrder = rollInitiative(updatedChars)
          return {
            ...state,
            characters: updatedChars,
            initiativeOrder: newInitOrder,
            terrain: updatedTerrain,
            currentTurnIndex: Math.max(0, newInitOrder.indexOf(state.initiativeOrder[nextIndex])),
            round: newRound,
            turnState: isEnemy ? TURN_STATES.ENEMY_TURN : TURN_STATES.IDLE,
            selectedAbility: null, selectedCategory: null, validTargets: [], validMoves: [],
            log: [...state.log, ...startResult.logs.map(t => ({ text: t, type: 'info' })), ...storySpawnLogs.map(t => ({ text: t, type: 'system' })), { text: `--- Tour de ${nextChar.name} (${nextChar.classData.name}) ---`, type: 'turn' }].slice(-50),
            stats: { ...state.stats, rounds: newRound },
            visualEvents: turnVisuals
          }
        }
      }

      return {
        ...state,
        characters: updatedChars,
        terrain: updatedTerrain,
        currentTurnIndex: nextIndex,
        round: newRound,
        turnState: isEnemy ? TURN_STATES.ENEMY_TURN : TURN_STATES.IDLE,
        selectedAbility: null,
        selectedCategory: null,
        validTargets: [],
        validMoves: [],
        log: [
          ...state.log,
          ...startResult.logs.map(t => ({ text: t, type: 'info' })),
          { text: `--- Tour de ${nextChar.name} (${nextChar.classData.name}) ---`, type: 'turn' }
        ].slice(-50),
        stats: { ...state.stats, rounds: newRound },
        visualEvents: turnVisuals
      }
    }

    case 'MOVE_AI': {
      const { characterId, position } = action.payload
      let char = state.characters[characterId]
      if (!char) return state
      char = { ...char, facingRight: position.x > char.position.x }

      const aoResult = resolveOpportunityAttacks(char, char.position, position, state.characters)
      let updatedChars = { ...state.characters }
      let aoLogs = [{ text: `🏃 ${char.name} se déplace`, type: 'info' }]

      let aiAoVisuals = []
      if (aoResult.effects.length > 0) {
        const applied = applyEffects({ characters: updatedChars, stats: state.stats }, aoResult.effects)
        updatedChars = applied.characters
        aiAoVisuals = applied.visualEvents || []
        aoLogs.push(...aoResult.logs.map(t => ({ text: t, type: t.includes('Raté') ? 'miss' : 'info' })))
      }

      const movedChar = updatedChars[characterId]
      if (movedChar.isDead) {
        const gameEnd = checkGameEnd(updatedChars, state.combatObjective, state.round)
        return {
          ...state,
          characters: updatedChars,
          log: [...state.log, ...aoLogs].slice(-50),
          visualEvents: aiAoVisuals,
          phase: resolveCampaignPhase(state, gameEnd) || state.phase
        }
      }

      return {
        ...state,
        characters: {
          ...updatedChars,
          [characterId]: { ...movedChar, position, movementUsed: char.movement, facingRight: char.facingRight }
        },
        log: [...state.log, ...aoLogs].slice(-50),
        visualEvents: aiAoVisuals
      }
    }

    case 'CLEAR_ANIMATION': {
      const { characterId } = action.payload
      const char = state.characters[characterId]
      if (!char) return state
      return {
        ...state,
        characters: { ...state.characters, [characterId]: { ...char, animation: null } }
      }
    }

    case 'SET_TURN_STATE': {
      return { ...state, turnState: action.payload.turnState }
    }

    case 'BACK_TO_IDLE': {
      return {
        ...state,
        turnState: TURN_STATES.IDLE,
        selectedAbility: null,
        selectedCategory: null,
        validTargets: [],
        validMoves: []
      }
    }

    case 'RESTART': {
      clearCampaignSave()
      return { ...initialState, phase: PHASES.HUB }
    }

    case 'PLACE_CHARACTER': {
      const { characterId, x, y } = action.payload
      if (x > 1 || y >= BOARD_ROWS) return state
      const occupied = Object.values(state.characters).some(c => !c.isDead && c.position.x === x && c.position.y === y && c.id !== characterId)
      if (occupied) return state
      const char = state.characters[characterId]
      if (!char || char.team !== TEAMS.ALLY) return state
      return {
        ...state,
        characters: { ...state.characters, [characterId]: { ...char, position: { x, y } } }
      }
    }

    case 'CONFIRM_PLACEMENT': {
      if (!state.initiativeOrder || state.initiativeOrder.length === 0) return state
      const firstChar = state.characters[state.initiativeOrder[0]]
      if (!firstChar) return state
      const firstIsEnemy = firstChar.team === TEAMS.ENEMY
      return {
        ...state,
        turnState: firstIsEnemy ? TURN_STATES.ENEMY_TURN : TURN_STATES.IDLE,
        log: [...state.log, { text: `--- Tour de ${firstChar.name} (${firstChar.classData.name}) ---`, type: 'turn' }]
      }
    }

    case 'CLEAR_VISUALS': {
      return { ...state, visualEvents: [] }
    }

    case 'CLEAR_CUTIN': {
      return { ...state, pendingCutIn: null }
    }

    case 'CONFIRM_REACTION': {
      if (!state.pendingReaction) return state
      const { effects, logs } = state.pendingReaction
      const { characters: reactChars, stats: reactStats, visualEvents: reactVisuals } = applyEffects(
        { characters: state.characters, stats: state.stats }, effects
      )
      const reactLog = [...state.log, ...logs.map(t => ({ text: t, type: t.includes('soins') ? 'heal' : 'info' }))]
      return {
        ...state,
        characters: reactChars,
        stats: reactStats,
        log: reactLog.slice(-50),
        visualEvents: reactVisuals,
        pendingReaction: null
      }
    }

    case 'SKIP_REACTION': {
      return { ...state, pendingReaction: null }
    }

    case 'EQUIP_ITEM': {
      const { characterId, item } = action.payload
      const char = state.characters[characterId]
      if (!char || char.team !== TEAMS.ALLY) return state
      const slot = item.slot
      const charEquip = { ...(state.campaign.equipment[characterId] || { weapon: null, armor: null, boots: null }) }
      let newInventory = [...(state.campaign.equipmentInventory || [])]
      let updatedChar = { ...char }

      const currentItem = charEquip[slot]
      if (currentItem) {
        newInventory.push(currentItem)
        if (currentItem.effects) {
          for (const e of currentItem.effects) {
            if (e.stat === 'maxHp') { updatedChar.maxHp -= e.value; updatedChar.hp = Math.min(updatedChar.hp, updatedChar.maxHp) }
            else { updatedChar[e.stat] = (updatedChar[e.stat] || 0) - e.value }
          }
        }
      }

      const idx = newInventory.findIndex(i => i.id === item.id)
      if (idx >= 0) newInventory.splice(idx, 1)

      charEquip[slot] = item
      if (item.effects) {
        for (const e of item.effects) {
          if (e.stat === 'maxHp') { updatedChar.maxHp += e.value; updatedChar.hp += e.value }
          else { updatedChar[e.stat] = (updatedChar[e.stat] || 0) + e.value }
        }
      }

      return {
        ...state,
        characters: { ...state.characters, [characterId]: updatedChar },
        campaign: { ...state.campaign, equipment: { ...state.campaign.equipment, [characterId]: charEquip }, equipmentInventory: newInventory }
      }
    }

    case 'UNEQUIP_ITEM': {
      const { characterId, slot } = action.payload
      const char = state.characters[characterId]
      if (!char) return state
      const charEquip = { ...(state.campaign.equipment[characterId] || { weapon: null, armor: null, boots: null }) }
      const item = charEquip[slot]
      if (!item) return state

      let updatedChar = { ...char }
      if (item.effects) {
        for (const e of item.effects) {
          if (e.stat === 'maxHp') { updatedChar.maxHp -= e.value; updatedChar.hp = Math.min(updatedChar.hp, updatedChar.maxHp) }
          else { updatedChar[e.stat] = (updatedChar[e.stat] || 0) - e.value }
        }
      }

      charEquip[slot] = null
      const newInventory = [...(state.campaign.equipmentInventory || []), item]

      return {
        ...state,
        characters: { ...state.characters, [characterId]: updatedChar },
        campaign: { ...state.campaign, equipment: { ...state.campaign.equipment, [characterId]: charEquip }, equipmentInventory: newInventory }
      }
    }

    case 'TOGGLE_REACTIONS': {
      const { characterId } = action.payload
      const char = state.characters[characterId]
      if (!char) return state
      return {
        ...state,
        characters: {
          ...state.characters,
          [characterId]: { ...char, reactionsEnabled: char.reactionsEnabled === false ? true : false }
        }
      }
    }

    case 'SET_PHASE': {
      return { ...state, phase: action.payload.phase }
    }

    case 'START_CAMPAIGN': {
      clearCampaignSave()
      const { allyClasses, modifiers = [], glory = {} } = action.payload
      const characters = {}

      allyClasses.forEach((classId, i) => {
        let char = createCharacter(classId, TEAMS.ALLY, i)
        char = stripToBaseKit(char)
        char.uses = initUses(char)
        characters[char.id] = char
      })

      const startGold = (glory.upgrades?.['base-gold'] || 0) * 10
      const hpBonus = (glory.upgrades?.['base-hp'] || 0) * 2
      const mods = resolveModifiers(modifiers)

      for (const id of Object.keys(characters)) {
        if (hpBonus > 0) { characters[id].maxHp += hpBonus; characters[id].hp += hpBonus }
        if (mods.allyHpMult !== 1) {
          characters[id].maxHp = Math.floor(characters[id].maxHp * mods.allyHpMult)
          characters[id].hp = Math.floor(characters[id].hp * mods.allyHpMult)
        }
        if (mods.allyAtkBonus) characters[id].attackBonus += mods.allyAtkBonus
      }

      return {
        ...state,
        phase: PHASES.CAMPAIGN_MAP,
        characters,
        campaign: {
          active: true, act: 0,
          map: generateCampaignMap(0),
          currentLayer: 0, lastNodeId: null,
          visitedNodes: [], currentNode: null,
          rewards: [], xp: 0, appliedPaliers: [], evolved: false, relics: [], gold: startGold, inventory: [],
          equipment: Object.fromEntries(allyClasses.map(c => [`ally-${c}`, { weapon: null, armor: null, boots: null }])),
          equipmentInventory: [],
          modifiers,
          fogOfWar: resolveModifiers(modifiers).fogOfWar || false,
          gloryUpgrades: glory.upgrades || {}
        },
        campaignEvent: null,
        stats: freshStats()
      }
    }

    case 'CAMPAIGN_SELECT_NODE': {
      const { node } = action.payload
      const campaign = state.campaign
      const newVisited = [...campaign.visitedNodes, node.id]

      if (node.type === 'rest') {
        const hasHealRest = teamHasHealer(state.characters)
        const restMods = resolveModifiers(campaign.modifiers)
        const restGloryBonus = (campaign.gloryUpgrades?.['rest-bonus'] || 0) * 0.05
        const restFactor = ((hasHealRest ? 0.5 : 0.7) + restGloryBonus) * restMods.restHealMult
        const healed = { ...state.characters, ...applyCampaignRest(state.characters, restFactor) }
        return {
          ...state,
          characters: healed,
          campaignEvent: { type: 'rest', healPercent: Math.round(restFactor * 100), nodeId: node.id },
          campaign: { ...campaign, visitedNodes: newVisited }
        }
      }

      if (node.type === 'treasure') {
        const tMods = resolveModifiers(campaign.modifiers)
        const goldGain = Math.floor(GOLD_REWARDS.treasure * tMods.treasureGoldMult * tMods.goldMult)
        const teamClasses = Object.values(state.characters).filter(c => c.team === TEAMS.ALLY).map(c => c.classId)
        const ownedEquipIds = [...(campaign.equipmentInventory || []).map(i => i.id), ...Object.values(campaign.equipment || {}).flatMap(s => Object.values(s).filter(Boolean).map(i => i.id))]
        const treasureEquip = generateTreasureEquipment(campaign.act, ownedEquipIds, teamClasses)
        const newCampaign = { ...campaign, visitedNodes: newVisited, gold: (campaign.gold || 0) + goldGain }
        if (treasureEquip) {
          newCampaign.equipmentInventory = [...(newCampaign.equipmentInventory || []), treasureEquip]
        }
        return {
          ...state,
          campaignEvent: { type: 'treasure', goldGain, equipmentReward: treasureEquip, nodeId: node.id },
          campaign: newCampaign
        }
      }

      if (node.type === 'merchant') {
        const merchDiscount = 1 - (campaign.gloryUpgrades?.['merchant-discount'] || 0) * 0.1
        const merchMods = resolveModifiers(campaign.modifiers)
        return {
          ...state,
          campaignEvent: {
            type: 'merchant',
            items: generateShopItems(),
            equipmentItems: generateShopEquipment(campaign.act, (campaign.equipmentInventory || []).map(i => i.id), Object.values(state.characters).filter(c => c.team === TEAMS.ALLY).map(c => c.classId)),
            nodeId: node.id,
            shopCostMult: merchMods.shopCostMult * merchDiscount
          },
          campaign: { ...campaign, visitedNodes: newVisited }
        }
      }

      const act = ACTS[campaign.act]
      const characters = {}
      const allies = Object.values(state.characters).filter(c => c.team === TEAMS.ALLY)
      allies.forEach((char, i) => {
        characters[char.id] = {
          ...char,
          position: getAllyPosition(i),
          actionUsed: false, bonusActionUsed: false, reactionUsed: false,
          movementUsed: 0, cooldowns: {}, animation: null,
          uses: initUses(char)
        }
      })

      const combatMods = resolveModifiers(campaign.modifiers)
      shuffleEnemySlots()
      const monsterList = [...node.encounter.monsters]
      if (combatMods.extraEnemy && node.type === 'combat' && monsterList.length > 0) {
        monsterList.push(monsterList[0])
      }
      monsterList.forEach((monsterId, i) => {
        const monster = createMonster(monsterId, i, monsterList)
        monster.uses = initUses(monster)
        if (combatMods.enemyHpMult !== 1) {
          monster.maxHp = Math.floor(monster.maxHp * combatMods.enemyHpMult)
          monster.hp = monster.maxHp
        }
        characters[monster.id] = monster
      })

      const objective = node.encounter.objective || null

      if (objective?.type === 'killLeader') {
        const leaderIdx = objective.leaderIndex || 0
        const monsterIds = Object.keys(characters).filter(id => characters[id].team === TEAMS.ENEMY)
        if (monsterIds[leaderIdx]) {
          characters[monsterIds[leaderIdx]] = { ...characters[monsterIds[leaderIdx]], isLeader: true, maxHp: characters[monsterIds[leaderIdx]].maxHp + 5, hp: characters[monsterIds[leaderIdx]].hp + 5 }
        }
      }

      if (objective?.type === 'protect') {
        characters['objective-crystal'] = {
          id: 'objective-crystal', name: 'Cristal', emoji: '💎', team: TEAMS.ALLY,
          classId: 'crystal', classData: { name: 'Cristal', abilities: { actions: [], bonusActions: [], reactions: [] } },
          hp: objective.crystalHp || 25, maxHp: objective.crystalHp || 25,
          ac: 8, attackBonus: 0, movement: 0, range: 0,
          position: { x: 3, y: 2 },
          actionUsed: true, bonusActionUsed: true, reactionUsed: true, movementUsed: 0,
          statuses: [], cooldowns: {}, uses: {}, concentration: null,
          isDead: false, initiative: -99, animation: null, isCrystal: true
        }
      }

      const relics = (campaign.relics || []).map(r => r.relicEffect).filter(Boolean)

      for (const id of Object.keys(characters)) {
        if (characters[id].team === TEAMS.ALLY) {
          characters[id] = { ...characters[id], relicEffects: relics }
          if (relics.some(r => r.type === 'teamAdvantageR1')) {
            characters[id] = { ...characters[id], statuses: [...characters[id].statuses, { type: 'advantage', duration: 1 }] }
          }
        }
      }

      const initiativeOrder = rollInitiative(characters)
      const firstChar = characters[initiativeOrder[0]]
      const firstIsEnemy = firstChar?.team === TEAMS.ENEMY
      const { terrain, theme: terrainTheme, themeName } = generateTerrain(act.terrainTheme)

      return {
        ...state,
        phase: PHASES.COMBAT,
        characters, initiativeOrder,
        currentTurnIndex: 0, round: 1,
        turnState: TURN_STATES.PLACING,
        combatObjective: objective,
        campaignRelics: relics,
        campaignRelicTrackers: { healDone: false, phoenixUsed: false, cancelCritUsed: false },
        placingCharIndex: 0,
        terrain, terrainTheme, terrainThemeName: themeName,
        campaign: { ...campaign, currentNode: node, visitedNodes: newVisited },
        campaignEvent: null,
        selectedAbility: null, selectedCategory: null,
        validTargets: [], validMoves: [],
        log: [
          { text: `📜 ${act.name}`, type: 'system' },
          { text: `⚔️ ${node.encounter.name}`, type: 'system' },
          { text: `🗺️ ${themeName}`, type: 'system' }
        ],
        stats: freshStats(),
        combatInventory: (() => {
          const inv = [...(state.combatInventory || [])]
          const allies = Object.values(characters).filter(c => c.team === TEAMS.ALLY)
          if (!allies.some(c => c.classId === 'clerc')) {
            const extraPotions = 1 + (state.campaign.gloryUpgrades?.['potion-slot'] || 0)
            for (let p = 0; p < extraPotions; p++) inv.push({ ...SURVIVAL_POTION, id: `survival-potion-${p}` })
          }
          return inv
        })()
      }
    }

    case 'CAMPAIGN_EVENT_REWARD': {
      const { reward } = action.payload
      const event = state.campaignEvent
      const isRelic = event?.type === 'relic-minor' || event?.type === 'relic-major'

      let updatedChars = state.characters
      let newCampaign = { ...state.campaign }

      if (isRelic) {
        newCampaign.relics = [...(newCampaign.relics || []), { id: reward.id, name: reward.name, icon: reward.icon, desc: reward.desc, relicEffect: reward.relicEffect }]
      } else if (reward.slot) {
        if ((newCampaign.gold || 0) < reward.cost) return state
        newCampaign.gold = (newCampaign.gold || 0) - reward.cost
        newCampaign.equipmentInventory = [...(newCampaign.equipmentInventory || []), reward]
        const purchased = [...(event.purchasedIds || []), reward.id]
        return { ...state, campaignEvent: { ...event, purchasedIds: purchased }, campaign: newCampaign }
      } else if (event?.type === 'merchant') {
        if ((newCampaign.gold || 0) < reward.cost) return state
        newCampaign.gold = (newCampaign.gold || 0) - reward.cost
        const newInventory = [...(state.combatInventory || []), {
          id: reward.id, name: reward.name, emoji: reward.icon, description: reward.desc,
          actionType: reward.actionType || 'bonus', targetType: reward.targetType || 'self',
          effect: reward.effect, healDice: reward.healDice, acBonus: reward.acBonus,
          duration: reward.duration, terrainType: reward.terrainType, terrainEmoji: reward.terrainEmoji,
          terrainLabel: reward.terrainLabel, aoeSize: reward.aoeSize, range: reward.range,
          fireDamage: reward.fireDamage, fireDuration: reward.fireDuration
        }]
        const purchased = [...(event.purchasedIds || []), reward.id]
        return {
          ...state,
          campaignEvent: { ...event, purchasedIds: purchased },
          campaign: newCampaign,
          combatInventory: newInventory
        }
      }

      return {
        ...state,
        characters: updatedChars,
        campaignEvent: { ...event, rewardSelected: true },
        campaign: newCampaign
      }
    }

    case 'USE_ITEM': {
      const { item, targetCell } = action.payload
      const current = state.characters[state.initiativeOrder[state.currentTurnIndex]]
      const result = resolveItemUse(current, item, targetCell, state.terrain, state.characters)

      const { characters: newChars, stats: newStats, visualEvents: itemVisuals } = applyEffects(
        { characters: state.characters, stats: state.stats }, result.effects
      )

      const isBonus = item.actionType === 'bonus'
      const updatedCurrent = {
        ...newChars[current.id],
        actionUsed: isBonus ? newChars[current.id].actionUsed : true,
        bonusActionUsed: isBonus ? true : newChars[current.id].bonusActionUsed
      }

      const inventory = [...(state.combatInventory || [])]
      const idx = inventory.findIndex(i => i.id === item.id)
      if (idx >= 0) inventory.splice(idx, 1)

      return {
        ...state,
        characters: { ...newChars, [current.id]: updatedCurrent },
        stats: { ...newStats, potionsUsed: (newStats.potionsUsed || 0) + 1 },
        terrain: result.terrain,
        combatInventory: inventory,
        log: [...state.log, ...result.logs.map(t => ({ text: t, type: 'info' }))].slice(-50),
        turnState: TURN_STATES.IDLE,
        selectedAbility: null,
        selectedCategory: null,
        validTargets: [],
        validMoves: [],
        visualEvents: itemVisuals || []
      }
    }

    case 'LEVEL_UP_CHOOSE': {
      const { characterId, ability } = action.payload
      const updatedChars = applyLevelUpAbility(state.characters, characterId, ability)
      const remaining = state.pendingLevelUps.slice(1)
      return { ...state, characters: updatedChars, pendingLevelUps: remaining }
    }

    case 'NARRATIVE_CHOICE': {
      const { choice } = action.payload
      let updatedChars = { ...state.characters }
      let newCampaign = { ...state.campaign }
      const logs = []

      if (choice.effect === 'none') {
        return { ...state, narrativeEvent: null }
      }
      if (choice.effect === 'teamHeal') {
        for (const [id, char] of Object.entries(updatedChars)) {
          if (char.team !== 'ally') continue
          const missing = char.maxHp - char.hp
          updatedChars[id] = { ...char, hp: char.hp + Math.floor(missing * (choice.value || 0.3)) }
        }
      }
      if (choice.effect === 'sacrifice') {
        const allies = Object.entries(updatedChars).filter(([, c]) => c.team === 'ally' && !c.isDead)
        for (const [id, char] of allies) {
          updatedChars[id] = { ...char, hp: Math.max(1, char.hp - (choice.hpCost || 0)) }
        }
        if (choice.stat) {
          const best = allies.sort((a, b) => b[1].hp - a[1].hp)[0]
          if (best) updatedChars[best[0]] = { ...updatedChars[best[0]], [choice.stat]: (updatedChars[best[0]][choice.stat] || 0) + (choice.value || 0) }
        }
      }
      if (choice.effect === 'helpTraveler') {
        newCampaign.gold = (newCampaign.gold || 0) + (choice.gold || 0)
        const potion = { ...SURVIVAL_POTION, id: `traveler-potion-${Date.now()}` }
        return { ...state, characters: updatedChars, campaign: newCampaign, narrativeEvent: null, combatInventory: [...(state.combatInventory || []), potion] }
      }
      if (choice.effect === 'safeGold') {
        newCampaign.gold = (newCampaign.gold || 0) + (choice.gold || 0)
      }
      if (choice.effect === 'robTraveler') {
        newCampaign.gold = (newCampaign.gold || 0) + (choice.gold || 0)
        for (const [id, char] of Object.entries(updatedChars)) {
          if (char.team === 'ally') updatedChars[id] = { ...char, hp: Math.max(1, char.hp - (choice.hpCost || 0)) }
        }
      }
      if (choice.effect === 'gamble') {
        if (Math.random() < (choice.successRate || 0.5)) {
          newCampaign.gold = (newCampaign.gold || 0) + (choice.goldWin || 0)
        } else {
          for (const [id, char] of Object.entries(updatedChars)) {
            if (char.team === 'ally') updatedChars[id] = { ...char, hp: Math.max(1, char.hp - (choice.hpLoss || 0)) }
          }
        }
      }
      if (choice.effect === 'redShroom') {
        for (const [id, char] of Object.entries(updatedChars)) {
          if (char.team !== 'ally') continue
          updatedChars[id] = { ...char, maxHp: char.maxHp + (choice.hpMaxBonus || 0), hp: Math.max(1, char.hp - (choice.hpCost || 0)) + (choice.hpMaxBonus || 0) }
        }
      }
      if (choice.effect === 'fillPotions') {
        const potions = []
        for (let i = 0; i < (choice.potions || 1); i++) {
          potions.push({ ...SURVIVAL_POTION, id: `event-potion-${Date.now()}-${i}` })
        }
        return { ...state, characters: updatedChars, campaign: newCampaign, narrativeEvent: null, combatInventory: [...(state.combatInventory || []), ...potions] }
      }
      if (choice.effect === 'buyUpgrade') {
        if ((newCampaign.gold || 0) < (choice.cost || 0)) return { ...state, narrativeEvent: null }
        newCampaign.gold -= choice.cost
        const allies = Object.entries(updatedChars).filter(([, c]) => c.team === 'ally' && !c.isDead)
        const best = allies.sort((a, b) => b[1].hp - a[1].hp)[0]
        if (best && choice.stat) updatedChars[best[0]] = { ...updatedChars[best[0]], [choice.stat]: (updatedChars[best[0]][choice.stat] || 0) + (choice.value || 0) }
      }
      if (choice.effect === 'haggle') {
        if (Math.random() < 0.5) {
          const allies = Object.entries(updatedChars).filter(([, c]) => c.team === 'ally' && !c.isDead)
          const best = allies.sort((a, b) => b[1].hp - a[1].hp)[0]
          if (best && choice.stat) updatedChars[best[0]] = { ...updatedChars[best[0]], [choice.stat]: (updatedChars[best[0]][choice.stat] || 0) + (choice.value || 0) }
        } else {
          newCampaign.gold = Math.max(0, (newCampaign.gold || 0) - (choice.cost || 0))
        }
      }
      if (choice.effect === 'fountain' && choice.stat) {
        const allies = Object.entries(updatedChars).filter(([, c]) => c.team === 'ally' && !c.isDead)
        const best = allies.sort((a, b) => b[1].hp - a[1].hp)[0]
        if (best) {
          const ch = updatedChars[best[0]]
          updatedChars[best[0]] = {
            ...ch,
            [choice.stat]: (ch[choice.stat] || 0) + (choice.value || 0),
            statuses: [...ch.statuses, { type: 'poison', duration: choice.poisonDuration || 2, damage: 4, source: 'Fontaine obscure' }]
          }
        }
      }

      return { ...state, characters: updatedChars, campaign: newCampaign, narrativeEvent: null }
    }

    case 'CAMPAIGN_APPLY_PALIER': {
      const { palier, characterId } = action.payload
      const updatedChars = applyPalierToCharacter(state.characters, palier, characterId)
      const remaining = state.pendingPaliers.filter(p => p.id !== palier.id)
      return { ...state, characters: updatedChars, pendingPaliers: remaining }
    }

    case 'CAMPAIGN_DISMISS_RESULT': {
      return { ...state, combatResult: null }
    }

    case 'CAMPAIGN_EVENT_DONE': {
      const event = state.campaignEvent
      const isRelic = event?.type === 'relic-minor' || event?.type === 'relic-major'
      const nodeId = event?.nodeId || state.campaign.currentNode?.id

      let newCampaign = { ...state.campaign, currentNode: null }

      if (!isRelic) {
        newCampaign.currentLayer = state.campaign.currentLayer + 1
        newCampaign.lastNodeId = nodeId
      }

      if (event?.type === 'relic-major' && state.campaign.act < ACTS.length - 1) {
        const nextAct = state.campaign.act + 1
        newCampaign = {
          ...newCampaign,
          act: nextAct,
          map: generateCampaignMap(nextAct),
          currentLayer: 0,
          lastNodeId: null,
          visitedNodes: []
        }
      }

      return { ...state, campaignEvent: null, campaign: newCampaign }
    }

    case 'START_STORY': {
      const { chapter } = action.payload
      const saved = loadStoryState()
      if (saved && saved.chapterId === chapter.id) {
        return {
          ...state,
          phase: PHASES.STORY,
          story: { ...state.story, ...saved, active: true }
        }
      }
      return {
        ...state,
        phase: PHASES.STORY,
        story: {
          active: true,
          chapterId: chapter.id,
          sequenceId: chapter.startSequence,
          blockIndex: 0,
          choices: {},
          companion: null,
          completed: saved?.completed || state.story.completed || []
        }
      }
    }

    case 'NEW_STORY': {
      const { chapter } = action.payload
      clearStoryState()
      return {
        ...state,
        phase: PHASES.STORY,
        story: {
          active: true,
          chapterId: chapter.id,
          sequenceId: chapter.startSequence,
          blockIndex: 0,
          choices: {},
          companion: null,
          completed: state.story.completed || []
        }
      }
    }

    case 'STORY_START_COMBAT': {
      const { config } = action.payload
      const { story } = state
      const characters = {}
      const gridCols = config.gridCols || BOARD_COLS
      const gridRows = config.gridRows || BOARD_ROWS

      const playerClassId = story.choices.classId || 'guerrier'
      const playerName = story.choices.playerName || 'Héros'
      const playerChar = createCharacter(playerClassId, TEAMS.ALLY, 0)
      playerChar.name = playerName
      playerChar.id = 'story-player'
      playerChar.position = { x: 0, y: Math.floor(gridRows / 2) }
      playerChar.uses = initUses(playerChar)
      characters[playerChar.id] = playerChar

      if (config.allies === 'player-and-companion' && story.companion) {
        const comp = createCharacter(story.companion.classId, TEAMS.ALLY, 1)
        comp.name = story.companion.name
        comp.id = 'story-companion'
        comp.position = { x: 0, y: Math.floor(gridRows / 2) + 1 }
        comp.uses = initUses(comp)
        characters[comp.id] = comp
      }

      let enemyIdx = 0
      const enemySlots = []
      for (let x = gridCols - 2; x < gridCols; x++) {
        for (let y = 0; y < gridRows; y++) enemySlots.push({ x, y })
      }
      for (let i = enemySlots.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [enemySlots[i], enemySlots[j]] = [enemySlots[j], enemySlots[i]]
      }

      for (const group of config.enemies) {
        if (group.spawnRound) continue
        for (let i = 0; i < group.count; i++) {
          const monster = createMonster(group.monsterId, enemyIdx, [group.monsterId])
          monster.uses = initUses(monster)
          monster.position = enemySlots[enemyIdx] || { x: gridCols - 1, y: enemyIdx % gridRows }
          characters[monster.id] = monster
          enemyIdx++
        }
      }

      const initiativeOrder = rollInitiative(characters)
      const firstChar = characters[initiativeOrder[0]]
      const firstIsEnemy = firstChar?.team === TEAMS.ENEMY

      const pendingSpawns = config.enemies.filter(g => g.spawnRound).map(g => ({ ...g }))

      let storyObjective = null
      if (config.objective === 'escape') {
        storyObjective = { type: 'escort', desc: '🏃 Fuyez ! Atteignez le bord droit du plateau !' }
      } else if (config.objective === 'survive') {
        storyObjective = { type: 'survive', turns: config.surviveTurns || 5, desc: '⏳ Survivez !' }
      }

      return {
        ...state,
        phase: PHASES.COMBAT,
        characters,
        initiativeOrder,
        currentTurnIndex: 0,
        round: 1,
        turnState: firstIsEnemy ? TURN_STATES.ENEMY_TURN : TURN_STATES.IDLE,
        terrain: {},
        terrainTheme: config.terrainTheme || null,
        combatObjective: storyObjective,
        selectedAbility: null,
        selectedCategory: null,
        validTargets: [],
        validMoves: [],
        log: [{ text: '⚔️ Le combat commence !', type: 'system' }],
        stats: freshStats(),
        visualEvents: [],
        pendingCutIn: null,
        combatInventory: [],
        story: {
          ...story,
          active: true,
          combatConfig: config,
          pendingSpawns
        },
        storyGrid: { cols: gridCols, rows: gridRows }
      }
    }

    case 'STORY_COMBAT_END': {
      const newStory = {
        ...state.story,
        blockIndex: state.story.blockIndex + 1,
        combatConfig: null,
        pendingSpawns: null
      }
      saveStoryState(newStory)
      return {
        ...state,
        phase: PHASES.STORY,
        story: newStory,
        characters: {},
        initiativeOrder: [],
        storyGrid: null
      }
    }

    case 'STORY_ADVANCE': {
      const { story } = state
      const chapter = action.payload?.chapter
      if (!chapter) return state
      const seq = chapter.sequences[story.sequenceId]
      if (!seq) return state

      const block = seq.blocks[story.blockIndex]

      if (block?.type === 'branch') {
        const key = block.key
        const value = story.choices[key]
        const targetSeq = block.paths[value]
        if (targetSeq) {
          const newStory = { ...story, sequenceId: targetSeq, blockIndex: 0 }
          saveStoryState(newStory)
          return { ...state, story: newStory }
        }
      }

      if (block?.type === 'setCompanion') {
        const newStory = { ...story, companion: block.companion, blockIndex: story.blockIndex + 1 }
        saveStoryState(newStory)
        return { ...state, story: newStory }
      }

      const nextIndex = story.blockIndex + 1
      if (nextIndex < seq.blocks.length) {
        const newStory = { ...story, blockIndex: nextIndex }
        saveStoryState(newStory)
        return { ...state, story: newStory }
      }

      if (seq.next) {
        const newStory = { ...story, sequenceId: seq.next, blockIndex: 0 }
        saveStoryState(newStory)
        return { ...state, story: newStory }
      }

      const completed = [...(story.completed || []), story.chapterId]
      clearStoryState()
      return {
        ...state,
        phase: PHASES.STORY_MENU,
        story: { ...initialState.story, completed }
      }
    }

    case 'STORY_CHOICE': {
      const { option, chapter } = action.payload
      let newChoices = { ...state.story.choices }
      if (option.setValue) {
        newChoices[option.setValue.key] = option.setValue.value
      }
      if (option.goto) {
        const newStory = { ...state.story, choices: newChoices, sequenceId: option.goto, blockIndex: 0 }
        saveStoryState(newStory)
        return { ...state, story: newStory }
      }
      const newStory = { ...state.story, choices: newChoices, blockIndex: state.story.blockIndex + 1 }
      saveStoryState(newStory)
      return { ...state, story: newStory }
    }

    case 'STORY_SET_NAME': {
      const { name } = action.payload
      const newStory = {
        ...state.story,
        choices: { ...state.story.choices, playerName: name },
        blockIndex: state.story.blockIndex + 1
      }
      saveStoryState(newStory)
      return { ...state, story: newStory }
    }

    case 'STORY_COMPLETE': {
      const completed = [...(state.story.completed || []), state.story.chapterId]
      clearStoryState()
      return {
        ...state,
        phase: PHASES.HUB,
        story: { ...initialState.story, completed }
      }
    }

    default:
      return state
  }
}

export function hasStorySave() {
  return loadStoryState() !== null
}

export function hasCampaignSave() {
  return loadCampaignState() !== null
}

export function useGameState() {
  const [state, dispatch] = useReducer(gameReducer, initialState)
  const aiTimeoutRef = useRef(null)

  useEffect(() => {
    if (state.phase === PHASES.CAMPAIGN_MAP && state.campaign?.active) {
      saveCampaignState(state)
    }
  }, [state.phase, state.characters, state.campaign, state.campaignEvent, state.pendingPaliers, state.pendingLevelUps, state.combatResult])

  const getAbilityState = useCallback((characterId, ability) => {
    const char = state.characters[characterId]
    if (!char) return { available: false, reason: 'Personnage introuvable' }

    if (ability.cooldown > 0 && char.cooldowns[ability.id] > 0) {
      return { available: false, reason: `CD: ${char.cooldowns[ability.id]}`, cooldown: char.cooldowns[ability.id] }
    }

    if (ability.maxUses > 0 && (char.uses[ability.id] === undefined || char.uses[ability.id] <= 0)) {
      return { available: false, reason: 'Plus d\'utilisations' }
    }

    if (char.statuses.some(s => s.type === 'stunned')) {
      return { available: false, reason: 'Étourdi' }
    }

    return { available: true, uses: char.uses[ability.id] }
  }, [state.characters])

  const executeAITurn = useCallback(() => {
    const currentId = state.initiativeOrder[state.currentTurnIndex]
    const current = state.characters[currentId]
    if (!current || current.team !== TEAMS.ENEMY || current.isDead) {
      dispatch({ type: 'END_TURN' })
      return
    }

    const difficulty = state.campaign.active ? Math.min(state.campaign.act + 1, 3) : 2
    const decision = decideAction(current, state.characters, getAbilityState, state.terrain, difficulty, state.combatObjective)
    const steps = []

    if (decision.movement) {
      steps.push({
        delay: 400,
        fn: () => dispatch({
          type: 'MOVE_AI',
          payload: { characterId: currentId, position: decision.movement }
        })
      })
    }

    if (decision.bonusAction) {
      steps.push({
        delay: 500,
        fn: () => dispatch({
          type: 'EXECUTE_ABILITY',
          payload: {
            ability: decision.bonusAction,
            targetId: decision.bonusActionTarget?.id || null,
            isBonusAction: true
          }
        })
      })
    }

    if (decision.action && decision.action.effect !== 'disengage') {
      steps.push({
        delay: 600,
        fn: () => dispatch({
          type: 'EXECUTE_ABILITY',
          payload: {
            ability: decision.action,
            targetId: decision.actionTarget?.id || null,
            isBonusAction: false
          }
        })
      })
    } else if (decision.action?.effect === 'disengage') {
      steps.push({
        delay: 400,
        fn: () => dispatch({
          type: 'EXECUTE_ABILITY',
          payload: { ability: decision.action, targetId: null, isBonusAction: false }
        })
      })
    }

    steps.push({
      delay: 500,
      fn: () => dispatch({ type: 'END_TURN' })
    })

    if (aiTimeoutRef.current) {
      aiTimeoutRef.current.forEach(clearTimeout)
    }
    const ids = []
    let totalDelay = 200
    for (const step of steps) {
      totalDelay += step.delay
      const d = totalDelay
      ids.push(setTimeout(step.fn, d))
    }
    aiTimeoutRef.current = ids
  }, [state, getAbilityState])

  useEffect(() => {
    if (state.phase !== PHASES.COMBAT && aiTimeoutRef.current) {
      aiTimeoutRef.current.forEach(clearTimeout)
      aiTimeoutRef.current = null
    }
  }, [state.phase])

  return { state, dispatch, getAbilityState, executeAITurn }
}
