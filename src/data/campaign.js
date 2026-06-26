import { LEVEL_UP_TREES } from './levelUpTrees.js'

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
        { name: 'Horde d\'os', monsters: ['skeleton', 'skeleton', 'skeleton', 'goblin'], objective: { type: 'killLeader', leaderIndex: 0, desc: '🎯 Tuez le chef squelette !' } },
        { name: 'Meute alpha', monsters: ['wolf', 'wolf', 'wolf'], objective: { type: 'survive', turns: 5, desc: '⏳ Survivez 5 tours !' } }
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
        { name: 'Le nécromancien', monsters: ['necromancer', 'zombie', 'zombie', 'zombie'], objective: { type: 'killLeader', leaderIndex: 0, desc: '🎯 Tuez le nécromancien !' } },
        { name: 'Spectres vengeurs', monsters: ['specter', 'specter', 'specter'], objective: { type: 'protect', crystalHp: 25, desc: '🛡️ Protégez le cristal !' } }
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
        { name: 'Garde royale', monsters: ['deathKnight', 'deathKnight', 'darkMage'], objective: { type: 'stopReinforcements', spawnRounds: [3, 5], spawnMonster: 'orcBerserker', desc: '⚔️ Éliminez-les avant les renforts !' } },
        { name: 'Berserkers', monsters: ['orcBerserker', 'orcBerserker', 'orcBerserker'], objective: { type: 'survive', turns: 6, desc: '⏳ Survivez 6 tours !' } }
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
  ['combat', 'combat', 'combat'],
  ['combat', 'rest', 'merchant'],
  ['elite', 'combat', 'treasure'],
  ['combat', 'merchant', 'combat'],
  ['rest', 'combat', 'elite'],
  ['combat', 'treasure', 'combat'],
  ['elite', 'rest', 'combat'],
  ['combat', 'combat', 'treasure'],
  ['combat', 'rest'],
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

// ============ GOLD & SHOP ============

export const GOLD_REWARDS = { combat: 12, elite: 22, treasure: 18, boss: 35 }

export const SHOP_ITEMS = [
  { id: 'potion-soin-combat', name: 'Potion de soin', desc: 'Soigne 2d4+2 PV en combat', icon: '🧪', cost: 6, actionType: 'bonus', targetType: 'self', effect: 'heal', healDice: '2d4+2' },
  { id: 'potion-resistance', name: 'Potion de résistance', desc: '+2 CA pendant 3 tours', icon: '🛡️', cost: 10, actionType: 'bonus', targetType: 'self', effect: 'acBoost', acBonus: 2, duration: 3 },
  { id: 'antidote', name: 'Antidote', desc: 'Retire poison et malédictions', icon: '💊', cost: 5, actionType: 'bonus', targetType: 'self', effect: 'purify' },
  { id: 'huile', name: 'Bouteille d\'huile', desc: 'Crée zone huile 2x2, inflammable !', icon: '🛢️', cost: 8, actionType: 'action', targetType: 'cell', range: 3, effect: 'createTerrain', terrainType: 'oil', terrainEmoji: '🟤', terrainLabel: 'Huile', aoeSize: 2, duration: 4 },
  { id: 'torche', name: 'Torche', desc: 'Enflamme une zone (feu 6 dégâts/tour)', icon: '🔥', cost: 5, actionType: 'bonus', targetType: 'cell', range: 2, effect: 'ignite', fireDamage: 6, fireDuration: 3 },
  { id: 'bombe-fumigene', name: 'Bombe fumigène', desc: 'Fumée 2x2, désavantage, 2 tours', icon: '💨', cost: 10, actionType: 'action', targetType: 'cell', range: 3, effect: 'createTerrain', terrainType: 'smoke', terrainEmoji: '🌫️', terrainLabel: 'Fumée', aoeSize: 2, duration: 2 },
  { id: 'herbes-soin', name: 'Herbes médicinales', desc: 'Soigne 30% PV de l\'équipe (hors combat)', icon: '🌿', cost: 6, effect: 'teamHeal', value: 0.3, outOfCombat: true },
]

export function generateShopItems() {
  return shuffle([...SHOP_ITEMS]).slice(0, 4)
}

export function generateRewardChoices(count = 3) {
  return shuffle([...SHOP_ITEMS].filter(i => i.cost <= 12)).slice(0, count)
}

export function teamHasHealer(characters) {
  return Object.values(characters).some(c => c.team === 'ally' && !c.isDead && c.classId === 'clerc')
}

export const SURVIVAL_POTION = {
  id: 'survival-potion',
  name: 'Potion d\'urgence',
  emoji: '🧪',
  description: 'Instinct de survie — soigne 2d4+2 PV.',
  actionType: 'bonus',
  targetType: 'self',
  effect: 'heal',
  healDice: '2d4+2'
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

export function applyConsumable(characters, item) {
  const updated = { ...characters }
  const allies = Object.entries(updated).filter(([, c]) => c.team === 'ally')

  switch (item.effect) {
    case 'teamHeal':
      for (const [id, char] of allies) {
        const missing = char.maxHp - char.hp
        updated[id] = { ...char, hp: char.hp + Math.floor(missing * item.value) }
      }
      break
    case 'healAlly': {
      const hurt = allies.filter(([, c]) => c.hp < c.maxHp && !c.isDead).sort((a, b) => a[1].hp / a[1].maxHp - b[1].hp / b[1].maxHp)
      if (hurt.length > 0) {
        const [id, char] = hurt[0]
        const missing = char.maxHp - char.hp
        updated[id] = { ...char, hp: char.hp + Math.floor(missing * item.value) }
      }
      break
    }
    case 'fullHealAlly': {
      const hurt = allies.filter(([, c]) => c.hp < c.maxHp && !c.isDead).sort((a, b) => a[1].hp / a[1].maxHp - b[1].hp / b[1].maxHp)
      if (hurt.length > 0) {
        const [id, char] = hurt[0]
        updated[id] = { ...char, hp: char.maxHp }
      }
      break
    }
    case 'reviveAlly': {
      const dead = allies.find(([, c]) => c.isDead)
      if (dead) {
        const [id, char] = dead
        updated[id] = { ...char, isDead: false, hp: Math.floor(char.maxHp * item.value) }
      }
      break
    }
    case 'teamShield':
      for (const [id, char] of allies) {
        if (!char.isDead) {
          updated[id] = { ...char, statuses: [...char.statuses, { type: 'shield', absorption: item.value }] }
        }
      }
      break
    case 'teamRage':
      for (const [id, char] of allies) {
        if (!char.isDead) {
          updated[id] = { ...char, statuses: [...char.statuses, { type: 'rage', duration: item.value }] }
        }
      }
      break
  }
  return updated
}

// ============ XP SYSTEM ============

export const XP_PALIERS = [
  { id: 'p1', xp: 2, label: '+2 PV max', effects: [{ stat: 'maxHp', value: 2 }] },
  { id: 'p2', xp: 5, label: '+1 ATK', effects: [{ stat: 'attackBonus', value: 1 }] },
  { id: 'p3', xp: 8, label: '+1 CA', effects: [{ stat: 'ac', value: 1 }] },
  { id: 'evo', xp: 10, label: 'Évolution !', isEvolution: true, effects: [] },
  { id: 'p4', xp: 14, label: '+1 Mouvement', effects: [{ stat: 'movement', value: 1 }] },
  { id: 'p5', xp: 18, label: '+1 ATK', effects: [{ stat: 'attackBonus', value: 1 }] },
  { id: 'p6', xp: 22, label: '+1 CA', effects: [{ stat: 'ac', value: 1 }] },
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

const EVOLUTION_NAMES = {
  guerrier: 'Chevalier', mage: 'Archimage', voleur: 'Assassin', rodeur: 'Traqueur', clerc: 'Haut-Clerc'
}

function evolveCharacter(char) {
  const evoName = EVOLUTION_NAMES[char.classId]
  if (!evoName) return char
  const newClassData = JSON.parse(JSON.stringify(char.classData))
  newClassData.name = evoName

  const tree = LEVEL_UP_TREES[char.classId]
  if (tree?.evolution && char.chosenAbilities?.length > 0) {
    const firstChoice = char.chosenAbilities[0]
    const patches = tree.evolution[firstChoice]
    if (patches) {
      for (const cat of ['actions', 'bonusActions', 'reactions']) {
        const ab = newClassData.abilities[cat]?.find(a => a.id === firstChoice)
        if (ab) Object.assign(ab, patches)
      }
    }
  }

  return { ...char, classData: newClassData, evolved: true }
}

export function applyNewPaliers(characters, xp, appliedPaliers) {
  let updated = { ...characters }
  const newApplied = [...appliedPaliers]
  let didEvolve = false
  const pendingChoices = []

  for (const palier of XP_PALIERS) {
    if (xp >= palier.xp && !appliedPaliers.includes(palier.id)) {
      newApplied.push(palier.id)
      if (palier.isEvolution) {
        for (const [id, char] of Object.entries(updated)) {
          if (char.team === 'ally') updated[id] = evolveCharacter(char)
        }
        didEvolve = true
      } else if (palier.effects && palier.effects.length > 0) {
        pendingChoices.push(palier)
      }
    }
  }
  return { characters: updated, appliedPaliers: newApplied, didEvolve, pendingChoices }
}

export function applyPalierToCharacter(characters, palier, characterId) {
  const char = characters[characterId]
  if (!char || char.team !== 'ally') return characters
  return { ...characters, [characterId]: applyStatEffects(char, palier.effects) }
}

// ============ RELICS ============

export const MINOR_RELICS = [
  { id: 'heal-on-kill', name: 'Amulette vampirique', icon: '🧛', desc: 'Soigne 5 PV en tuant un ennemi', relicEffect: { type: 'healOnKill', value: 5 } },
  { id: 'auto-rage', name: 'Pierre de rage', icon: '💢', desc: 'Rage auto quand un allié tombe sous 25% PV', relicEffect: { type: 'autoRage', threshold: 0.25 } },
  { id: 'ao-range-bonus', name: 'Anneau du tacticien', icon: '💍', desc: '+1 portée attaques d\'opportunité', relicEffect: { type: 'aoRangeBonus', value: 1 } },
  { id: 'slow-adjacent', name: 'Pendentif de givre', icon: '❄️', desc: 'Ennemis adjacents ont -1 mouvement', relicEffect: { type: 'slowAdjacent', value: 1 } },
  { id: 'no-los-disadvantage', name: 'Oeil du faucon', icon: '🦅', desc: 'Plus de désavantage pour la ligne de vue', relicEffect: { type: 'noLOSDisadvantage' } },
  { id: 'bonus-first-heal', name: 'Cor de ralliement', icon: '📯', desc: 'Premier soin par combat +50%', relicEffect: { type: 'bonusFirstHeal', value: 1.5 } },
  { id: 'reroll', name: 'Talisman de chance', icon: '🍀', desc: 'Relance un jet raté 1x/combat', relicEffect: { type: 'reroll', uses: 1 } },
  { id: 'bonus-sneak', name: 'Croc du loup', icon: '🐺', desc: '+1d4 dégâts si allié adjacent à la cible', relicEffect: { type: 'bonusSneakDamage', dice: '1d4' } },
]

export const MAJOR_RELICS = [
  { id: 'phoenix-revive', name: 'Plume du phénix', icon: '🔥', desc: 'Revive un allié 1x/combat à 50% PV', relicEffect: { type: 'phoenixRevive', hpPercent: 0.5 } },
  { id: 'team-advantage-r1', name: 'Couronne du roi', icon: '👑', desc: 'Toute l\'équipe commence avec avantage au round 1', relicEffect: { type: 'teamAdvantageR1' } },
  { id: 'free-reaction', name: 'Cape du néant', icon: '🌑', desc: 'Réaction gratuite 1x/round', relicEffect: { type: 'freeReaction' } },
  { id: 'cancel-crit', name: 'Sceau de protection', icon: '🛡️', desc: 'Annule un crit ennemi 1x/combat', relicEffect: { type: 'cancelEnemyCrit', uses: 1 } },
  { id: 'x3-crit', name: 'Lame du destin', icon: '⚔️', desc: 'Critiques font x3 dégâts au lieu de x2', relicEffect: { type: 'x3CritDamage' } },
  { id: 'see-ai', name: 'Orbe de prédiction', icon: '🔮', desc: 'Voit les intentions de l\'IA', relicEffect: { type: 'seeAIActions' } },
]

export function pickRelics(pool, count, ownedRelics = []) {
  const available = pool.filter(r => !ownedRelics.some(o => o.id === r.id))
  return shuffle(available.length >= count ? available : [...pool]).slice(0, count)
}
