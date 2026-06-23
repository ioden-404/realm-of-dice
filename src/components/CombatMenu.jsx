import { useState } from 'react'

export default function CombatMenu({ volume, muted, onVolumeChange, onToggleMute, onAbandon }) {
  const [open, setOpen] = useState(false)
  const [confirmAbandon, setConfirmAbandon] = useState(false)

  if (!open) {
    return (
      <button className="combat-menu-toggle" onClick={() => setOpen(true)}>
        ⚙️
      </button>
    )
  }

  return (
    <div className="combat-menu-overlay" onClick={() => { setOpen(false); setConfirmAbandon(false) }}>
      <div className="combat-menu" onClick={e => e.stopPropagation()}>
        <h3 className="combat-menu-title">Paramètres</h3>

        <div className="combat-menu-row">
          <span className="combat-menu-label">{muted ? '🔇' : '🔊'} Volume</span>
          <input
            type="range"
            min="0" max="1" step="0.05"
            value={muted ? 0 : volume}
            onChange={e => onVolumeChange(parseFloat(e.target.value))}
            className="combat-menu-slider"
          />
        </div>

        <div className="combat-menu-row">
          <button className="combat-menu-btn" onClick={onToggleMute}>
            {muted ? '🔇 Son coupé' : '🔊 Son activé'}
          </button>
        </div>

        <div className="combat-menu-divider" />

        {!confirmAbandon ? (
          <button className="combat-menu-btn combat-menu-abandon" onClick={() => setConfirmAbandon(true)}>
            🚪 Abandonner le combat
          </button>
        ) : (
          <div className="combat-menu-confirm">
            <span>Quitter le combat ?</span>
            <div className="combat-menu-confirm-btns">
              <button className="abandon-yes" onClick={onAbandon}>Oui</button>
              <button className="abandon-no" onClick={() => setConfirmAbandon(false)}>Non</button>
            </div>
          </div>
        )}

        <button className="combat-menu-btn combat-menu-close" onClick={() => { setOpen(false); setConfirmAbandon(false) }}>
          Fermer
        </button>
      </div>
    </div>
  )
}
