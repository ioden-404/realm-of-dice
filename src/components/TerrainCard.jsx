import { TERRAIN_TYPES, HAZARD_DAMAGE } from '../systems/terrain.js'

const TERRAIN_INFO = {
  [TERRAIN_TYPES.BLOCKING]: {
    title: 'Terrain bloquant',
    color: '#6b5b4f',
    effects: [
      '⛔ Bloque le passage',
      '👁️ Bloque la ligne de vue'
    ]
  },
  [TERRAIN_TYPES.DIFFICULT]: {
    title: 'Terrain difficile',
    color: '#4a6fa5',
    effects: [
      '🏃 Coûte 2 points de mouvement',
      '⚔️ Aucun effet sur le combat'
    ]
  },
  [TERRAIN_TYPES.COVER]: {
    title: 'Couvert',
    color: '#2d6a4f',
    effects: [
      '🛡️ +2 CA contre les attaques à distance',
      '🏃 Mouvement normal'
    ]
  },
  [TERRAIN_TYPES.HAZARD]: {
    title: 'Zone de danger',
    color: '#8b2020',
    effects: [
      `🔥 ${HAZARD_DAMAGE} dégâts en début de tour`,
      '🌀 Dégâts si projeté dessus',
      '🏃 Mouvement normal'
    ]
  },
  oil: {
    title: 'Huile',
    color: '#8b7b2a',
    effects: [
      '🛢️ Zone inflammable',
      '🔥 Explose si touchée par du feu ou un sort de feu',
      '🏃 Mouvement normal'
    ]
  },
  fire: {
    title: 'Feu',
    color: '#cc4400',
    effects: [
      '🔥 6 dégâts en début de tour',
      '⏳ Disparaît après quelques tours',
      '🏃 Mouvement normal'
    ]
  },
  smoke: {
    title: 'Fumée',
    color: '#666666',
    effects: [
      '🌫️ Désavantage sur les attaques à travers',
      '🌫️ Désavantage pour attaquer depuis l\'intérieur',
      '⏳ Se dissipe après quelques tours'
    ]
  }
}

export default function TerrainCard({ terrainCell, onClose }) {
  if (!terrainCell) return null

  const info = TERRAIN_INFO[terrainCell.type]
  if (!info) return null

  return (
    <div className="charcard-overlay" onClick={onClose}>
      <div
        className="terrain-card"
        style={{ '--card-accent': info.color }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="charcard-close" onClick={onClose}>✕</button>

        <div className="terrain-card-header">
          <span className="terrain-card-emoji">{terrainCell.emoji}</span>
          <div className="terrain-card-identity">
            <span className="terrain-card-name">{terrainCell.label}</span>
            <span className="terrain-card-type">{info.title}</span>
          </div>
        </div>

        <div className="terrain-card-effects">
          {info.effects.map((effect, i) => (
            <div key={i} className="terrain-card-effect">{effect}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
