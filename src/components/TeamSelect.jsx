import { CLASSES, CLASS_LIST } from '../data/classes.js'
import { CLASS_COLORS } from '../data/config.js'

export default function TeamSelect({ selectedClasses, onToggle, onStart }) {
  return (
    <div className="team-select">
      <h1 className="team-title">Realm of Dice</h1>
      <p className="team-subtitle">Choisis 3 classes pour ton équipe</p>

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

      <div className="team-selected-info">
        <span>{selectedClasses.length}/3 classes sélectionnées</span>
      </div>

      <button
        className="team-start-btn"
        disabled={selectedClasses.length !== 3}
        onClick={() => onStart(selectedClasses)}
      >
        Lancer le combat
      </button>
    </div>
  )
}
