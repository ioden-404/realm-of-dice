import { useState } from 'react'
import { RUN_MODIFIERS } from '../data/modifiers.js'

export default function RunModifiers({ onConfirm, onBack }) {
  const [selected, setSelected] = useState([])

  const toggle = (id) => {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  return (
    <div className="run-mod-screen">
      <h2 className="run-mod-title">Malédictions</h2>
      <p className="run-mod-subtitle">Choisissez des malédictions pour augmenter la difficulté et les récompenses</p>

      <div className="run-mod-list">
        {RUN_MODIFIERS.map(mod => {
          const active = selected.includes(mod.id)
          return (
            <button
              key={mod.id}
              className={`run-mod-card ${active ? 'run-mod-active' : ''}`}
              onClick={() => toggle(mod.id)}
            >
              <div className="run-mod-header">
                <span className="run-mod-icon">{mod.icon}</span>
                <span className="run-mod-name">{mod.name}</span>
              </div>
              <div className="run-mod-desc">{mod.desc}</div>
              <div className="run-mod-reward">Bonus : {mod.reward}</div>
            </button>
          )
        })}
      </div>

      <div className="run-mod-count">
        {selected.length} malédiction{selected.length !== 1 ? 's' : ''} active{selected.length !== 1 ? 's' : ''}
      </div>

      <div className="run-mod-actions">
        <button className="run-mod-back" onClick={onBack}>← Retour</button>
        <button className="run-mod-start" onClick={() => onConfirm(selected)}>
          {selected.length > 0 ? `Lancer avec ${selected.length} malédiction${selected.length > 1 ? 's' : ''}` : 'Lancer sans malédiction'}
        </button>
      </div>
    </div>
  )
}
