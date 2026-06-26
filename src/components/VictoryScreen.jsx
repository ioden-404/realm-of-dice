export default function VictoryScreen({ isVictory, stats, onRestart, title, subtitle, gloryGain, runScore, bestScore, isNewRecord }) {
  return (
    <div className="victory-overlay">
      <div className={`victory-scroll ${isVictory ? 'victory-win' : 'victory-lose'}`}>
        <h1 className="victory-title">
          {title || (isVictory ? 'VICTOIRE' : 'DÉFAITE')}
        </h1>
        {subtitle && <p className="victory-subtitle">{subtitle}</p>}

        {runScore !== undefined && (
          <div className="victory-score-section">
            <div className="victory-score-label">Score</div>
            <div className={`victory-score-value ${isNewRecord ? 'victory-new-record' : ''}`}>
              {runScore}
            </div>
            {isNewRecord && <div className="victory-record-badge">🏆 Nouveau record !</div>}
            {!isNewRecord && bestScore > 0 && (
              <div className="victory-best-score">Meilleur : {bestScore}</div>
            )}
          </div>
        )}

        <div className="victory-stats">
          <div className="victory-stat">
            <span className="victory-stat-label">Rounds</span>
            <span className="victory-stat-value">{stats.rounds}</span>
          </div>
          <div className="victory-stat">
            <span className="victory-stat-label">Ennemis tués</span>
            <span className="victory-stat-value">{stats.enemiesKilled || 0}</span>
          </div>
          <div className="victory-stat">
            <span className="victory-stat-label">Dégâts infligés</span>
            <span className="victory-stat-value">{stats.damageDealt}</span>
          </div>
          <div className="victory-stat">
            <span className="victory-stat-label">Dégâts reçus</span>
            <span className="victory-stat-value">{stats.damageReceived}</span>
          </div>
          <div className="victory-stat">
            <span className="victory-stat-label">Soins prodigués</span>
            <span className="victory-stat-value">{stats.healingDone}</span>
          </div>
          <div className="victory-stat">
            <span className="victory-stat-label">Morts alliées</span>
            <span className="victory-stat-value">{stats.allyDeaths || 0}</span>
          </div>
        </div>
        {gloryGain > 0 && (
          <div className="victory-glory">⭐ +{gloryGain} points de gloire</div>
        )}
        <button className="victory-btn" onClick={onRestart}>
          Rejouer
        </button>
      </div>
    </div>
  )
}
