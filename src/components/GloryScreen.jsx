import { useState } from 'react'
import { GLORY_UPGRADES } from '../data/modifiers.js'
import { MONSTERS } from '../data/monsters.js'
import { getActiveChallenges, getTimeUntilRotation } from '../data/challenges.js'

const B = import.meta.env.BASE_URL
const MONSTER_IMAGES = {
  silhouette: B + 'Images/silhouette.png',
  goblin: B + 'Images/gobelin.png',
  wolf: B + 'Images/loup.png',
  skeleton: B + 'Images/squelette.png',
  kobold: B + 'Images/kobold.png',
  bugbear: B + 'Images/bugbear.png',
  gnoll: B + 'Images/gnoll.png',
  zombie: B + 'Images/zombie.png',
  necromancer: B + 'Images/necromancien.png',
  specter: B + 'Images/spectre.png',
  minotaur: B + 'Images/minotaure.png',
  orcBerserker: B + 'Images/orque.png',
  darkMage: B + 'Images/magenoir.png',
  deathKnight: B + 'Images/chevaliermort.png',
  basilisk: B + 'Images/basilic.png',
  youngDragon: B + 'Images/dragon.png'
}

const ALL_MONSTER_IDS = Object.keys(MONSTERS)

export default function GloryScreen({ glory, onUpgrade, onBack }) {
  const [tab, setTab] = useState('upgrades')
  const bestiary = glory.bestiary || {}
  const discovered = ALL_MONSTER_IDS.filter(id => bestiary[id] > 0)
  const challenges = getActiveChallenges(glory.completedChallenges || [])

  return (
    <div className="glory-screen">
      <h2 className="glory-title">Gloire</h2>
      <div className="glory-stats">
        <span>⭐ {glory.points} pts</span>
        <span>🏆 {glory.victories} vic.</span>
        <span>📊 {glory.totalRuns} runs</span>
        {(glory.bestScore || 0) > 0 && <span>🎯 {glory.bestScore}</span>}
      </div>

      <div className="glory-tabs">
        <button className={`glory-tab ${tab === 'upgrades' ? 'glory-tab-active' : ''}`} onClick={() => setTab('upgrades')}>
          Upgrades
        </button>
        <button className={`glory-tab ${tab === 'challenges' ? 'glory-tab-active' : ''}`} onClick={() => setTab('challenges')}>
          Défis
        </button>
        <button className={`glory-tab ${tab === 'bestiary' ? 'glory-tab-active' : ''}`} onClick={() => setTab('bestiary')}>
          Bestiaire ({discovered.length}/{ALL_MONSTER_IDS.length})
        </button>
      </div>

      {tab === 'upgrades' && (
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
      )}

      {tab === 'challenges' && (
        <div className="challenges-section">
          <div className="challenges-timer">🔄 Rotation dans {getTimeUntilRotation()}</div>
          <div className="challenges-list">
            {challenges.map(c => (
              <div key={c.challengeKey} className={`challenge-card ${c.completed ? 'challenge-done' : ''}`}>
                <span className="challenge-icon">{c.icon}</span>
                <div className="challenge-info">
                  <span className="challenge-name">{c.name}</span>
                  <span className="challenge-desc">{c.desc}</span>
                </div>
                <span className="challenge-reward">
                  {c.completed ? '✅' : `⭐ ${c.gloryReward}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'bestiary' && (
        <div className="bestiary-grid">
          {ALL_MONSTER_IDS.map(id => {
            const monster = MONSTERS[id]
            const kills = bestiary[id] || 0
            const isDiscovered = kills > 0
            const img = MONSTER_IMAGES[id]
            return (
              <div key={id} className={`bestiary-card ${isDiscovered ? '' : 'bestiary-hidden'}`}>
                <div className="bestiary-img-wrap">
                  {isDiscovered && img ? (
                    <img src={img} alt="" className="bestiary-img" />
                  ) : (
                    <span className="bestiary-unknown">?</span>
                  )}
                </div>
                <div className="bestiary-info">
                  <span className="bestiary-name">{isDiscovered ? monster.name : '???'}</span>
                  {isDiscovered && (
                    <div className="bestiary-stats-row">
                      <span>❤️ {monster.hp}</span>
                      <span>🛡️ {monster.ac}</span>
                      <span>⚔️ +{monster.attackBonus}</span>
                    </div>
                  )}
                  {isDiscovered && (
                    <span className="bestiary-kills">💀 {kills} tués</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <button className="glory-back" onClick={onBack}>← Retour</button>
    </div>
  )
}
