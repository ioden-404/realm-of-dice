import { LEVEL_UP_TREES } from '../data/levelUpTrees.js'
import { CLASS_COLORS } from '../data/config.js'

export default function LevelUpScreen({ character, level, onChoose }) {
  if (!character) return null

  const tree = LEVEL_UP_TREES[character.classId]
  if (!tree || !tree.levels[level]) return null

  const choices = tree.levels[level]
  const classColor = CLASS_COLORS[character.classId] || '#9a8a6a'

  return (
    <div className="cmap-event-overlay">
      <div className="levelup-panel" onClick={e => e.stopPropagation()}>
        <div className="levelup-header">
          <span className="levelup-emoji">{character.emoji}</span>
          <div>
            <h3 className="levelup-title" style={{ color: classColor }}>
              {character.name} — Niveau {level} !
            </h3>
            <p className="levelup-subtitle">Choisissez une nouvelle capacité</p>
          </div>
        </div>

        <div className="levelup-choices">
          {choices.map(ability => (
            <button
              key={ability.id}
              className="levelup-choice"
              onClick={() => onChoose(character.id, ability)}
            >
              <div className="levelup-choice-header">
                <span className="levelup-choice-name">{ability.name}</span>
                <span className={`levelup-path levelup-path-${ability.path?.toLowerCase()}`}>
                  {ability.path}
                </span>
              </div>
              <div className="levelup-choice-desc">{ability.description}</div>
              <div className="levelup-choice-meta">
                {ability.damage && <span>🔥 {ability.damage}</span>}
                {ability.heal && <span>💚 {ability.heal}</span>}
                {ability.range > 1 && <span>📏 {ability.range}</span>}
                {ability.cooldown > 0 && <span>⏳ CD {ability.cooldown}</span>}
                {ability.maxUses > 0 && <span>🔢 {ability.maxUses}x</span>}
                <span className="levelup-choice-type">
                  {ability.category === 'bonusActions' ? 'Bonus' : ability.category === 'reactions' ? 'Réaction' : 'Action'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
