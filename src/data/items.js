export const COMBAT_ITEMS = [
  {
    id: 'potion-soin-combat',
    name: 'Potion de soin',
    emoji: '🧪',
    description: 'Soigne 2d4+2 PV.',
    actionType: 'bonus',
    targetType: 'self',
    effect: 'heal',
    healDice: '2d4+2'
  },
  {
    id: 'potion-resistance',
    name: 'Potion de résistance',
    emoji: '🛡️',
    description: '+2 CA pendant 3 tours.',
    actionType: 'bonus',
    targetType: 'self',
    effect: 'acBoost',
    acBonus: 2,
    duration: 3
  },
  {
    id: 'antidote',
    name: 'Antidote',
    emoji: '💊',
    description: 'Retire poison et malédictions.',
    actionType: 'bonus',
    targetType: 'self',
    effect: 'purify'
  },
  {
    id: 'huile',
    name: 'Bouteille d\'huile',
    emoji: '🛢️',
    description: 'Lance une fiole d\'huile (portée 3). Crée une zone huile 2x2. Inflammable !',
    actionType: 'action',
    targetType: 'cell',
    range: 3,
    effect: 'createTerrain',
    terrainType: 'oil',
    terrainEmoji: '🟤',
    terrainLabel: 'Huile',
    aoeSize: 2,
    duration: 4
  },
  {
    id: 'torche',
    name: 'Torche',
    emoji: '🔥',
    description: 'Enflamme une case adjacente. Enflamme l\'huile en zone de feu !',
    actionType: 'bonus',
    targetType: 'cell',
    range: 2,
    effect: 'ignite',
    fireDamage: 6,
    fireDuration: 3
  },
  {
    id: 'bombe-fumigene',
    name: 'Bombe fumigène',
    emoji: '💨',
    description: 'Crée un nuage de fumée 2x2 (bloque la vue, 2 tours). Portée 3.',
    actionType: 'action',
    targetType: 'cell',
    range: 3,
    effect: 'createTerrain',
    terrainType: 'smoke',
    terrainEmoji: '🌫️',
    terrainLabel: 'Fumée',
    aoeSize: 2,
    duration: 2
  }
]

export const UNIVERSAL_ACTIONS = [
  {
    id: 'universal-dodge',
    name: 'Dodge',
    description: 'Désavantage sur toutes les attaques reçues jusqu\'au prochain tour.',
    cooldown: 0,
    maxUses: 0,
    targetType: 'self',
    effect: 'dodge',
    isUniversal: true
  },
  {
    id: 'universal-disengage',
    name: 'Désengagement',
    description: 'Quitter la mêlée sans provoquer d\'attaque d\'opportunité.',
    cooldown: 0,
    maxUses: 0,
    targetType: 'self',
    effect: 'disengage',
    isUniversal: true
  }
]
