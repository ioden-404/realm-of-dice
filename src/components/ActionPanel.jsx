import { useState } from 'react'
import { TURN_STATES } from '../data/config.js'
import { UNIVERSAL_ACTIONS } from '../data/items.js'

function getACBonus(character) {
  let bonus = 0
  const def = character.statuses.find(s => s.type === 'defensePosture')
  if (def) bonus += def.acBonus || 2
  return bonus
}

function formatAC(character) {
  const bonus = getACBonus(character)
  if (bonus > 0) return `CA ${character.ac} (+${bonus})`
  return `CA ${character.ac}`
}

function rangeLabel(ability) {
  if (ability.range === undefined && ability.effect) return null
  const r = ability.range || 1
  return r === 1 ? 'Mêlée' : `${r} cases`
}

function AbilityButton({ ability, abilityState, onClick }) {
  const [expanded, setExpanded] = useState(false)
  const range = rangeLabel(ability)

  return (
    <div className={`ability-card ${!abilityState.available ? 'ability-disabled' : ''}`}>
      <button
        className="ability-card-main"
        disabled={!abilityState.available}
        onClick={onClick}
      >
        <div className="ability-card-top">
          <span className="ability-name">{ability.name}</span>
          <div className="ability-card-badges">
            {ability.damage && <span className="ability-damage">🔥 {ability.damage}</span>}
            {ability.heal && <span className="ability-heal">💚 {ability.heal}</span>}
            {range && <span className="ability-range">📏 {range}</span>}
          </div>
        </div>
        <div className="ability-card-bottom">
          {!abilityState.available && (
            <span className="ability-cd">{abilityState.reason}</span>
          )}
          {abilityState.available && abilityState.uses !== undefined && (
            <span className="ability-uses">{abilityState.uses}x restant</span>
          )}
          {ability.cooldown > 0 && abilityState.available && (
            <span className="ability-cd-info">CD {ability.cooldown} tours</span>
          )}
        </div>
      </button>
      <button
        className="ability-info-toggle"
        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
        title="Description"
      >
        {expanded ? '▲' : 'ⓘ'}
      </button>
      {expanded && (
        <div className="ability-desc">
          {ability.description}
          {ability.sneakAttack && <div className="ability-desc-note">+2d6 si avantage ou allié adjacent à la cible</div>}
          {ability.magical && <div className="ability-desc-note">Sort magique - nécessite ligne de vue</div>}
          {ability.armorPiercing && <div className="ability-desc-note">Perce l'armure - ignore les bonus de CA</div>}
          {ability.concentration && <div className="ability-desc-note">Concentration - un seul sort actif à la fois</div>}
          {ability.hits && <div className="ability-desc-note">{ability.hits} frappes séparées</div>}
        </div>
      )}
    </div>
  )
}

export default function ActionPanel({
  character,
  turnState,
  selectedCategory,
  getAbilityState,
  onStartMove,
  onSelectCategory,
  onSelectAbility,
  onEndTurn,
  onBack,
  combatInventory,
  onUseItem,
  onToggleReactions
}) {
  if (!character || character.team === 'enemy') return null

  const classData = character.classData
  const canMove = character.movementUsed < character.movement && !character.statuses.some(s => s.type === 'stunned')
  const isStunned = character.statuses.some(s => s.type === 'stunned')

  if (isStunned) {
    return (
      <div className="action-panel">
        <div className="action-stunned">⚡ {character.name} est étourdi !</div>
        <button className="action-btn action-end" onClick={onEndTurn}>
          Fin du tour
        </button>
      </div>
    )
  }

  if (turnState === TURN_STATES.SELECTING_ACTION && selectedCategory) {
    if (selectedCategory === 'items') {
      const items = (combatInventory || []).filter(i => !i.outOfCombat)
      return (
        <div className="action-panel">
          <div className="action-header">
            <button className="action-back" onClick={onBack}>← Retour</button>
            <span className="action-title">🎒 Objets</span>
          </div>
          <div className="ability-list">
            {items.length === 0 && <div className="action-empty">Aucun objet</div>}
            {items.map((item, i) => {
              const canUse = item.actionType === 'bonus' ? !character.bonusActionUsed : !character.actionUsed
              return (
                <div key={`${item.id}-${i}`} className={`ability-card ${!canUse ? 'ability-disabled' : ''}`}>
                  <button className="ability-card-main" disabled={!canUse} onClick={() => canUse && onUseItem(item)}>
                    <div className="ability-card-top">
                      <span className="ability-name">{item.emoji} {item.name}</span>
                      <span className="ability-damage">{item.actionType === 'bonus' ? 'Bonus' : 'Action'}</span>
                    </div>
                    <div className="ability-card-bottom">
                      <span className="ability-cd-info">{item.description}</span>
                    </div>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    let abilities = selectedCategory === 'actions'
      ? [...classData.abilities.actions]
      : [...classData.abilities.bonusActions]
    const isBonusAction = selectedCategory === 'bonusActions'

    if (selectedCategory === 'actions') {
      const hasDisengage = abilities.some(a => a.effect === 'disengage')
      const hasDodge = abilities.some(a => a.effect === 'dodge')
      if (!hasDisengage) abilities.push(UNIVERSAL_ACTIONS.find(a => a.effect === 'disengage'))
      if (!hasDodge) abilities.push(UNIVERSAL_ACTIONS.find(a => a.effect === 'dodge'))
    }

    return (
      <div className="action-panel">
        <div className="action-header">
          <button className="action-back" onClick={onBack}>← Retour</button>
          <span className="action-title">{isBonusAction ? 'Bonus Actions' : 'Actions'}</span>
        </div>
        <div className="ability-list">
          {abilities.filter(Boolean).map(ability => {
            const abilityState = getAbilityState(character.id, ability)
            return (
              <AbilityButton
                key={ability.id}
                ability={ability}
                abilityState={abilityState}
                onClick={() => onSelectAbility(ability, isBonusAction)}
              />
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="action-panel">
      <div className="action-stats">
        <span className="stat-name">{character.name}</span>
        <span className="stat-hp">❤️ {character.hp}/{character.maxHp}</span>
        <span className="stat-ac">🛡️ {formatAC(character)}</span>
      </div>
      <div className="action-grid">
        <button
          className={`action-btn ${character.actionUsed ? 'action-used' : ''}`}
          disabled={character.actionUsed}
          onClick={() => onSelectCategory('actions')}
        >
          ⚔️ Action
        </button>
        <button
          className={`action-btn ${!canMove ? 'action-used' : ''}`}
          disabled={!canMove}
          onClick={onStartMove}
        >
          🏃 Déplacer
          <span className="action-sub">{character.movement - character.movementUsed} cases</span>
        </button>
        <button
          className={`action-btn ${character.bonusActionUsed || classData.abilities.bonusActions.length === 0 ? 'action-used' : ''}`}
          disabled={character.bonusActionUsed || classData.abilities.bonusActions.length === 0}
          onClick={() => onSelectCategory('bonusActions')}
        >
          ✨ Bonus
        </button>
        <button
          className={`action-btn ${(!combatInventory || combatInventory.length === 0) ? 'action-used' : ''}`}
          disabled={!combatInventory || combatInventory.length === 0}
          onClick={() => onSelectCategory('items')}
        >
          🎒 Objets
          {combatInventory?.length > 0 && <span className="action-sub">{combatInventory.length}</span>}
        </button>
        {classData.abilities.reactions.length > 0 && (
          <button
            className={`action-btn ${character.reactionsEnabled !== false ? 'action-reaction-on' : 'action-reaction-off'}`}
            onClick={onToggleReactions}
          >
            {character.reactionsEnabled !== false ? '🛡️ Réactions ON' : '❌ Réactions OFF'}
          </button>
        )}
        <button className="action-btn action-end" onClick={onEndTurn}>
          ⏭️ Fin du tour
        </button>
      </div>
    </div>
  )
}
