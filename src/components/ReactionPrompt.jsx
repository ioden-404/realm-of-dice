export default function ReactionPrompt({ reaction, onConfirm, onSkip }) {
  if (!reaction) return null

  const displayText = typeof reaction.reactionName === 'string'
    ? reaction.reactionName
    : 'Réaction disponible'

  return (
    <div className="reaction-prompt-overlay">
      <div className="reaction-prompt">
        <div className="reaction-prompt-icon">🛡️</div>
        <div className="reaction-prompt-text">{displayText}</div>
        <div className="reaction-prompt-actions">
          <button className="reaction-prompt-yes" onClick={onConfirm}>
            ✓ Utiliser
          </button>
          <button className="reaction-prompt-no" onClick={onSkip}>
            ✕ Passer
          </button>
        </div>
      </div>
    </div>
  )
}
