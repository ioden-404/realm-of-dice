import StatusBadge from './StatusBadge.jsx'
import { CLASS_COLORS } from '../data/config.js'

const TERRAIN_LABELS = {
  cover: { icon: '🛡️', label: 'Couvert', desc: '+2 CA contre tirs à distance' },
  hazard: { icon: '🔥', label: 'Zone de danger', desc: '4 dégâts en début de tour' },
  difficult: { icon: '🐌', label: 'Terrain difficile', desc: 'Coûte 2 pts de mouvement' },
  blocking: { icon: '⛔', label: 'Terrain bloquant', desc: 'Infranchissable' }
}

export default function CharacterCard({ character, terrain, onClose }) {
  const terrainCell = terrain ? terrain[`${character.position.x},${character.position.y}`] : null
  const terrainInfo = terrainCell ? TERRAIN_LABELS[terrainCell.type] : null
  if (!character) return null

  const hpPercent = character.hp / character.maxHp
  const hpColor = hpPercent > 0.5 ? '#4caf50' : hpPercent > 0.25 ? '#ff9800' : '#f44336'
  const classColor = CLASS_COLORS[character.classId]
  const teamLabel = character.team === 'ally' ? 'Allié' : 'Ennemi'

  let acBonus = 0
  const def = character.statuses.find(s => s.type === 'defensePosture')
  if (def) acBonus += def.acBonus || 2

  const rageBonus = character.statuses.some(s => s.type === 'rage') ? 2 : 0

  return (
    <div className="charcard-overlay" onClick={onClose}>
      <div
        className="charcard"
        style={{ '--card-accent': classColor }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="charcard-close" onClick={onClose}>✕</button>

        <div className="charcard-header">
          <span className="charcard-emoji">{character.emoji}</span>
          <div className="charcard-identity">
            <span className="charcard-name">{character.name}</span>
            <span className="charcard-class">{character.classData.name} - {teamLabel}</span>
          </div>
        </div>

        <div className="charcard-hp">
          <div className="charcard-hp-bar">
            <div
              className="charcard-hp-fill"
              style={{ width: `${hpPercent * 100}%`, background: hpColor }}
            />
          </div>
          <span className="charcard-hp-text">{character.hp} / {character.maxHp} PV</span>
        </div>

        <div className="charcard-stats">
          <div className="charcard-stat">
            <span className="charcard-stat-icon">🛡️</span>
            <span className="charcard-stat-label">CA</span>
            <span className="charcard-stat-value">
              {character.ac}
              {acBonus > 0 && <span className="charcard-bonus"> (+{acBonus})</span>}
            </span>
          </div>
          <div className="charcard-stat">
            <span className="charcard-stat-icon">⚔️</span>
            <span className="charcard-stat-label">ATK</span>
            <span className="charcard-stat-value">
              +{character.attackBonus}
              {rageBonus > 0 && <span className="charcard-bonus"> (+{rageBonus})</span>}
            </span>
          </div>
          <div className="charcard-stat">
            <span className="charcard-stat-icon">🏃</span>
            <span className="charcard-stat-label">Mouvement</span>
            <span className="charcard-stat-value">{character.movement - character.movementUsed}/{character.movement}</span>
          </div>
          <div className="charcard-stat">
            <span className="charcard-stat-icon">📏</span>
            <span className="charcard-stat-label">Portée</span>
            <span className="charcard-stat-value">{character.range === 1 ? 'Mêlée' : `${character.range} cases`}</span>
          </div>
        </div>

        <div className="charcard-damage">
          <span>🔥 Dégâts de base : {character.classData.damageDice}</span>
        </div>

        {character.statuses.length > 0 && (
          <div className="charcard-statuses">
            <span className="charcard-statuses-label">Statuts actifs</span>
            <div className="charcard-statuses-list">
              {character.statuses.map((s, i) => (
                <StatusBadge key={`${s.type}-${i}`} status={s} />
              ))}
            </div>
          </div>
        )}

        {terrainInfo && (
          <div className="charcard-terrain">
            <span>{terrainInfo.icon} {terrainInfo.label}</span>
            <span className="charcard-terrain-desc">{terrainInfo.desc}</span>
          </div>
        )}

        {character.evolved && (
          <div className="charcard-evolved">⚡ Classe évoluée</div>
        )}
      </div>
    </div>
  )
}
