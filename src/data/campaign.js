export const CAMPAIGN_DATA = {
  acts: [
    {
      id: 'act1',
      name: 'Acte I — Forêt maudite',
      terrainTheme: 'forest',
      encounters: [
        { name: 'Patrouille gobeline', monsters: ['goblin', 'goblin', 'kobold'] },
        { name: 'Meute sauvage', monsters: ['wolf', 'wolf', 'goblin'] },
        { name: 'Les os bougent', monsters: ['skeleton', 'skeleton', 'skeleton'] },
        { name: 'Le Bugbear', monsters: ['bugbear', 'goblin', 'goblin'], isBoss: true }
      ]
    },
    {
      id: 'act2',
      name: 'Acte II — Crypte oubliée',
      terrainTheme: 'crypt',
      encounters: [
        { name: 'Horde putride', monsters: ['zombie', 'zombie', 'gnoll'] },
        { name: 'Esprits vengeurs', monsters: ['specter', 'specter', 'necromancer'] },
        { name: 'La horde', monsters: ['gnoll', 'gnoll', 'gnoll', 'zombie'] },
        { name: 'Le Minotaure', monsters: ['minotaur', 'gnoll', 'gnoll'], isBoss: true }
      ]
    },
    {
      id: 'act3',
      name: 'Acte III — Pic du dragon',
      terrainTheme: 'volcano',
      encounters: [
        { name: 'Avant-garde', monsters: ['orcBerserker', 'orcBerserker', 'deathKnight'] },
        { name: 'Repaire du mage', monsters: ['darkMage', 'basilisk', 'basilisk'] },
        { name: 'Garde d\'élite', monsters: ['deathKnight', 'deathKnight', 'darkMage', 'orcBerserker'] },
        { name: 'Le Jeune Dragon', monsters: ['youngDragon', 'orcBerserker', 'orcBerserker'], isBoss: true }
      ]
    }
  ]
}

export const REWARD_POOL = [
  { id: 'hp-team', name: '+4 PV max', description: 'Toute l\'équipe gagne +4 PV max', icon: '❤️' },
  { id: 'heal-half', name: 'Soins 50%', description: 'Récupère 50% des PV manquants', icon: '💚' },
  { id: 'heal-full', name: 'Soin complet', description: 'Toute l\'équipe soignée à 100%', icon: '✨' },
  { id: 'atk-boost', name: '+1 Attaque', description: '+1 au bonus d\'attaque de l\'équipe', icon: '⚔️' },
  { id: 'ac-boost', name: '+1 CA', description: '+1 à la CA de toute l\'équipe', icon: '🛡️' },
  { id: 'move-boost', name: '+1 Mouvement', description: '+1 case de mouvement pour l\'équipe', icon: '🏃' }
]

export function generateRewardChoices() {
  const shuffled = [...REWARD_POOL].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3)
}

export function applyCampaignRest(characters) {
  const updated = {}
  for (const [id, char] of Object.entries(characters)) {
    if (char.team !== 'ally') continue
    const baseHp = char.isDead ? 1 : char.hp
    const missing = char.maxHp - baseHp
    const heal = Math.floor(missing * 0.3)
    updated[id] = {
      ...char,
      hp: baseHp + heal,
      isDead: false,
      statuses: [],
      actionUsed: false,
      bonusActionUsed: false,
      reactionUsed: false,
      movementUsed: 0,
      animation: null,
      cooldowns: {}
    }
  }
  return updated
}

export function applyReward(characters, reward) {
  const updated = { ...characters }
  for (const [id, char] of Object.entries(updated)) {
    if (char.team !== 'ally') continue
    switch (reward.id) {
      case 'hp-team':
        updated[id] = { ...char, maxHp: char.maxHp + 4, hp: char.hp + 4 }
        break
      case 'heal-half': {
        const missing = char.maxHp - char.hp
        updated[id] = { ...char, hp: char.hp + Math.floor(missing * 0.5) }
        break
      }
      case 'heal-full':
        updated[id] = { ...char, hp: char.maxHp }
        break
      case 'atk-boost':
        updated[id] = { ...char, attackBonus: char.attackBonus + 1 }
        break
      case 'ac-boost':
        updated[id] = { ...char, ac: char.ac + 1 }
        break
      case 'move-boost':
        updated[id] = { ...char, movement: char.movement + 1 }
        break
    }
  }
  return updated
}
