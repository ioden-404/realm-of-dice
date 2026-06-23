import { CLASSES, CLASS_LIST } from '../data/classes.js'
import { CLASS_COLORS, CLASS_EMOJIS } from '../data/config.js'

export default function TeamSelect({ selectedClasses, onToggle, onStart, onBack }) {
  const slots = [0, 1, 2]

  return (
    <div className="team-select">
      <div className="team-header">
        <button className="team-back-btn" onClick={onBack}>← Retour</button>
        <span className="team-header-label">COMBAT</span>
      </div>

      <h2 className="team-title">Choisis tes champions</h2>
      <p className="team-subtitle">3 sur 5</p>

      <div className="class-grid">
        {CLASS_LIST.map(cls => {
          const isSelected = selectedClasses.includes(cls.id)
          return (
            <button
              key={cls.id}
              className={`class-card ${isSelected ? 'class-selected' : ''}`}
              style={{ '--class-color': CLASS_COLORS[cls.id] }}
              onClick={() => onToggle(cls.id)}
            >
              <div className="class-emoji">{cls.emoji}</div>
              <div className="class-name">{cls.name}</div>
              <div className="class-stats-preview">
                <span>❤️ {cls.hp}</span>
                <span>🛡️ {cls.ac}</span>
                <span>⚔️ {cls.damageDice}</span>
              </div>
              <div className="class-desc">{cls.description}</div>
              <div className="class-details">
                <span>Portée : {cls.range} case{cls.range > 1 ? 's' : ''}</span>
                <span>Mouvement : {cls.movement} cases</span>
              </div>
              {isSelected && <div className="class-check">✓</div>}
            </button>
          )
        })}
      </div>

      <div className="team-slots-section">
        <span className="team-slots-label">Ton équipe</span>
        <div className="team-slots">
          {slots.map(i => {
            const classId = selectedClasses[i]
            return (
              <div key={i} className={`team-slot ${classId ? 'team-slot-filled' : ''}`}>
                {classId ? (
                  <span className="team-slot-emoji">{CLASS_EMOJIS[classId]}</span>
                ) : (
                  <span className="team-slot-empty">?</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <button
        className="team-start-btn"
        disabled={selectedClasses.length !== 3}
        onClick={() => onStart(selectedClasses)}
      >
        ⚔️ Lancer le combat
      </button>
    </div>
  )
}
