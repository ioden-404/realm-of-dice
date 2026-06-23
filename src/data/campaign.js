export const ACTS = [
  {
    name: 'Acte I — Forêt maudite',
    terrainTheme: 'forest',
    encounters: {
      combat: [
        { name: 'Patrouille gobeline', monsters: ['goblin', 'goblin', 'kobold'] },
        { name: 'Meute sauvage', monsters: ['wolf', 'wolf', 'goblin'] },
        { name: 'Sentinelles squelettes', monsters: ['skeleton', 'skeleton', 'kobold'] },
        { name: 'Embuscade forestière', monsters: ['goblin', 'wolf', 'kobold'] },
        { name: 'Tombeau gardé', monsters: ['skeleton', 'goblin', 'goblin'] }
      ],
      elite: [
        { name: 'Horde d\'os', monsters: ['skeleton', 'skeleton', 'skeleton', 'goblin'] },
        { name: 'Meute alpha', monsters: ['wolf', 'wolf', 'wolf'] }
      ],
      boss: [
        { name: 'Le Bugbear', monsters: ['bugbear', 'goblin', 'goblin'] }
      ]
    }
  },
  {
    name: 'Acte II — Crypte oubliée',
    terrainTheme: 'crypt',
    encounters: {
      combat: [
        { name: 'Horde putride', monsters: ['zombie', 'zombie', 'gnoll'] },
        { name: 'Esprits errants', monsters: ['specter', 'specter'] },
        { name: 'Patrouille gnoll', monsters: ['gnoll', 'gnoll', 'zombie'] },
        { name: 'Chambre funéraire', monsters: ['zombie', 'necromancer', 'zombie'] },
        { name: 'Couloir hanté', monsters: ['specter', 'gnoll', 'zombie'] }
      ],
      elite: [
        { name: 'Le nécromancien', monsters: ['necromancer', 'zombie', 'zombie', 'zombie'] },
        { name: 'Spectres vengeurs', monsters: ['specter', 'specter', 'specter'] }
      ],
      boss: [
        { name: 'Le Minotaure', monsters: ['minotaur', 'gnoll', 'gnoll'] }
      ]
    }
  },
  {
    name: 'Acte III — Pic du dragon',
    terrainTheme: 'volcano',
    encounters: {
      combat: [
        { name: 'Avant-garde orque', monsters: ['orcBerserker', 'orcBerserker'] },
        { name: 'Repaire sombre', monsters: ['darkMage', 'basilisk'] },
        { name: 'Patrouille d\'élite', monsters: ['deathKnight', 'orcBerserker'] },
        { name: 'Nid de serpents', monsters: ['basilisk', 'basilisk', 'orcBerserker'] },
        { name: 'Garde avancée', monsters: ['deathKnight', 'darkMage'] }
      ],
      elite: [
        { name: 'Garde royale', monsters: ['deathKnight', 'deathKnight', 'darkMage'] },
        { name: 'Berserkers', monsters: ['orcBerserker', 'orcBerserker', 'orcBerserker'] }
      ],
      boss: [
        { name: 'Le Jeune Dragon', monsters: ['youngDragon', 'orcBerserker', 'orcBerserker'] }
      ]
    }
  }
]

export const NODE_TYPES = {
  combat:   { icon: '⚔️', label: 'Combat' },
  elite:    { icon: '💀', label: 'Combat élite' },
  boss:     { icon: '👹', label: 'Boss' },
  treasure: { icon: '🎁', label: 'Trésor' },
  rest:     { icon: '⛺', label: 'Repos' },
  merchant: { icon: '🛒', label: 'Marchand' }
}

const MAP_TEMPLATE = [
  ['combat', 'combat', 'treasure'],
  ['rest', 'combat', 'elite'],
  ['combat', 'merchant', 'combat'],
  ['combat', 'treasure', 'combat'],
  ['rest', 'combat', 'elite'],
  ['combat', 'combat'],
  ['boss']
]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function generateCampaignMap(actIndex) {
  const layers = MAP_TEMPLATE.map((types, layerIdx) => {
    const shuffled = shuffle(types)
    return shuffled.map((type, nodeIdx) => ({
      id: `${layerIdx}-${nodeIdx}`,
      type,
      layerIndex: layerIdx,
      nodeIndex: nodeIdx,
      connections: [],
      encounter: (type === 'combat' || type === 'elite' || type === 'boss')
        ? pickRandom(ACTS[actIndex].encounters[type === 'elite' ? 'elite' : type === 'boss' ? 'boss' : 'combat'])
        : null
    }))
  })

  for (let i = 0; i < layers.length - 1; i++) {
    const current = layers[i]
    const next = layers[i + 1]
    const connected = new Set()

    for (const node of current) {
      const max = Math.min(next.length, 1 + Math.floor(Math.random() * 2))
      const indices = shuffle([...Array(next.length).keys()])
      for (let j = 0; j < max; j++) {
        if (!node.connections.includes(indices[j])) {
          node.connections.push(indices[j])
          connected.add(indices[j])
        }
      }
    }

    for (let j = 0; j < next.length; j++) {
      if (!connected.has(j)) {
        const parent = current[Math.floor(Math.random() * current.length)]
        if (!parent.connections.includes(j)) parent.connections.push(j)
      }
    }

    for (const node of current) node.connections.sort((a, b) => a - b)
  }

  return layers
}

export const REWARD_POOL = [
  { id: 'hp-team', name: '+4 PV max', description: 'Toute l\'équipe gagne +4 PV max', icon: '❤️' },
  { id: 'heal-half', name: 'Soins 50%', description: 'Récupère 50% des PV manquants', icon: '💚' },
  { id: 'heal-full', name: 'Soin complet', description: 'Toute l\'équipe soignée à 100%', icon: '✨' },
  { id: 'atk-boost', name: '+1 Attaque', description: '+1 au bonus d\'attaque', icon: '⚔️' },
  { id: 'ac-boost', name: '+1 CA', description: '+1 à la CA de l\'équipe', icon: '🛡️' },
  { id: 'move-boost', name: '+1 Mouvement', description: '+1 case de mouvement', icon: '🏃' }
]

export function generateRewardChoices(count = 3) {
  return shuffle([...REWARD_POOL]).slice(0, count)
}

export function applyCampaignRest(characters, healFactor = 0.3) {
  const updated = {}
  for (const [id, char] of Object.entries(characters)) {
    if (char.team !== 'ally') continue
    const baseHp = char.isDead ? 1 : char.hp
    const missing = char.maxHp - baseHp
    const heal = Math.floor(missing * healFactor)
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
