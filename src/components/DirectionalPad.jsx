export default function DirectionalPad({ movementRemaining, onMove, onConfirm, onCancel }) {
  return (
    <div className="dpad-container">
      <div className="dpad-info">
        Mouvement : {movementRemaining} cases restantes
      </div>
      <div className="dpad">
        <div className="dpad-row">
          <div className="dpad-spacer" />
          <button className="dpad-btn" onClick={() => onMove(0, -1)}>↑</button>
          <div className="dpad-spacer" />
        </div>
        <div className="dpad-row">
          <button className="dpad-btn" onClick={() => onMove(-1, 0)}>←</button>
          <div className="dpad-center" />
          <button className="dpad-btn" onClick={() => onMove(1, 0)}>→</button>
        </div>
        <div className="dpad-row">
          <div className="dpad-spacer" />
          <button className="dpad-btn" onClick={() => onMove(0, 1)}>↓</button>
          <div className="dpad-spacer" />
        </div>
      </div>
      <div className="dpad-actions">
        <button className="dpad-confirm" onClick={onConfirm}>Confirmer</button>
        <button className="dpad-cancel" onClick={onCancel}>Annuler</button>
      </div>
    </div>
  )
}
