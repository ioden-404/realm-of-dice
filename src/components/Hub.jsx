import { CLASS_EMOJIS } from '../data/config.js'

const CLASS_ICONS = Object.values(CLASS_EMOJIS)

export default function Hub({ onNavigate, hasSave }) {
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

        {hasSave && (
          <button className="hub-continue-btn" onClick={() => onNavigate('continue')}>
            ▶ Continuer la campagne
          </button>
        )}
      </div>

      <nav className="hub-nav">
        <button className="hub-tab hub-tab-locked" disabled>
          <span className="hub-tab-icon">⚔️</span>
          <span className="hub-tab-label">Combat</span>
          <span className="hub-tab-lock">🔒</span>
        </button>
        <button className="hub-tab hub-tab-active" onClick={() => onNavigate('campaign')}>
          <span className="hub-tab-icon">🏗️</span>
          <span className="hub-tab-label">Étages</span>
        </button>
        <button className="hub-tab" onClick={() => onNavigate('glory')}>
          <span className="hub-tab-icon">⭐</span>
          <span className="hub-tab-label">Gloire</span>
        </button>
        <button className="hub-tab" onClick={() => onNavigate('settings')}>
          <span className="hub-tab-icon">⚙️</span>
          <span className="hub-tab-label">Paramètres</span>
        </button>
      </nav>
    </div>
  )
}
