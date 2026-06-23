import { useEffect, useCallback, useState } from 'react'
import { PHASES, TURN_STATES } from './data/config.js'
import { useGameState } from './hooks/useGameState.js'
import Hub from './components/Hub.jsx'
import TeamSelect from './components/TeamSelect.jsx'
import Transition from './components/Transition.jsx'
import Board from './components/Board.jsx'
import InitiativeBar from './components/InitiativeBar.jsx'
import ActionPanel from './components/ActionPanel.jsx'
import DirectionalPad from './components/DirectionalPad.jsx'
import CombatLog from './components/CombatLog.jsx'
import StatusBadge from './components/StatusBadge.jsx'
import VictoryScreen from './components/VictoryScreen.jsx'
import CharacterCard from './components/CharacterCard.jsx'

export default function App() {
  const { state, dispatch, getAbilityState, executeAITurn } = useGameState()
  const [inspectedCharId, setInspectedCharId] = useState(null)
  const [transitioning, setTransitioning] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)

  const currentChar = state.phase === PHASES.COMBAT
    ? state.characters[state.initiativeOrder[state.currentTurnIndex]]
    : null

  useEffect(() => {
    if (state.phase !== PHASES.COMBAT) return
    if (state.turnState !== TURN_STATES.ENEMY_TURN) return
    if (!currentChar || currentChar.team !== 'enemy') return

    const timeout = setTimeout(() => executeAITurn(), 600)
    return () => clearTimeout(timeout)
  }, [state.turnState, state.currentTurnIndex])

  const startTransition = useCallback((action) => {
    setPendingAction(() => action)
    setTransitioning(true)
  }, [])

  const handleTransitionComplete = useCallback(() => {
    setTransitioning(false)
    if (pendingAction) {
      pendingAction()
      setPendingAction(null)
    }
  }, [pendingAction])

  const handleStartCombat = useCallback((classes) => {
    startTransition(() => {
      dispatch({ type: 'START_COMBAT', payload: { allyClasses: classes } })
    })
  }, [dispatch, startTransition])

  const handleSelectAbility = useCallback((ability, isBonusAction) => {
    if (ability.targetType === 'self') {
      dispatch({
        type: 'EXECUTE_ABILITY',
        payload: { ability, targetId: null, isBonusAction }
      })
      return
    }

    dispatch({
      type: 'SELECT_ABILITY',
      payload: { ability, isBonusAction }
    })
  }, [dispatch])

  const handleTargetClick = useCallback((targetId) => {
    if (state.selectedAbility && state.validTargets.includes(targetId)) {
      const isBonusAction = state.selectedCategory === 'bonusActions'
      dispatch({
        type: 'EXECUTE_ABILITY',
        payload: {
          ability: state.selectedAbility,
          targetId,
          isBonusAction
        }
      })
    }
  }, [state.selectedAbility, state.validTargets, state.selectedCategory, dispatch])

  const handleTokenInspect = useCallback((charId) => {
    if (state.selectedAbility && state.validTargets.includes(charId)) {
      handleTargetClick(charId)
    } else {
      setInspectedCharId(charId)
    }
  }, [state.selectedAbility, state.validTargets, handleTargetClick])

  if (state.phase === PHASES.HUB) {
    return (
      <div className="app">
        <Hub onNavigate={(tab) => {
          if (tab === 'combat') dispatch({ type: 'GO_TO_TEAM_SELECT' })
        }} />
        <Transition active={transitioning} onComplete={handleTransitionComplete} />
      </div>
    )
  }

  if (state.phase === PHASES.TEAM_SELECT) {
    return (
      <div className="app">
        <TeamSelect
          selectedClasses={state.selectedClasses}
          onToggle={(classId) => dispatch({ type: 'TOGGLE_CLASS', payload: { classId } })}
          onStart={handleStartCombat}
          onBack={() => dispatch({ type: 'GO_TO_HUB' })}
        />
        <Transition active={transitioning} onComplete={handleTransitionComplete} />
      </div>
    )
  }

  if (state.phase === PHASES.VICTORY || state.phase === PHASES.DEFEAT) {
    return (
      <div className="app">
        <VictoryScreen
          isVictory={state.phase === PHASES.VICTORY}
          stats={state.stats}
          onRestart={() => dispatch({ type: 'RESTART' })}
        />
      </div>
    )
  }

  return (
    <div className="app">
      <InitiativeBar
        characters={state.characters}
        initiativeOrder={state.initiativeOrder}
        currentTurnIndex={state.currentTurnIndex}
        round={state.round}
      />

      <Board
        characters={state.characters}
        currentCharId={currentChar?.id}
        validMoves={state.validMoves}
        validTargets={state.validTargets}
        turnState={state.turnState}
        onCellClick={() => {}}
        onTokenClick={handleTokenInspect}
      />

      <CombatLog log={state.log} />

      {currentChar && (
        <div className="current-char-statuses">
          {currentChar.statuses.map((s, i) => (
            <StatusBadge key={`${s.type}-${i}`} status={s} />
          ))}
        </div>
      )}

      {state.turnState === TURN_STATES.MOVING ? (
        <DirectionalPad
          movementRemaining={state.movementRemaining}
          onMove={(dx, dy) => dispatch({ type: 'MOVE_DIRECTION', payload: { dx, dy } })}
          onConfirm={() => dispatch({ type: 'CONFIRM_MOVE' })}
          onCancel={() => dispatch({ type: 'CANCEL_MOVE' })}
        />
      ) : state.turnState === TURN_STATES.ENEMY_TURN ? (
        <div className="action-panel">
          <div className="enemy-turn-indicator">
            ⏳ {currentChar?.name} réfléchit...
          </div>
        </div>
      ) : (
        <ActionPanel
          character={currentChar}
          turnState={state.turnState}
          selectedCategory={state.selectedCategory}
          getAbilityState={getAbilityState}
          onStartMove={() => dispatch({ type: 'START_MOVE' })}
          onSelectCategory={(cat) => dispatch({ type: 'SELECT_CATEGORY', payload: { category: cat } })}
          onSelectAbility={handleSelectAbility}
          onEndTurn={() => dispatch({ type: 'END_TURN' })}
          onBack={() => dispatch({ type: 'BACK_TO_IDLE' })}
        />
      )}

      {inspectedCharId && state.characters[inspectedCharId] && (
        <CharacterCard
          character={state.characters[inspectedCharId]}
          onClose={() => setInspectedCharId(null)}
        />
      )}

      <Transition active={transitioning} onComplete={handleTransitionComplete} />
    </div>
  )
}
