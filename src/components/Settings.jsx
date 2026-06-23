export default function Settings({ volume, muted, onVolumeChange, onToggleMute, onBack }) {
  return (
    <div className="settings">
      <div className="settings-header">
        <button className="settings-back-btn" onClick={onBack}>← Retour</button>
        <span className="settings-header-label">PARAMÈTRES</span>
      </div>

      <div className="settings-content">
        <div className="settings-section">
          <h3 className="settings-section-title">🎵 Audio</h3>

          <div className="settings-row">
            <span className="settings-label">Musique</span>
            <button
              className={`settings-toggle ${!muted ? 'settings-toggle-on' : ''}`}
              onClick={onToggleMute}
            >
              {muted ? '🔇 OFF' : '🔊 ON'}
            </button>
          </div>

          <div className="settings-row settings-volume-row">
            <span className="settings-label">Volume</span>
            <div className="settings-volume-control">
              <span className="settings-volume-icon">🔈</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="settings-volume-slider"
                disabled={muted}
              />
              <span className="settings-volume-icon">🔊</span>
              <span className="settings-volume-value">{Math.round(volume * 100)}%</span>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3 className="settings-section-title">ℹ️ À propos</h3>
          <p className="settings-about">
            Realm of Dice — Combat tactique médiéval fantasy
          </p>
          <p className="settings-version">Version 1.0</p>
        </div>
      </div>
    </div>
  )
}
