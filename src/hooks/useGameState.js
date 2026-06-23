import { useReducer, useCallback, useRef } from 'react'
import { CLASSES } from '../data/classes.js'
import { PHASES, TURN_STATES, ALLY_NAMES, ENEMY_NAMES, TEAMS } from '../data/config.js'
import { rollInitiative } from '../systems/initiative.js'
import { resolveAbility, processStartOfTurn, processEndOfTurn, checkRageComeback, resolveOpportunityAttacks, resolveAllyReactions, processGuardianDamage } from '../systems/combat.js'
import { getAccessibleCells, getValidTargets, getAdjacentEnemies, canMoveTo } from '../systems/movement.js'
import { decideAction } from '../systems/ai.js'
import { generateTerrain, TERRAIN_TYPES } from '../systems/terrain.js'
import { MONSTERS } from '../data/monsters.js'
import { ACTS, generateCampaignMap, generateShopItems, applyCampaignRest, applyConsumable, applyNewPaliers, applyPalierToCharacter, pickRelics, applyRelicEffects, MINOR_RELICS, MAJOR_RELICS, XP_PALIERS, GOLD_REWARDS, teamHasHealer, SURVIVAL_POTION } from '../data/campaign.js'
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
    const positions = [{ x: 0, y: 1 }, { x: 0, y: 3 }, { x: 1, y: 0 }, { x: 1, y: 4 }, { x: 1, y: 2 }]
    position = positions[index] || { x: 0, y: index }
  } else {
    const positions = [{ x: 6, y: 1 }, { x: 6, y: 3 }, { x: 5, y: 0 }, { x: 5, y: 4 }, { x: 5, y: 2 }]
    position = positions[index] || { x: 6, y: index }
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

function createMonster(monsterId, index, allMonsterIds) {
  const monsterData = MONSTERS[monsterId]
  const sameTypeCount = allMonsterIds.filter(m => m === monsterId).length
  const sameTypeIndex = allMonsterIds.slice(0, index + 1).filter(m => m === monsterId).length
  const name = sameTypeCount > 1
    ? `${monsterData.name} ${'ABCDE'[sameTypeIndex - 1]}`
    : monsterData.name
  const id = `enemy-${monsterId}-${index}`

  const positions = [
    { x: 6, y: 1 }, { x: 6, y: 3 }, { x: 5, y: 0 },
    { x: 5, y: 4 }, { x: 5, y: 2 }
  ]

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
    position: positions[index] || { x: 6, y: index },
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
        pending.push({ characterId: char.id, level: threshold.level })
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
  return {
    ...characters,
    [characterId]: {
      ...char,
      classData: newClassData,
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
  if (!gameEnd || !state.campaign.active) return gameEnd
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
  stats: { damageDealt: 0, damageReceived: 0, healingDone: 0, rounds: 1 },
  pendingAO: null,
  terrain: {},
  terrainTheme: null,
  terrainThemeName: '',
  campaign: { active: false, act: 0, map: null, currentLayer: 0, lastNodeId: null, visitedNodes: [], currentNode: null, rewards: [], xp: 0, appliedPaliers: [], evolved: false, relics: [], gold: 0, inventory: [] },
  campaignEvent: null,
  pendingPaliers: [],
  pendingLevelUps: [],
  combatResult: null,
  combatInventory: [],
  campaignMode: false
}

function applyEffects(state, effects) {
  let newChars = { ...state.characters }
  let newStats = { ...state.stats }

  for (const effect of effects) {
    const char = newChars[effect.targetId || effect.characterId]
    if (!char) continue

    switch (effect.type) {
      case 'damage': {
        const updated = { ...char, hp: Math.max(0, char.hp - effect.amount) }
        if (updated.hp === 0 && !updated.isDead) {
          updated.isDead = true
          updated.animation = 'death'
        } else if (effect.amount > 0 && !updated.isDead) {
          updated.animation = 'shake'
        }
        if (char.team === TEAMS.ENEMY) {
          newStats = { ...newStats, damageDealt: newStats.damageDealt + effect.amount }
        } else {
          newStats = { ...newStats, damageReceived: newStats.damageReceived + effect.amount }
        }
        newChars = { ...newChars, [char.id]: updated }
        break
      }
      case 'heal': {
        const healed = { ...char, hp: Math.min(char.maxHp, char.hp + effect.amount) }
        healed.animation = 'heal'
        newStats = { ...newStats, healingDone: newStats.healingDone + effect.amount }
        newChars = { ...newChars, [char.id]: healed }
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
        newChars = { ...newChars, [char.id]: { ...char, reactionUsed: true } }
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

  return { characters: newChars, stats: newStats }
}

function checkGameEnd(characters) {
  const allyAlive = Object.values(characters).some(c => c.team === TEAMS.ALLY && !c.isDead)
  const enemyAlive = Object.values(characters).some(c => c.team === TEAMS.ENEMY && !c.isDead)

  if (!allyAlive) return PHASES.DEFEAT
  if (!enemyAlive) return PHASES.VICTORY
  return null
}

function gameReducer(state, action) {
  switch (action.type) {
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
        stats: { damageDealt: 0, damageReceived: 0, healingDone: 0, rounds: 1 }
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
      const moveCost = (terrainCell && terrainCell.type === TERRAIN_TYPES.DIFFICULT) ? 2 : 1

      if (state.movementRemaining < moveCost) return state

      const aoResult = resolveOpportunityAttacks(current, current.position, { x: newX, y: newY }, state.characters)
      let updatedChars = { ...state.characters }
      let aoLogs = []

      if (aoResult.effects.length > 0) {
        const applied = applyEffects({ characters: updatedChars, stats: state.stats }, aoResult.effects)
        updatedChars = applied.characters
        aoLogs = aoResult.logs.map(t => ({ text: t, type: t.includes('Raté') ? 'miss' : 'info' }))
      }

      const movedCurrent = updatedChars[current.id]
      if (movedCurrent.isDead) {
        const gameEnd = checkGameEnd(updatedChars)
        return {
          ...state,
          characters: updatedChars,
          log: [...state.log, ...aoLogs].slice(-50),
          turnState: TURN_STATES.IDLE,
          movementRemaining: 0,
          validMoves: [],
          phase: resolveCampaignPhase(state, gameEnd) || state.phase
        }
      }

      const newChars = {
        ...updatedChars,
        [current.id]: {
          ...movedCurrent,
          position: { x: newX, y: newY },
          movementUsed: movedCurrent.movementUsed + moveCost
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
        log: [...state.log, ...aoLogs].slice(-50)
      }
    }

    case 'CONFIRM_MOVE': {
      return {
        ...state,
        turnState: TURN_STATES.IDLE,
        originalPosition: null,
        originalMovementUsed: 0,
        validMoves: []
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
        validMoves: []
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
      const current = state.characters[state.initiativeOrder[state.currentTurnIndex]]
      const target = targetId ? state.characters[targetId] : current

      const result = resolveAbility(current, target, ability, state.characters, state.terrain)

      let terrainAfterAbility = state.terrain
      if (ability.magical && target) {
        const fireCheck = checkFireOnMagicAttack(ability, target, state.terrain)
        if (fireCheck.terrain !== state.terrain) {
          terrainAfterAbility = fireCheck.terrain
          result.logs.push(...fireCheck.logs)
        }
      }

      const { characters: newChars, stats: newStats } = applyEffects(
        { characters: state.characters, stats: state.stats },
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

      if (rageEffects.length > 0) {
        const rageApplied = applyEffects({ characters: finalChars, stats: newStats }, rageEffects)
        finalChars = rageApplied.characters
      }

      if (targetId && ability.damage && current.team !== (state.characters[targetId]?.team)) {
        const allyReact = resolveAllyReactions(targetId, current.id, result.damage || 0, finalChars)
        if (allyReact.effects.length > 0) {
          const reactApplied = applyEffects({ characters: finalChars, stats: newStats }, allyReact.effects)
          finalChars = reactApplied.characters
          extraLogs.push(...allyReact.logs)
        }
      }

      const gameEnd = checkGameEnd(finalChars)

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
        const lvlUps1 = checkLevelUps(newXp, execChars)
        if (nodeType === 'elite') {
          execEvent = { type: 'relic-minor', relics: pickRelics(MINOR_RELICS, 2, state.campaign.relics || []), rewardSelected: false, nodeId: state.campaign.currentNode.id }
        } else if (nodeType === 'boss') {
          execEvent = { type: 'relic-major', relics: pickRelics(MAJOR_RELICS, 2, state.campaign.relics || []), rewardSelected: false, nodeId: state.campaign.currentNode.id }
        }
      }

      return {
        ...state,
        characters: execChars,
        terrain: terrainAfterAbility,
        stats: newStats,
        log: newLog.slice(-50),
        turnState: gameEnd ? TURN_STATES.IDLE : TURN_STATES.IDLE,
        selectedAbility: null,
        selectedCategory: null,
        validTargets: [],
        phase: resolvedPhase2 || state.phase,
        campaign: execCampaign,
        campaignEvent: execEvent,
        pendingPaliers: execPendingPaliers,
        pendingLevelUps: resolvedPhase2 === PHASES.CAMPAIGN_MAP ? (lvlUps1 || []) : state.pendingLevelUps,
        combatResult: execCombatResult
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

      while (updatedChars[state.initiativeOrder[nextIndex]]?.isDead) {
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

      const nextChar = updatedChars[state.initiativeOrder[nextIndex]]
      const isEnemy = nextChar?.team === TEAMS.ENEMY

      const startResult = nextChar ? processStartOfTurn(nextChar, state.terrain) : { logs: [], effects: [] }
      if (nextChar) {
        const guardianResult = processGuardianDamage(nextChar, updatedChars)
        startResult.logs.push(...guardianResult.logs)
        startResult.effects.push(...guardianResult.effects)
      }
      if (startResult.effects.length > 0) {
        const applied = applyEffects({ characters: updatedChars, stats: state.stats }, startResult.effects)
        updatedChars = applied.characters
      }

      const gameEnd = checkGameEnd(updatedChars)
      if (gameEnd) {
        const resolvedPhase = resolveCampaignPhase(state, gameEnd)
        let restChars = updatedChars
        let endCampaign = state.campaign
        let endEvent = state.campaignEvent
        let endPendingPaliers = state.pendingPaliers
        let endCombatResult = state.combatResult
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
          const lvlUps2 = checkLevelUps(newXp, restChars)
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
          pendingLevelUps: resolvedPhase === PHASES.CAMPAIGN_MAP ? (lvlUps2 || []) : state.pendingLevelUps,
          combatResult: endCombatResult,
          currentTurnIndex: nextIndex,
          round: newRound,
          log: [...state.log, ...startResult.logs.map(t => ({ text: t, type: 'info' }))].slice(-50),
          stats: { ...state.stats, rounds: newRound }
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
        stats: { ...state.stats, rounds: newRound }
      }
    }

    case 'MOVE_AI': {
      const { characterId, position } = action.payload
      const char = state.characters[characterId]
      if (!char) return state

      const aoResult = resolveOpportunityAttacks(char, char.position, position, state.characters)
      let updatedChars = { ...state.characters }
      let aoLogs = [{ text: `🏃 ${char.name} se déplace`, type: 'info' }]

      if (aoResult.effects.length > 0) {
        const applied = applyEffects({ characters: updatedChars, stats: state.stats }, aoResult.effects)
        updatedChars = applied.characters
        aoLogs.push(...aoResult.logs.map(t => ({ text: t, type: t.includes('Raté') ? 'miss' : 'info' })))
      }

      const movedChar = updatedChars[characterId]
      if (movedChar.isDead) {
        const gameEnd = checkGameEnd(updatedChars)
        return {
          ...state,
          characters: updatedChars,
          log: [...state.log, ...aoLogs].slice(-50),
          phase: resolveCampaignPhase(state, gameEnd) || state.phase
        }
      }

      return {
        ...state,
        characters: {
          ...updatedChars,
          [characterId]: { ...movedChar, position, movementUsed: char.movement }
        },
        log: [...state.log, ...aoLogs].slice(-50)
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
      return { ...initialState, phase: PHASES.HUB }
    }

    case 'SET_PHASE': {
      return { ...state, phase: action.payload.phase }
    }

    case 'START_CAMPAIGN': {
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
          modifiers,
          gloryUpgrades: glory.upgrades || {}
        },
        campaignEvent: null,
        stats: { damageDealt: 0, damageReceived: 0, healingDone: 0, rounds: 1 }
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
          campaign: { ...campaign, currentLayer: campaign.currentLayer + 1, lastNodeId: node.id, visitedNodes: newVisited, currentNode: null }
        }
      }

      if (node.type === 'treasure') {
        const tMods = resolveModifiers(campaign.modifiers)
        const goldGain = Math.floor(GOLD_REWARDS.treasure * tMods.treasureGoldMult * tMods.goldMult)
        return {
          ...state,
          campaignEvent: { type: 'treasure', goldGain, nodeId: node.id },
          campaign: { ...campaign, visitedNodes: newVisited, gold: (campaign.gold || 0) + goldGain }
        }
      }

      if (node.type === 'merchant') {
        return {
          ...state,
          campaignEvent: { type: 'merchant', items: generateShopItems(), nodeId: node.id, shopCostMult: resolveModifiers(campaign.modifiers).shopCostMult },
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
      node.encounter.monsters.forEach((monsterId, i) => {
        const monster = createMonster(monsterId, i, node.encounter.monsters)
        monster.uses = initUses(monster)
        if (combatMods.enemyHpMult !== 1) {
          monster.maxHp = Math.floor(monster.maxHp * combatMods.enemyHpMult)
          monster.hp = monster.maxHp
        }
        characters[monster.id] = monster
      })

      const initiativeOrder = rollInitiative(characters)
      const firstChar = characters[initiativeOrder[0]]
      const firstIsEnemy = firstChar?.team === TEAMS.ENEMY
      const { terrain, theme: terrainTheme, themeName } = generateTerrain(act.terrainTheme)

      return {
        ...state,
        phase: PHASES.COMBAT,
        characters, initiativeOrder,
        currentTurnIndex: 0, round: 1,
        turnState: firstIsEnemy ? TURN_STATES.ENEMY_TURN : TURN_STATES.IDLE,
        terrain, terrainTheme, terrainThemeName: themeName,
        campaign: { ...campaign, currentNode: node, visitedNodes: newVisited },
        campaignEvent: null,
        selectedAbility: null, selectedCategory: null,
        validTargets: [], validMoves: [],
        log: [
          { text: `📜 ${act.name}`, type: 'system' },
          { text: `⚔️ ${node.encounter.name}`, type: 'system' },
          { text: `🗺️ ${themeName}`, type: 'system' },
          { text: `--- Tour de ${firstChar.name} (${firstChar.classData.name}) ---`, type: 'turn' }
        ],
        stats: { damageDealt: 0, damageReceived: 0, healingDone: 0, rounds: 1 },
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
        updatedChars = applyRelicEffects(state.characters, reward)
        newCampaign.relics = [...(newCampaign.relics || []), { id: reward.id, name: reward.name, icon: reward.icon }]
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

      const { characters: newChars, stats: newStats } = applyEffects(
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
        stats: newStats,
        terrain: result.terrain,
        combatInventory: inventory,
        log: [...state.log, ...result.logs.map(t => ({ text: t, type: 'info' }))].slice(-50),
        turnState: TURN_STATES.IDLE,
        selectedAbility: null,
        selectedCategory: null,
        validTargets: [],
        validMoves: []
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
      if (choice.effect === 'helpTraveler' || choice.effect === 'safeGold') {
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
        if (best) updatedChars[best[0]] = { ...updatedChars[best[0]], [choice.stat]: (updatedChars[best[0]][choice.stat] || 0) + (choice.value || 0) }
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

    default:
      return state
  }
}

export function useGameState() {
  const [state, dispatch] = useReducer(gameReducer, initialState)
  const aiTimeoutRef = useRef(null)

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
    const decision = decideAction(current, state.characters, getAbilityState, state.terrain, difficulty)
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

    let totalDelay = 200
    for (const step of steps) {
      totalDelay += step.delay
      const d = totalDelay
      setTimeout(step.fn, d)
    }
  }, [state, getAbilityState])

  return { state, dispatch, getAbilityState, executeAITurn }
}
