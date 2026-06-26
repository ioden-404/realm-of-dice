const CHALLENGE_POOL = [
  { id: 'no-clerc', name: 'Sans divin', desc: 'Gagner sans clerc', icon: '🚫', gloryReward: 3,
    check: (d) => d.won && !d.classes.includes('clerc') },
  { id: 'no-mage', name: 'Anti-magie', desc: 'Gagner sans mage', icon: '🔇', gloryReward: 3,
    check: (d) => d.won && !d.classes.includes('mage') },
  { id: 'all-melee', name: 'Corps à corps', desc: 'Gagner avec 3 mêlées', icon: '⚔️', gloryReward: 3,
    check: (d) => d.won && d.classes.every(c => ['guerrier', 'voleur', 'clerc'].includes(c)) },
  { id: 'no-deaths', name: 'Invincible', desc: 'Gagner sans aucune mort alliée', icon: '💪', gloryReward: 4,
    check: (d) => d.won && d.allyDeaths === 0 },
  { id: 'speed-run', name: 'Éclair', desc: 'Gagner en moins de 30 rounds total', icon: '⚡', gloryReward: 4,
    check: (d) => d.won && d.totalRounds < 30 },
  { id: 'kill-20', name: 'Carnage', desc: 'Tuer 20 ennemis en une run', icon: '💀', gloryReward: 3,
    check: (d) => d.totalKills >= 20 },
  { id: 'no-potions', name: 'Sobre', desc: 'Gagner sans utiliser de potions', icon: '🧪', gloryReward: 3,
    check: (d) => d.won && d.potionsUsed === 0 },
  { id: 'no-epic', name: 'Modeste', desc: 'Gagner sans équipement épique', icon: '🎒', gloryReward: 3,
    check: (d) => d.won && d.maxEquipTier !== 'epic' },
  { id: 'high-damage', name: 'Destructeur', desc: 'Infliger 300+ dégâts en une run', icon: '🔥', gloryReward: 3,
    check: (d) => d.damageDealt >= 300 },
  { id: 'low-damage-taken', name: 'Esquive totale', desc: 'Recevoir moins de 50 dégâts (run gagnée)', icon: '🛡️', gloryReward: 5,
    check: (d) => d.won && d.damageReceived < 50 },
  { id: 'with-modifier', name: 'Audacieux', desc: 'Gagner avec au moins 1 modificateur', icon: '🎲', gloryReward: 2,
    check: (d) => d.won && d.modifiers.length >= 1 },
  { id: 'two-modifiers', name: 'Téméraire', desc: 'Gagner avec 2+ modificateurs', icon: '💥', gloryReward: 4,
    check: (d) => d.won && d.modifiers.length >= 2 },
  { id: 'full-clear', name: 'Exploration', desc: 'Compléter les 3 actes', icon: '🗺️', gloryReward: 3,
    check: (d) => d.won && d.actsCompleted >= 3 },
  { id: 'healer-run', name: 'Guérisseur', desc: 'Soigner 100+ PV en une run', icon: '💚', gloryReward: 2,
    check: (d) => d.healingDone >= 100 },
  { id: 'boss-killer', name: 'Tueur de boss', desc: 'Tuer 2+ boss en une run', icon: '👑', gloryReward: 4,
    check: (d) => d.bossesWon >= 2 },
]

export function getActiveChallenges(completedChallenges = []) {
  const seed = Math.floor(Date.now() / (48 * 3600 * 1000))
  const indices = []
  let s = seed
  while (indices.length < 3 && indices.length < CHALLENGE_POOL.length) {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    const idx = s % CHALLENGE_POOL.length
    if (!indices.includes(idx)) indices.push(idx)
  }

  return indices.map(i => {
    const challenge = CHALLENGE_POOL[i]
    const challengeKey = `${challenge.id}-${seed}`
    return {
      ...challenge,
      seed,
      challengeKey,
      completed: completedChallenges.includes(challengeKey)
    }
  })
}

export function getTimeUntilRotation() {
  const period = 48 * 3600 * 1000
  const now = Date.now()
  const nextRotation = (Math.floor(now / period) + 1) * period
  const remaining = nextRotation - now
  const hours = Math.floor(remaining / 3600000)
  const minutes = Math.floor((remaining % 3600000) / 60000)
  return `${hours}h ${minutes}m`
}

export function evaluateChallenges(activeChallenges, runData) {
  const results = []
  for (const challenge of activeChallenges) {
    if (challenge.completed) continue
    if (challenge.check(runData)) {
      results.push(challenge)
    }
  }
  return results
}
