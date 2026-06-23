import { CLASS_EMOJIS } from '../data/config.js'

const CLASS_ICONS = Object.values(CLASS_EMOJIS)

export default function Hub({ onNavigate }) {
  return (
    <div className="hub">
      <div className="hub-content">
        <div className="hub-hero">
          <div className="hub-class-circle">
            {CLASS_ICONS.map((emoji, i) => (
              <span
                key={i}
                className="hub-class-icon"
                style={{ '--i': i, '--total': CLASS_ICONS.length }}
              >
                {emoji}
              </span>
            ))}
            <span className="hub-d20">🎲</span>
          </div>
          <h1 className="hub-title">Realm of Dice</h1>
          <p className="hub-subtitle">Combat tactique médiéval fantasy</p>
        </div>
      </div>

      <nav className="hub-nav">
        <button className="hub-tab hub-tab-active" onClick={() => onNavigate('combat')}>
          <span className="hub-tab-icon">⚔️</span>
          <span className="hub-tab-label">Combat</span>
        </button>
        <button className="hub-tab hub-tab-locked" disabled>
          <span className="hub-tab-icon">📜</span>
          <span className="hub-tab-label">Campagne</span>
          <span className="hub-tab-lock">🔒</span>
        </button>
        <button className="hub-tab hub-tab-locked" disabled>
          <span className="hub-tab-icon">🛒</span>
          <span className="hub-tab-label">Boutique</span>
          <span className="hub-tab-lock">🔒</span>
        </button>
        <button className="hub-tab" onClick={() => onNavigate('settings')}>
          <span className="hub-tab-icon">⚙️</span>
          <span className="hub-tab-label">Paramètres</span>
        </button>
      </nav>
    </div>
  )
}
