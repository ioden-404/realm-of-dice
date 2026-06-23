import { GLORY_UPGRADES } from '../data/modifiers.js'

export default function GloryScreen({ glory, onUpgrade, onBack }) {
  return (
    <div className="glory-screen">
      <h2 className="glory-title">Gloire</h2>
      <div className="glory-stats">
        <span>⭐ {glory.points} points</span>
        <span>🏆 {glory.victories} victoires</span>
        <span>📊 {glory.totalRuns} runs</span>
      </div>

      <div className="glory-upgrades">
        {GLORY_UPGRADES.map(upgrade => {
          const level = glory.upgrades[upgrade.id] || 0
          const maxed = level >= upgrade.maxLevel
          const canBuy = glory.points >= upgrade.cost && !maxed
          return (
            <button
              key={upgrade.id}
              className={`glory-upgrade ${maxed ? 'glory-maxed' : ''} ${!canBuy && !maxed ? 'glory-locked' : ''}`}
              onClick={() => canBuy && onUpgrade(upgrade)}
              disabled={!canBuy}
            >
              <div className="glory-upgrade-header">
                <span className="glory-upgrade-icon">{upgrade.icon}</span>
                <span className="glory-upgrade-name">{upgrade.name}</span>
                <span className="glory-upgrade-level">{level}/{upgrade.maxLevel}</span>
              </div>
              <div className="glory-upgrade-desc">{upgrade.desc}</div>
              {!maxed && <div className="glory-upgrade-cost">⭐ {upgrade.cost}</div>}
              {maxed && <div className="glory-upgrade-cost">MAX</div>}
            </button>
          )
        })}
      </div>

      <button className="glory-back" onClick={onBack}>← Retour</button>
    </div>
  )
}
