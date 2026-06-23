import { CAMPAIGN_DATA } from '../data/campaign.js'
import { CLASS_COLORS } from '../data/config.js'

export default function CampaignRest({
  characters,
  campaign,
  rewards,
  rewardSelected,
  stats,
  onSelectReward,
  onNextCombat,
  onAbandon
}) {
  const allies = Object.values(characters).filter(c => c.team === 'ally')
  const act = CAMPAIGN_DATA.acts[campaign.act]
  const encountersDone = campaign.encounter + 1
  const totalEncounters = act.encounters.length
  const isActComplete = encountersDone >= totalEncounters
  const nextAct = isActComplete && campaign.act < CAMPAIGN_DATA.acts.length - 1
    ? CAMPAIGN_DATA.acts[campaign.act + 1]
    : null
  const nextEncounter = isActComplete
    ? (nextAct ? nextAct.encounters[0] : null)
    : act.encounters[campaign.encounter + 1]

  return (
    <div className="campaign-rest">
      <div className="campaign-rest-scroll">
        <div className="campaign-header">
          <h2 className="campaign-act-title">{act.name}</h2>
          <div className="campaign-progress">
            <div className="campaign-progress-bar">
              <div
                className="campaign-progress-fill"
                style={{ width: `${(encountersDone / totalEncounters) * 100}%` }}
              />
            </div>
            <span className="campaign-progress-text">
              {encountersDone}/{totalEncounters} combats
            </span>
          </div>
        </div>

        <div className="campaign-victory-banner">
          ⚔️ Victoire ! — {stats.damageDealt} dégâts infligés en {stats.rounds} rounds
        </div>

        <div className="campaign-team">
          <h3 className="campaign-section-title">⛺ Repos — L'équipe récupère</h3>
          {allies.map(char => {
            const hpPercent = char.hp / char.maxHp
            const hpColor = hpPercent > 0.5 ? '#4caf50' : hpPercent > 0.25 ? '#ff9800' : '#f44336'
            const classColor = CLASS_COLORS[char.classId] || '#9a8a6a'
            return (
              <div key={char.id} className="campaign-char">
                <span className="campaign-char-emoji">{char.emoji}</span>
                <div className="campaign-char-info">
                  <span className="campaign-char-name" style={{ color: classColor }}>{char.name}</span>
                  <div className="campaign-hp-bar">
                    <div
                      className="campaign-hp-fill"
                      style={{ width: `${hpPercent * 100}%`, background: hpColor }}
                    />
                  </div>
                  <span className="campaign-hp-text">{char.hp}/{char.maxHp} PV</span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="campaign-rewards">
          <h3 className="campaign-section-title">🎁 Choisissez une amélioration</h3>
          <div className="campaign-reward-list">
            {rewards.map(reward => (
              <button
                key={reward.id}
                className={`campaign-reward ${rewardSelected ? 'reward-disabled' : ''}`}
                onClick={() => !rewardSelected && onSelectReward(reward)}
                disabled={rewardSelected}
              >
                <span className="reward-icon">{reward.icon}</span>
                <div className="reward-info">
                  <span className="reward-name">{reward.name}</span>
                  <span className="reward-desc">{reward.description}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {rewardSelected && nextEncounter && (
          <button className="campaign-next-btn" onClick={onNextCombat}>
            ⚔️ {isActComplete ? `${nextAct.name} — ` : ''}{nextEncounter.name}
          </button>
        )}

        <button className="abandon-btn" onClick={onAbandon} style={{ marginTop: '8px' }}>
          🚪 Abandonner la campagne
        </button>
      </div>
    </div>
  )
}
