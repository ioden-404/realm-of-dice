export default function VictoryScreen({ isVictory, stats, onRestart }) {
  return (
    <div className="victory-overlay">
      <div className={`victory-scroll ${isVictory ? 'victory-win' : 'victory-lose'}`}>
        <h1 className="victory-title">
          {isVictory ? 'VICTOIRE' : 'DÉFAITE'}
        </h1>
        <div className="victory-stats">
          <div className="victory-stat">
            <span className="victory-stat-label">Rounds</span>
            <span className="victory-stat-value">{stats.rounds}</span>
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
        </div>
        <button className="victory-btn" onClick={onRestart}>
          Rejouer
        </button>
      </div>
    </div>
  )
}
