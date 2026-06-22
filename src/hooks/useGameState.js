import { useReducer, useCallback, useRef } from 'react'
import { CLASSES } from '../data/classes.js'
import { PHASES, TURN_STATES, ALLY_NAMES, ENEMY_NAMES, TEAMS } from '../data/config.js'
import { rollInitiative } from '../systems/initiative.js'
import { resolveAbility, processStartOfTurn, processEndOfTurn, checkRageComeback } from '../systems/combat.js'
import { getAccessibleCells, getValidTargets, getAdjacentEnemies, canMoveTo } from '../systems/movement.js'
import { decideAction } from '../systems/ai.js'

function createCharacter(classId, team, index) {
  const classData = CLASSES[classId]
  const name = team === TEAMS.ALLY ? ALLY_NAMES[classId] : ENEMY_NAMES[classId]
  const id = `${team}-${classId}`

  let position
  if (team === TEAMS.ALLY) {
    const positions = [{ x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 0 }, { x: 1, y: 3 }, { x: 1, y: 1 }]
    position = positions[index] || { x: 0, y: index }
  } else {
    const positions = [{ x: 5, y: 1 }, { x: 5, y: 2 }, { x: 4, y: 0 }, { x: 4, y: 3 }, { x: 4, y: 2 }]
    position = positions[index] || { x: 5, y: index }
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

function generateEnemyTeam(allyClasses) {
  const allClasses = Object.keys(CLASSES)
  const shuffled = [...allClasses].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3)
}

const initialState = {
  phase: PHASES.TEAM_SELECT,
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
  validTargets: [],
  validMoves: [],
  log: [],
  stats: { damageDealt: 0, damageReceived: 0, healingDone: 0, rounds: 1 },
  pendingAO: null
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

      return {
        ...state,
        phase: PHASES.COMBAT,
        characters,
        initiativeOrder,
        currentTurnIndex: 0,
        round: 1,
        turnState: firstIsEnemy ? TURN_STATES.ENEMY_TURN : TURN_STATES.IDLE,
        log: [
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
      const validMoves = getAccessibleCells(current.position, remaining, state.characters, current.id)

      return {
        ...state,
        turnState: TURN_STATES.MOVING,
        movementRemaining: remaining,
        originalPosition: { ...current.position },
        validMoves
      }
    }

    case 'MOVE_DIRECTION': {
      const current = state.characters[state.initiativeOrder[state.currentTurnIndex]]
      const { dx, dy } = action.payload
      const newX = current.position.x + dx
      const newY = current.position.y + dy

      if (!canMoveTo(current.position, { dx, dy }, state.characters, current.id)) {
        return state
      }

      if (state.movementRemaining <= 0) return state

      const newChars = {
        ...state.characters,
        [current.id]: {
          ...current,
          position: { x: newX, y: newY },
          movementUsed: current.movementUsed + 1
        }
      }

      const newRemaining = state.movementRemaining - 1
      const newValidMoves = getAccessibleCells(
        { x: newX, y: newY }, newRemaining, newChars, current.id
      )

      return {
        ...state,
        characters: newChars,
        movementRemaining: newRemaining,
        validMoves: newValidMoves
      }
    }

    case 'CONFIRM_MOVE': {
      return {
        ...state,
        turnState: TURN_STATES.IDLE,
        originalPosition: null,
        validMoves: []
      }
    }

    case 'CANCEL_MOVE': {
      const current = state.characters[state.initiativeOrder[state.currentTurnIndex]]
      if (!state.originalPosition) return { ...state, turnState: TURN_STATES.IDLE }

      const restored = {
        ...current,
        position: state.originalPosition,
        movementUsed: current.movementUsed - (current.movement - state.movementRemaining)
      }

      return {
        ...state,
        characters: { ...state.characters, [current.id]: restored },
        turnState: TURN_STATES.IDLE,
        originalPosition: null,
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

      const result = resolveAbility(current, target, ability, state.characters)
      const { characters: newChars, stats: newStats } = applyEffects(
        { characters: state.characters, stats: state.stats },
        result.effects
      )

      const newCooldowns = { ...current.cooldowns }
      if (ability.cooldown > 0) {
        newCooldowns[ability.id] = ability.cooldown
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

      const gameEnd = checkGameEnd(finalChars)

      const newLog = [...state.log, ...extraLogs.map(text => ({
        text,
        type: text.includes('CRITIQUE') || text.includes('FATAL') ? 'critical' :
              text.includes('soins') || text.includes('💚') ? 'heal' :
              text.includes('Raté') ? 'miss' : 'info'
      }))]

      return {
        ...state,
        characters: finalChars,
        stats: newStats,
        log: newLog.slice(-50),
        turnState: gameEnd ? TURN_STATES.IDLE : TURN_STATES.IDLE,
        selectedAbility: null,
        selectedCategory: null,
        validTargets: [],
        phase: gameEnd || state.phase
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

      if (nextIndex >= state.initiativeOrder.length) {
        nextIndex = 0
        newRound++
        for (const id of Object.keys(updatedChars)) {
          updatedChars[id] = { ...updatedChars[id], reactionUsed: false }
        }
      }

      while (updatedChars[state.initiativeOrder[nextIndex]]?.isDead) {
        nextIndex++
        if (nextIndex >= state.initiativeOrder.length) {
          nextIndex = 0
          newRound++
          for (const id of Object.keys(updatedChars)) {
            updatedChars[id] = { ...updatedChars[id], reactionUsed: false }
          }
        }
      }

      const nextChar = updatedChars[state.initiativeOrder[nextIndex]]
      const isEnemy = nextChar?.team === TEAMS.ENEMY

      const startResult = nextChar ? processStartOfTurn(nextChar) : { logs: [], effects: [] }
      if (startResult.effects.length > 0) {
        const applied = applyEffects({ characters: updatedChars, stats: state.stats }, startResult.effects)
        updatedChars = applied.characters
      }

      const gameEnd = checkGameEnd(updatedChars)
      if (gameEnd) {
        return {
          ...state,
          characters: updatedChars,
          phase: gameEnd,
          currentTurnIndex: nextIndex,
          round: newRound,
          log: [...state.log, ...startResult.logs.map(t => ({ text: t, type: 'info' }))].slice(-50),
          stats: { ...state.stats, rounds: newRound }
        }
      }

      return {
        ...state,
        characters: updatedChars,
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
      return {
        ...state,
        characters: {
          ...state.characters,
          [characterId]: { ...char, position, movementUsed: char.movement }
        },
        log: [...state.log, { text: `🏃 ${char.name} se déplace`, type: 'info' }].slice(-50)
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
      return { ...initialState }
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

    const decision = decideAction(current, state.characters, getAbilityState)
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
