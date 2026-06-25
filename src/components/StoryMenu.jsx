import { PROLOGUE } from '../data/prologue.js'

export default function StoryMenu({ hasSave, onContinue, onNewStory, onBack }) {
  return (
    <div className="story-menu">
      <div className="story-menu-header">
        <button className="team-back-btn" onClick={onBack}>← Retour</button>
        <span className="team-header-label">HISTOIRE</span>
      </div>

      <div className="story-menu-content">
        <div className="story-menu-hero">
          <span className="story-menu-icon">📜</span>
          <h2 className="story-menu-title">{PROLOGUE.title}</h2>
          <p className="story-menu-subtitle">Prologue</p>
        </div>

        <div className="story-menu-actions">
          {hasSave && (
            <button className="story-menu-btn story-menu-continue" onClick={onContinue}>
              ▶ Continuer
            </button>
          )}
          <button className="story-menu-btn story-menu-new" onClick={() => {
            if (hasSave) {
              if (window.confirm('Commencer une nouvelle histoire effacera ta progression actuelle.')) {
                onNewStory()
              }
            } else {
              onNewStory()
            }
          }}>
            ✦ Nouvelle histoire
          </button>
        </div>
      </div>
    </div>
  )
}
