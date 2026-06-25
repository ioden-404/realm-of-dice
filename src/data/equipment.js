export const TIER_COLORS = {
  common: '#9e9e9e',
  rare: '#42a5f5',
  epic: '#ffc107'
}

export const WEAPONS = [
  // === COMMUNS ===
  { id: 'epee-rouillee', name: 'Épée rouillée', icon: '🗡️', desc: '+1 ATK', slot: 'weapon', tier: 'common', classRestriction: ['guerrier'], effects: [{ stat: 'attackBonus', value: 1 }], specialEffect: null, cost: 8 },
  { id: 'epee-longue', name: 'Épée longue', icon: '⚔️', desc: '+1 ATK', slot: 'weapon', tier: 'common', classRestriction: ['guerrier'], effects: [{ stat: 'attackBonus', value: 1 }], specialEffect: null, cost: 10 },
  { id: 'dague-ebrechee', name: 'Dague ébréchée', icon: '🔪', desc: '+1 ATK', slot: 'weapon', tier: 'common', classRestriction: ['voleur'], effects: [{ stat: 'attackBonus', value: 1 }], specialEffect: null, cost: 8 },
  { id: 'dague-fine', name: 'Dague fine', icon: '🗡️', desc: '+1 ATK', slot: 'weapon', tier: 'common', classRestriction: ['voleur'], effects: [{ stat: 'attackBonus', value: 1 }], specialEffect: null, cost: 10 },
  { id: 'baton-bois', name: 'Bâton de bois', icon: '🪄', desc: '+1 ATK, +1 portée', slot: 'weapon', tier: 'common', classRestriction: ['mage'], effects: [{ stat: 'attackBonus', value: 1 }], specialEffect: { type: 'bonusRange', value: 1 }, cost: 8 },
  { id: 'baguette-arcanique', name: 'Baguette arcanique', icon: '✨', desc: '+1 ATK', slot: 'weapon', tier: 'common', classRestriction: ['mage'], effects: [{ stat: 'attackBonus', value: 1 }], specialEffect: null, cost: 10 },
  { id: 'arc-court', name: 'Arc court', icon: '🏹', desc: '+1 ATK', slot: 'weapon', tier: 'common', classRestriction: ['rodeur'], effects: [{ stat: 'attackBonus', value: 1 }], specialEffect: null, cost: 8 },
  { id: 'arc-chasse', name: 'Arc de chasse', icon: '🏹', desc: '+1 ATK', slot: 'weapon', tier: 'common', classRestriction: ['rodeur'], effects: [{ stat: 'attackBonus', value: 1 }], specialEffect: null, cost: 10 },
  { id: 'masse-simple', name: 'Masse simple', icon: '🔨', desc: '+1 ATK', slot: 'weapon', tier: 'common', classRestriction: ['clerc'], effects: [{ stat: 'attackBonus', value: 1 }], specialEffect: null, cost: 8 },
  { id: 'sceptre-priere', name: 'Sceptre de prière', icon: '🪬', desc: '+1 ATK, +1 soin', slot: 'weapon', tier: 'common', classRestriction: ['clerc'], effects: [{ stat: 'attackBonus', value: 1 }], specialEffect: { type: 'bonusHealing', value: 1 }, cost: 10 },

  // === RARES ===
  { id: 'hache-guerre', name: 'Hache de guerre', icon: '🪓', desc: '+2 ATK', slot: 'weapon', tier: 'rare', classRestriction: ['guerrier'], effects: [{ stat: 'attackBonus', value: 2 }], specialEffect: null, cost: 18 },
  { id: 'lame-capitaine', name: 'Lame du capitaine', icon: '⚔️', desc: '+2 ATK, +1 CA', slot: 'weapon', tier: 'rare', classRestriction: ['guerrier'], effects: [{ stat: 'attackBonus', value: 2 }, { stat: 'ac', value: 1 }], specialEffect: null, cost: 20 },
  { id: 'lame-empoisonnee', name: 'Lame empoisonnée', icon: '🗡️', desc: '+2 ATK, poison 2 tours', slot: 'weapon', tier: 'rare', classRestriction: ['voleur'], effects: [{ stat: 'attackBonus', value: 2 }], specialEffect: { type: 'poisonOnHit', duration: 2, damage: 3 }, cost: 18 },
  { id: 'rapiere-precision', name: 'Rapière de précision', icon: '🤺', desc: '+1 ATK, crit sur 19-20', slot: 'weapon', tier: 'rare', classRestriction: ['voleur'], effects: [{ stat: 'attackBonus', value: 1 }], specialEffect: { type: 'critRange19' }, cost: 15 },
  { id: 'baton-runique', name: 'Bâton runique', icon: '🪄', desc: '+2 ATK', slot: 'weapon', tier: 'rare', classRestriction: ['mage'], effects: [{ stat: 'attackBonus', value: 2 }], specialEffect: null, cost: 18 },
  { id: 'orbe-feu', name: 'Orbe de feu', icon: '🔮', desc: '+2 ATK, +2 dégâts magiques', slot: 'weapon', tier: 'rare', classRestriction: ['mage'], effects: [{ stat: 'attackBonus', value: 2 }], specialEffect: { type: 'bonusMagicDamage', value: 2 }, cost: 20 },
  { id: 'arc-long-composite', name: 'Arc long composite', icon: '🏹', desc: '+2 ATK, +1 portée', slot: 'weapon', tier: 'rare', classRestriction: ['rodeur'], effects: [{ stat: 'attackBonus', value: 2 }], specialEffect: { type: 'bonusRange', value: 1 }, cost: 19 },
  { id: 'arc-vent', name: 'Arc du vent', icon: '💨', desc: '+1 ATK, double tir 1x/combat', slot: 'weapon', tier: 'rare', classRestriction: ['rodeur'], effects: [{ stat: 'attackBonus', value: 1 }], specialEffect: { type: 'doubleShotOnce' }, cost: 16 },
  { id: 'fleau-beni', name: 'Fléau béni', icon: '⚜️', desc: '+2 ATK, +2 vs morts-vivants', slot: 'weapon', tier: 'rare', classRestriction: ['clerc'], effects: [{ stat: 'attackBonus', value: 2 }], specialEffect: { type: 'bonusVsUndead', value: 2 }, cost: 18 },
  { id: 'marteau-sacre', name: 'Marteau sacré', icon: '🔨', desc: '+1 ATK, +2 soins', slot: 'weapon', tier: 'rare', classRestriction: ['clerc'], effects: [{ stat: 'attackBonus', value: 1 }], specialEffect: { type: 'bonusHealing', value: 2 }, cost: 16 },

  // === ÉPIQUES ===
  { id: 'marteau-titan', name: 'Marteau du titan', icon: '⚡', desc: '+3 ATK, repousse 1 case', slot: 'weapon', tier: 'epic', classRestriction: ['guerrier'], effects: [{ stat: 'attackBonus', value: 3 }], specialEffect: { type: 'pushOnHit', distance: 1 }, cost: 0 },
  { id: 'dague-ombre', name: "Dague d'ombre", icon: '🌑', desc: '+2 ATK, +1d6 si avantage', slot: 'weapon', tier: 'epic', classRestriction: ['voleur'], effects: [{ stat: 'attackBonus', value: 2 }], specialEffect: { type: 'bonusSneakDice', dice: '1d6' }, cost: 0 },
  { id: 'baton-archimage', name: "Bâton de l'archimage", icon: '🌟', desc: '+3 ATK, +2 portée', slot: 'weapon', tier: 'epic', classRestriction: ['mage'], effects: [{ stat: 'attackBonus', value: 3 }], specialEffect: { type: 'bonusRange', value: 2 }, cost: 0 },
  { id: 'arc-faucon', name: 'Arc du faucon', icon: '🦅', desc: '+3 ATK, ignore couverture', slot: 'weapon', tier: 'epic', classRestriction: ['rodeur'], effects: [{ stat: 'attackBonus', value: 3 }], specialEffect: { type: 'ignoreCover' }, cost: 0 },
  { id: 'relique-divine', name: 'Relique divine', icon: '☀️', desc: '+2 ATK, soins +50%', slot: 'weapon', tier: 'epic', classRestriction: ['clerc'], effects: [{ stat: 'attackBonus', value: 2 }], specialEffect: { type: 'bonusHealingPercent', value: 50 }, cost: 0 },
]

export const ARMORS = [
  // === COMMUNS ===
  { id: 'cuir-leger', name: 'Cuir léger', icon: '🧥', desc: '+1 CA', slot: 'armor', tier: 'common', classRestriction: null, effects: [{ stat: 'ac', value: 1 }], specialEffect: null, cost: 8 },
  { id: 'veste-rembourree', name: 'Veste rembourrée', icon: '🧥', desc: '+1 CA', slot: 'armor', tier: 'common', classRestriction: null, effects: [{ stat: 'ac', value: 1 }], specialEffect: null, cost: 7 },
  { id: 'cotte-mailles', name: 'Cotte de mailles', icon: '🛡️', desc: '+1 CA', slot: 'armor', tier: 'common', classRestriction: ['guerrier', 'clerc'], effects: [{ stat: 'ac', value: 1 }], specialEffect: null, cost: 10 },
  { id: 'tunique-renforcee', name: 'Tunique renforcée', icon: '👘', desc: '+1 CA, +2 PV', slot: 'armor', tier: 'common', classRestriction: ['voleur', 'rodeur'], effects: [{ stat: 'ac', value: 1 }, { stat: 'maxHp', value: 2 }], specialEffect: null, cost: 9 },
  { id: 'robe-mage', name: 'Robe de mage', icon: '🧙', desc: '+1 CA', slot: 'armor', tier: 'common', classRestriction: ['mage'], effects: [{ stat: 'ac', value: 1 }], specialEffect: null, cost: 9 },

  // === RARES ===
  { id: 'plastron-acier', name: "Plastron d'acier", icon: '🛡️', desc: '+2 CA', slot: 'armor', tier: 'rare', classRestriction: ['guerrier'], effects: [{ stat: 'ac', value: 2 }], specialEffect: null, cost: 18 },
  { id: 'armure-ecailles', name: "Armure d'écailles", icon: '🐉', desc: '+2 CA', slot: 'armor', tier: 'rare', classRestriction: ['guerrier', 'clerc'], effects: [{ stat: 'ac', value: 2 }], specialEffect: null, cost: 20 },
  { id: 'robe-runique', name: 'Robe runique', icon: '🔮', desc: '+1 CA, +1 portée sorts', slot: 'armor', tier: 'rare', classRestriction: ['mage'], effects: [{ stat: 'ac', value: 1 }], specialEffect: { type: 'bonusRange', value: 1 }, cost: 15 },
  { id: 'haubert-elfique', name: 'Haubert elfique', icon: '🧝', desc: '+2 CA', slot: 'armor', tier: 'rare', classRestriction: ['rodeur', 'voleur'], effects: [{ stat: 'ac', value: 2 }], specialEffect: null, cost: 18 },
  { id: 'cape-enchantee', name: 'Cape enchantée', icon: '🧣', desc: '+1 CA, résistance poison', slot: 'armor', tier: 'rare', classRestriction: null, effects: [{ stat: 'ac', value: 1 }], specialEffect: { type: 'poisonResistance' }, cost: 14 },

  // === ÉPIQUES ===
  { id: 'armure-gardien', name: 'Armure du gardien', icon: '🏰', desc: '+3 CA, -1 dégât reçu', slot: 'armor', tier: 'epic', classRestriction: ['guerrier', 'clerc'], effects: [{ stat: 'ac', value: 3 }], specialEffect: { type: 'damageReduction', value: 1 }, cost: 0 },
  { id: 'cape-brume', name: 'Cape de brume', icon: '🌫️', desc: '+2 CA, esquive 1x/combat', slot: 'armor', tier: 'epic', classRestriction: ['mage', 'voleur', 'rodeur'], effects: [{ stat: 'ac', value: 2 }], specialEffect: { type: 'freeDodgeOnce' }, cost: 0 },
]

export const BOOTS = [
  // === COMMUNS ===
  { id: 'sandales', name: 'Sandales', icon: '🩴', desc: '+1 mouvement', slot: 'boots', tier: 'common', classRestriction: null, effects: [{ stat: 'movement', value: 1 }], specialEffect: null, cost: 8 },
  { id: 'bottes-cuir', name: 'Bottes de cuir', icon: '👢', desc: '+1 mouvement', slot: 'boots', tier: 'common', classRestriction: null, effects: [{ stat: 'movement', value: 1 }], specialEffect: null, cost: 10 },
  { id: 'chaussures-marche', name: 'Chaussures de marche', icon: '👟', desc: '+1 mouvement', slot: 'boots', tier: 'common', classRestriction: null, effects: [{ stat: 'movement', value: 1 }], specialEffect: null, cost: 7 },
  { id: 'bottes-cloutees', name: 'Bottes cloutées', icon: '🥾', desc: '+1 mouvement, +1 dégât AO', slot: 'boots', tier: 'common', classRestriction: ['guerrier', 'clerc'], effects: [{ stat: 'movement', value: 1 }], specialEffect: { type: 'bonusAODamage', value: 1 }, cost: 10 },
  { id: 'mocassins-feutres', name: 'Mocassins feutrés', icon: '👞', desc: '+1 mouvement', slot: 'boots', tier: 'common', classRestriction: ['voleur', 'rodeur'], effects: [{ stat: 'movement', value: 1 }], specialEffect: null, cost: 9 },

  // === RARES ===
  { id: 'bottes-vent', name: 'Bottes de vent', icon: '💨', desc: '+1 mouvement, désengagement 1x', slot: 'boots', tier: 'rare', classRestriction: null, effects: [{ stat: 'movement', value: 1 }], specialEffect: { type: 'freeDisengageOnce' }, cost: 16 },
  { id: 'bottes-elfiques', name: 'Bottes elfiques', icon: '🧝', desc: '+2 mouvement', slot: 'boots', tier: 'rare', classRestriction: ['rodeur', 'voleur'], effects: [{ stat: 'movement', value: 2 }], specialEffect: null, cost: 20 },
  { id: 'jambieres-fer', name: 'Jambières de fer', icon: '🦿', desc: '+1 mouvement, +1 CA', slot: 'boots', tier: 'rare', classRestriction: ['guerrier', 'clerc'], effects: [{ stat: 'movement', value: 1 }, { stat: 'ac', value: 1 }], specialEffect: null, cost: 15 },
  { id: 'bottes-furtives', name: 'Bottes furtives', icon: '🥷', desc: '+1 mouvement, avantage 1er tour', slot: 'boots', tier: 'rare', classRestriction: ['voleur'], effects: [{ stat: 'movement', value: 1 }], specialEffect: { type: 'advantageFirstTurn' }, cost: 16 },
  { id: 'bottes-ranger', name: 'Bottes du ranger', icon: '🌿', desc: '+1 mouvement, ignore terrain difficile', slot: 'boots', tier: 'rare', classRestriction: ['rodeur'], effects: [{ stat: 'movement', value: 1 }], specialEffect: { type: 'ignoreDifficultTerrain' }, cost: 17 },

  // === ÉPIQUES ===
  { id: 'bottes-foudre', name: 'Bottes de foudre', icon: '⚡', desc: '+2 mouvement, pas d\'AO subie', slot: 'boots', tier: 'epic', classRestriction: null, effects: [{ stat: 'movement', value: 2 }], specialEffect: { type: 'noAOReceived' }, cost: 0 },
  { id: 'bottes-traqueur', name: 'Bottes du traqueur', icon: '🎯', desc: '+1 mouvement, +2 portée', slot: 'boots', tier: 'epic', classRestriction: ['rodeur', 'voleur'], effects: [{ stat: 'movement', value: 1 }, { stat: 'range', value: 2 }], specialEffect: null, cost: 0 },
]

export const ALL_EQUIPMENT = [...WEAPONS, ...ARMORS, ...BOOTS]

export function canEquip(item, classId) {
  if (!item.classRestriction) return true
  return item.classRestriction.includes(classId)
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function generateShopEquipment(act, ownedIds = [], teamClasses = []) {
  const notOwned = ALL_EQUIPMENT.filter(i => i.tier !== 'epic' && !ownedIds.includes(i.id))
  const usable = notOwned.filter(i => !i.classRestriction || i.classRestriction.some(c => teamClasses.includes(c)))

  const commons = usable.filter(i => i.tier === 'common')
  const rares = act > 0 ? usable.filter(i => i.tier === 'rare') : []

  const picked = []
  const shuffledCommons = shuffle(commons)
  picked.push(...shuffledCommons.slice(0, 2))

  if (rares.length > 0) {
    picked.push(...shuffle(rares).slice(0, 1))
  } else if (shuffledCommons.length > 2) {
    picked.push(shuffledCommons[2])
  }

  return picked
}

export function generateTreasureEquipment(act, ownedIds = [], teamClasses = []) {
  const canUse = ALL_EQUIPMENT.filter(i =>
    !ownedIds.includes(i.id) &&
    (act >= 2 || i.tier !== 'epic') &&
    (!i.classRestriction || i.classRestriction.some(c => teamClasses.includes(c)))
  )
  if (canUse.length === 0) return null
  const weighted = canUse.filter(i => i.tier === 'epic').length > 0 && Math.random() < 0.2
    ? canUse.filter(i => i.tier === 'epic')
    : canUse.filter(i => i.tier !== 'epic')
  return shuffle(weighted.length > 0 ? weighted : canUse)[0] || null
}

export function getEquipmentForSlot(slot, classId, inventory) {
  return inventory.filter(i => i.slot === slot && canEquip(i, classId))
}
