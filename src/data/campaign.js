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

// ============ XP SYSTEM ============

export const XP_PALIERS = [
  { id: 'p1', xp: 1, label: '+2 PV max', effects: [{ stat: 'maxHp', value: 2 }] },
  { id: 'p2', xp: 3, label: '+1 ATK', effects: [{ stat: 'attackBonus', value: 1 }] },
  { id: 'p3', xp: 5, label: '+1 CA', effects: [{ stat: 'ac', value: 1 }] },
  { id: 'evo', xp: 6, label: 'Évolution !', isEvolution: true, effects: [] },
  { id: 'p4', xp: 8, label: '+1 Mouvement', effects: [{ stat: 'movement', value: 1 }] },
  { id: 'p5', xp: 11, label: '+1 ATK', effects: [{ stat: 'attackBonus', value: 1 }] },
  { id: 'p6', xp: 14, label: '+1 CA', effects: [{ stat: 'ac', value: 1 }] },
]

function applyStatEffects(char, effects) {
  const patched = { ...char }
  for (const e of effects) {
    if (e.stat === 'maxHp') { patched.maxHp += e.value; patched.hp += e.value }
    else if (e.stat === 'fullHeal') { patched.hp = patched.maxHp }
    else { patched[e.stat] = (patched[e.stat] || 0) + e.value }
  }
  return patched
}

const EVOLUTIONS = {
  guerrier: { name: 'Chevalier', patches: { 'attaque-puissante': { cooldown: 1 } } },
  mage: { name: 'Archimage', patches: { 'sort-mineur': { damage: '1d8+3' } } },
  voleur: { name: 'Assassin', patches: { 'coup-fatal': { executeThreshold: 0.30 } } },
  rodeur: { name: 'Traqueur', patches: { 'tir-precis': { range: 6 } } },
  clerc: { name: 'Haut-Clerc', patches: { 'soin-divin': { cooldown: 3 } } }
}

function evolveCharacter(char) {
  const evo = EVOLUTIONS[char.classId]
  if (!evo) return char
  const newClassData = JSON.parse(JSON.stringify(char.classData))
  newClassData.name = evo.name
  for (const [abilityId, patches] of Object.entries(evo.patches)) {
    for (const cat of ['actions', 'bonusActions', 'reactions']) {
      const ab = newClassData.abilities[cat]?.find(a => a.id === abilityId)
      if (ab) Object.assign(ab, patches)
    }
  }
  return { ...char, classData: newClassData, evolved: true }
}

export function applyNewPaliers(characters, xp, appliedPaliers) {
  let updated = { ...characters }
  const newApplied = [...appliedPaliers]
  let didEvolve = false

  for (const palier of XP_PALIERS) {
    if (xp >= palier.xp && !appliedPaliers.includes(palier.id)) {
      newApplied.push(palier.id)
      if (palier.isEvolution) {
        for (const [id, char] of Object.entries(updated)) {
          if (char.team === 'ally') updated[id] = evolveCharacter(char)
        }
        didEvolve = true
      } else {
        for (const [id, char] of Object.entries(updated)) {
          if (char.team === 'ally') updated[id] = applyStatEffects(char, palier.effects)
        }
      }
    }
  }
  return { characters: updated, appliedPaliers: newApplied, didEvolve }
}

// ============ RELICS ============

export const MINOR_RELICS = [
  { id: 'blood-pendant', name: 'Pendentif sanglant', icon: '🗡️', desc: '+3 PV max', effects: [{ stat: 'maxHp', value: 3 }] },
  { id: 'iron-ring', name: 'Anneau de fer', icon: '🛡️', desc: '+1 CA', effects: [{ stat: 'ac', value: 1 }] },
  { id: 'swift-boots', name: 'Bottes rapides', icon: '🏃', desc: '+1 mouvement', effects: [{ stat: 'movement', value: 1 }] },
  { id: 'rage-stone', name: 'Pierre de rage', icon: '💢', desc: '+1 ATK', effects: [{ stat: 'attackBonus', value: 1 }] },
  { id: 'vitality-gem', name: 'Gemme de vitalité', icon: '❤️', desc: '+5 PV max', effects: [{ stat: 'maxHp', value: 5 }] },
  { id: 'sharp-eye', name: 'Œil de faucon', icon: '🎯', desc: '+1 ATK', effects: [{ stat: 'attackBonus', value: 1 }] },
]

export const MAJOR_RELICS = [
  { id: 'destiny-blade', name: 'Lame du destin', icon: '🔥', desc: '+2 ATK, +1 CA', effects: [{ stat: 'attackBonus', value: 2 }, { stat: 'ac', value: 1 }] },
  { id: 'phoenix-heart', name: 'Cœur du phénix', icon: '❤️', desc: '+8 PV max + soin complet', effects: [{ stat: 'maxHp', value: 8 }, { stat: 'fullHeal' }] },
  { id: 'kings-crown', name: 'Couronne du roi', icon: '👑', desc: '+1 ATK, +1 CA, +1 mouvement', effects: [{ stat: 'attackBonus', value: 1 }, { stat: 'ac', value: 1 }, { stat: 'movement', value: 1 }] },
  { id: 'war-banner', name: 'Bannière de guerre', icon: '⚔️', desc: '+3 ATK', effects: [{ stat: 'attackBonus', value: 3 }] },
  { id: 'fortress-shield', name: 'Bouclier-forteresse', icon: '🏰', desc: '+3 CA', effects: [{ stat: 'ac', value: 3 }] },
]

export function pickRelics(pool, count) {
  return shuffle([...pool]).slice(0, count)
}

export function applyRelicEffects(characters, relic) {
  const updated = { ...characters }
  for (const [id, char] of Object.entries(updated)) {
    if (char.team === 'ally') updated[id] = applyStatEffects(char, relic.effects)
  }
  return updated
}
