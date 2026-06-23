import { useEffect, useCallback, useState } from 'react'
import { PHASES, TURN_STATES } from './data/config.js'
import { useGameState } from './hooks/useGameState.js'
import { useAudio } from './hooks/useAudio.js'
import Hub from './components/Hub.jsx'
import Settings from './components/Settings.jsx'
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
import TerrainCard from './components/TerrainCard.jsx'
import CampaignMap from './components/CampaignMap.jsx'
import CombatMenu from './components/CombatMenu.jsx'
import RunModifiers from './components/RunModifiers.jsx'
import GloryScreen from './components/GloryScreen.jsx'
import NarrativeEvent from './components/NarrativeEvent.jsx'
import { loadGlory, saveGlory, calculateGloryReward, NARRATIVE_EVENTS } from './data/modifiers.js'

const B = import.meta.env.BASE_URL
const TRACKS = {
  hub: B + 'Audio/Dawn of Asterhollow.mp3',
  combat: B + 'Audio/Bannerfall Oath.mp3',
  victory: B + 'Audio/Treasure Bloom.mp3',
  defeat: B + 'Audio/Broken Banner Waltz.mp3'
}

export default function App() {
  const { state, dispatch, getAbilityState, executeAITurn } = useGameState()
  const audio = useAudio(TRACKS)
  const [inspectedCharId, setInspectedCharId] = useState(null)
  const [inspectedTerrain, setInspectedTerrain] = useState(null)
  const [pendingItem, setPendingItem] = useState(null)
  const [glory, setGlory] = useState(() => loadGlory())
  const [narrativeEvent, setNarrativeEvent] = useState(null)
  const [transitioning, setTransitioning] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [showSettings, setShowSettings] = useState(false)

  const currentChar = state.phase === PHASES.COMBAT
    ? state.characters[state.initiativeOrder[state.currentTurnIndex]]
    : null

  const handleFirstInteraction = useCallback(() => {
    audio.start()
    window.removeEventListener('click', handleFirstInteraction)
    window.removeEventListener('touchstart', handleFirstInteraction)
  }, [audio])

  useEffect(() => {
    window.addEventListener('click', handleFirstInteraction)
    window.addEventListener('touchstart', handleFirstInteraction)
    return () => {
      window.removeEventListener('click', handleFirstInteraction)
      window.removeEventListener('touchstart', handleFirstInteraction)
    }
  }, [handleFirstInteraction])

  useEffect(() => {
    const phase = state.phase
    if (phase === PHASES.COMBAT) audio.switchTrack('combat')
    else if (phase === PHASES.VICTORY || phase === PHASES.CAMPAIGN_COMPLETE) audio.switchTrack('victory')
    else if (phase === PHASES.DEFEAT || phase === PHASES.CAMPAIGN_DEFEAT) audio.switchTrack('defeat')
    else audio.switchTrack('hub')
    if (phase !== PHASES.COMBAT) setPendingItem(null)
  }, [state.phase])

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
    if (state.campaignMode) {
      dispatch({ type: 'SET_PHASE', payload: { phase: PHASES.RUN_MODIFIERS } })
    } else {
      startTransition(() => {
        dispatch({ type: 'START_COMBAT', payload: { allyClasses: classes } })
      })
    }
  }, [dispatch, startTransition, state.campaignMode])

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

  if (showSettings) {
    return (
      <div className="app">
        <Settings
          volume={audio.volume}
          muted={audio.muted}
          onVolumeChange={audio.setVolume}
          onToggleMute={audio.toggleMute}
          onBack={() => setShowSettings(false)}
        />
      </div>
    )
  }

  if (state.phase === PHASES.HUB) {
    return (
      <div className="app">
        <Hub onNavigate={(tab) => {
          if (tab === 'combat') dispatch({ type: 'GO_TO_TEAM_SELECT' })
          if (tab === 'campaign') dispatch({ type: 'GO_TO_TEAM_SELECT', payload: { campaignMode: true } })
          if (tab === 'glory') dispatch({ type: 'SET_PHASE', payload: { phase: PHASES.GLORY } })
          if (tab === 'settings') setShowSettings(true)
        }} />
        <Transition active={transitioning} onComplete={handleTransitionComplete} />
      </div>
    )
  }

  if (state.phase === PHASES.GLORY) {
    return (
      <div className="app">
        <GloryScreen
          glory={glory}
          onUpgrade={(upgrade) => {
            if (glory.points >= upgrade.cost) {
              const newGlory = {
                ...glory,
                points: glory.points - upgrade.cost,
                upgrades: { ...glory.upgrades, [upgrade.id]: (glory.upgrades[upgrade.id] || 0) + 1 }
              }
              setGlory(newGlory)
              saveGlory(newGlory)
            }
          }}
          onBack={() => dispatch({ type: 'SET_PHASE', payload: { phase: PHASES.HUB } })}
        />
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

  if (state.phase === PHASES.RUN_MODIFIERS) {
    return (
      <div className="app">
        <RunModifiers
          onConfirm={(modifierIds) => {
            startTransition(() => {
              dispatch({ type: 'START_CAMPAIGN', payload: { allyClasses: state.selectedClasses, modifiers: modifierIds, glory } })
            })
          }}
          onBack={() => dispatch({ type: 'GO_TO_TEAM_SELECT', payload: { campaignMode: true } })}
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

  if (state.phase === PHASES.CAMPAIGN_MAP) {
    return (
      <div className="app">
        <CampaignMap
          campaign={state.campaign}
          characters={state.characters}
          campaignEvent={state.campaignEvent}
          stats={state.stats}
          pendingPaliers={state.pendingPaliers || []}
          combatResult={state.combatResult}
          onSelectNode={(node) => {
            if (node.type === 'combat' || node.type === 'elite' || node.type === 'boss') {
              startTransition(() => dispatch({ type: 'CAMPAIGN_SELECT_NODE', payload: { node } }))
            } else {
              dispatch({ type: 'CAMPAIGN_SELECT_NODE', payload: { node } })
            }
          }}
          onSelectReward={(reward) => dispatch({ type: 'CAMPAIGN_EVENT_REWARD', payload: { reward } })}
          onEventDone={() => dispatch({ type: 'CAMPAIGN_EVENT_DONE' })}
          onApplyPalier={(palier, charId) => dispatch({ type: 'CAMPAIGN_APPLY_PALIER', payload: { palier, characterId: charId } })}
          onDismissResult={() => {
            dispatch({ type: 'CAMPAIGN_DISMISS_RESULT' })
            if (Math.random() < 0.25 && !state.narrativeEvent) {
              const events = NARRATIVE_EVENTS || []
              const event = events[Math.floor(Math.random() * events.length)]
              if (event) setNarrativeEvent(event)
            }
          }}
          onAbandon={() => dispatch({ type: 'RESTART' })}
        />
        {narrativeEvent && (
          <NarrativeEvent
            event={narrativeEvent}
            onChoice={(event, choice) => {
              dispatch({ type: 'NARRATIVE_CHOICE', payload: { choice } })
              setNarrativeEvent(null)
            }}
          />
        )}
        <Transition active={transitioning} onComplete={handleTransitionComplete} />
      </div>
    )
  }

  if (state.phase === PHASES.CAMPAIGN_COMPLETE || state.phase === PHASES.CAMPAIGN_DEFEAT) {
    const won = state.phase === PHASES.CAMPAIGN_COMPLETE
    const gloryGain = calculateGloryReward(won, state.campaign.act + 1, (state.campaign.modifiers || []).length)
    return (
      <div className="app">
        <VictoryScreen
          isVictory={won}
          stats={state.stats}
          title={won ? 'CAMPAGNE TERMINÉE !' : 'CAMPAGNE ÉCHOUÉE'}
          subtitle={won ? 'Vous avez vaincu le Dragon et sauvé le royaume !' : 'Votre équipe a été vaincue...'}
          gloryGain={gloryGain}
          onRestart={() => {
            const newGlory = { ...glory, points: glory.points + gloryGain, totalRuns: glory.totalRuns + 1, victories: won ? glory.victories + 1 : glory.victories }
            setGlory(newGlory)
            saveGlory(newGlory)
            dispatch({ type: 'RESTART' })
          }}
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
        encounterName={state.campaign.active ? state.campaign.currentNode?.encounter?.name : null}
      >
        <CombatMenu
          volume={audio.volume}
          muted={audio.muted}
          onVolumeChange={audio.setVolume}
          onToggleMute={audio.toggleMute}
          onAbandon={() => dispatch({ type: 'RESTART' })}
        />
      </InitiativeBar>

      <Board
        characters={state.characters}
        currentCharId={currentChar?.id}
        validMoves={state.validMoves}
        validTargets={state.validTargets}
        turnState={state.turnState}
        terrain={state.terrain}
        terrainTheme={state.terrainTheme}
        onCellClick={(x, y) => {
          if (pendingItem) {
            dispatch({ type: 'USE_ITEM', payload: { item: pendingItem, targetCell: { x, y } } })
            setPendingItem(null)
          }
        }}
        onTokenClick={handleTokenInspect}
        onTerrainClick={(cell) => setInspectedTerrain(cell)}
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
          combatInventory={state.combatInventory}
          onUseItem={(item) => {
            if (item.targetType === 'cell') {
              setPendingItem(item)
              dispatch({ type: 'SET_TURN_STATE', payload: { turnState: TURN_STATES.SELECTING_CELL } })
            } else {
              dispatch({ type: 'USE_ITEM', payload: { item, targetCell: null } })
            }
          }}
        />
      )}

      {inspectedCharId && state.characters[inspectedCharId] && (
        <CharacterCard
          character={state.characters[inspectedCharId]}
          terrain={state.terrain}
          onClose={() => setInspectedCharId(null)}
        />
      )}

      {inspectedTerrain && (
        <TerrainCard
          terrainCell={inspectedTerrain}
          onClose={() => setInspectedTerrain(null)}
        />
      )}

      <Transition active={transitioning} onComplete={handleTransitionComplete} />
    </div>
  )
}
