export const RUN_MODIFIERS = [
  {
    id: 'tough-enemies',
    name: 'Ennemis endurcis',
    icon: '💪',
    desc: 'Ennemis +20% PV max',
    reward: '+50% or gagné',
    apply: { enemyHpMult: 1.2, goldMult: 1.5 }
  },
  {
    id: 'no-rest',
    name: 'Marche forcée',
    icon: '🚫',
    desc: 'Les nœuds repos soignent 50% de moins',
    reward: '+1 relique mineure par élite',
    apply: { restHealMult: 0.5, extraRelics: true }
  },
  {
    id: 'glass-cannon',
    name: 'Canon de verre',
    icon: '💥',
    desc: 'Équipe -15% PV max, +1 ATK',
    reward: 'Dégâts augmentés',
    apply: { allyHpMult: 0.85, allyAtkBonus: 1 }
  },
  {
    id: 'fog-of-war',
    name: 'Brouillard de guerre',
    icon: '🌫️',
    desc: 'Les nœuds non-adjacents sont cachés',
    reward: '+30% XP gagné',
    apply: { fogOfWar: true, xpMult: 1.3 }
  },
  {
    id: 'elite-surge',
    name: 'Assaut d\'élite',
    icon: '💀',
    desc: 'Les combats normaux ont +1 ennemi',
    reward: 'Double or sur les combats',
    apply: { extraEnemy: true, combatGoldMult: 2 }
  },
  {
    id: 'cursed-gold',
    name: 'Or maudit',
    icon: '☠️',
    desc: 'Prix du marchand doublés',
    reward: 'Trésors donnent +50% or',
    apply: { shopCostMult: 2, treasureGoldMult: 1.5 }
  }
]

export const NARRATIVE_EVENTS = [
  {
    id: 'ancient-altar',
    title: '⛩️ Autel ancien',
    text: 'Vous découvrez un autel couvert de runes. Une énergie puissante en émane.',
    choices: [
      { label: 'Sacrifier 8 PV → +1 ATK (1 allié)', effect: 'sacrifice', hpCost: 8, stat: 'attackBonus', value: 1 },
      { label: 'Prier → Soigne 30% équipe', effect: 'teamHeal', value: 0.3 },
      { label: 'Ignorer', effect: 'none' }
    ]
  },
  {
    id: 'wounded-traveler',
    title: '🧳 Voyageur blessé',
    text: 'Un marchand blessé gît sur le chemin. Il semble avoir des objets de valeur.',
    choices: [
      { label: 'L\'aider → +15 or, +1 potion gratuite', effect: 'helpTraveler', gold: 15 },
      { label: 'Le fouiller → +25 or, mais -5 PV équipe', effect: 'robTraveler', gold: 25, hpCost: 5 },
      { label: 'Passer son chemin', effect: 'none' }
    ]
  },
  {
    id: 'trapped-chest',
    title: '📦 Coffre piégé',
    text: 'Un coffre vermoulu brille faiblement. Il pourrait être piégé...',
    choices: [
      { label: 'Tenter (60% réussite → +30 or, 40% → -10 PV)', effect: 'gamble', successRate: 0.6, goldWin: 30, hpLoss: 10 },
      { label: 'Forcer (sûr → +10 or)', effect: 'safeGold', gold: 10 },
      { label: 'Laisser le coffre', effect: 'none' }
    ]
  },
  {
    id: 'dark-fountain',
    title: '⛲ Fontaine obscure',
    text: 'Une fontaine d\'eau noire bouillonne. L\'eau dégage une aura de pouvoir.',
    choices: [
      { label: 'Boire → +1 CA (1 allié), mais empoisonné 2 combats', effect: 'fountain', stat: 'ac', value: 1, poisonDuration: 2 },
      { label: 'Remplir des fioles → +2 potions de soin', effect: 'fillPotions', potions: 2 },
      { label: 'S\'éloigner', effect: 'none' }
    ]
  },
  {
    id: 'wandering-smith',
    title: '⚒️ Forgeron errant',
    text: 'Un vieux forgeron propose d\'améliorer une arme... contre un prix.',
    choices: [
      { label: 'Payer 20 or → +1 ATK (1 allié)', effect: 'buyUpgrade', cost: 20, stat: 'attackBonus', value: 1 },
      { label: 'Marchander (50% → gratuit, 50% → -30 or)', effect: 'haggle', cost: 30, stat: 'attackBonus', value: 1 },
      { label: 'Décliner poliment', effect: 'none' }
    ]
  },
  {
    id: 'mushroom-grove',
    title: '🍄 Clairière aux champignons',
    text: 'Des champignons luminescents poussent en cercle. Certains semblent comestibles...',
    choices: [
      { label: 'Manger les rouges → +3 PV max (équipe), mais -5 PV', effect: 'redShroom', hpMaxBonus: 3, hpCost: 5 },
      { label: 'Manger les bleus → Soigne 50% équipe', effect: 'teamHeal', value: 0.5 },
      { label: 'Ne rien toucher', effect: 'none' }
    ]
  }
]

export const GLORY_UPGRADES = [
  { id: 'base-hp', name: 'Vitalité', icon: '❤️', desc: '+2 PV max de base', cost: 3, maxLevel: 5, effect: { stat: 'maxHp', value: 2 } },
  { id: 'base-gold', name: 'Bourse garnie', icon: '💰', desc: 'Commencer avec +10 or', cost: 2, maxLevel: 3, effect: { stat: 'startGold', value: 10 } },
  { id: 'potion-slot', name: 'Sacoche', icon: '🎒', desc: '+1 potion d\'urgence par combat (sans clerc)', cost: 5, maxLevel: 2, effect: { stat: 'extraPotions', value: 1 } },
  { id: 'rest-bonus', name: 'Récupération', icon: '⛺', desc: '+5% soins au repos', cost: 3, maxLevel: 4, effect: { stat: 'restBonus', value: 0.05 } },
  { id: 'merchant-discount', name: 'Marchandage', icon: '🛒', desc: '-10% prix au marchand', cost: 4, maxLevel: 3, effect: { stat: 'shopDiscount', value: 0.1 } },
  { id: 'xp-boost', name: 'Expérience', icon: '⭐', desc: '+1 XP par combat d\'élite', cost: 4, maxLevel: 2, effect: { stat: 'eliteXpBonus', value: 1 } },
]

const GLORY_STORAGE_KEY = 'rod-glory'

export function loadGlory() {
  try {
    const saved = localStorage.getItem(GLORY_STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return { points: 0, totalRuns: 0, victories: 0, upgrades: {} }
}

export function saveGlory(glory) {
  try {
    localStorage.setItem(GLORY_STORAGE_KEY, JSON.stringify(glory))
  } catch {}
}

export function getGloryBonus(glory, statName) {
  let total = 0
  for (const upgrade of GLORY_UPGRADES) {
    const level = glory.upgrades[upgrade.id] || 0
    if (level > 0 && upgrade.effect.stat === statName) {
      total += upgrade.effect.value * level
    }
  }
  return total
}

export function calculateGloryReward(won, actsCompleted, modifiersCount) {
  let points = 1
  if (won) points += 2
  points += actsCompleted
  points += modifiersCount
  return points
}
