export const LEVEL_THRESHOLDS = [
  { level: 2, xp: 2 },
  { level: 3, xp: 8 },
  { level: 4, xp: 14 },
  { level: 5, xp: 22 }
]

export const LEVEL_UP_TREES = {
  guerrier: {
    baseKit: {
      actions: [
        { id: 'attaque', name: 'Attaque', damage: '1d10+3', range: 1, description: 'Attaque de mêlée standard.', cooldown: 0, maxUses: 0, targetType: 'enemy' }
      ],
      bonusActions: [
        { id: 'second-souffle', name: 'Second souffle', heal: '1d10+4', description: 'Se soigner soi-même.', cooldown: 0, maxUses: 1, targetType: 'self' }
      ],
      reactions: [
        { id: 'attaque-opportunite', name: 'Attaque d\'opportunité', damage: '1d10+3', range: 1, trigger: 'enemyLeaves' }
      ]
    },
    levels: {
      2: [
        { id: 'attaque-puissante', name: 'Attaque puissante', damage: '2d10+3', range: 1, description: 'Coup dévastateur en mêlée.', cooldown: 2, maxUses: 0, targetType: 'enemy', category: 'actions', path: 'Offense' },
        { id: 'posture-defensive', name: 'Posture défensive', description: '+2 CA jusqu\'au prochain tour.', cooldown: 2, maxUses: 0, targetType: 'self', effect: 'defensePosture', acBonus: 2, category: 'bonusActions', path: 'Défense' },
        { id: 'cri-de-guerre', name: 'Cri de guerre', description: 'Cible a désavantage sur ses attaques pendant 2 tours.', range: 3, cooldown: 3, maxUses: 0, targetType: 'enemy', effect: 'frighten', frightenDuration: 2, category: 'bonusActions', path: 'Contrôle' }
      ],
      3: [
        { id: 'enchainement', name: 'Enchaînement', damage: '1d10+3', range: 1, description: 'Frappe la cible et un ennemi adjacent.', cooldown: 3, maxUses: 0, targetType: 'enemy', effect: 'cleave', category: 'actions', path: 'Offense' },
        { id: 'interception', name: 'Interception', description: 'Prend le coup d\'un allié adjacent, dégâts réduits de moitié.', cooldown: 2, maxUses: 0, trigger: 'allyHit', range: 1, effect: 'intercept', category: 'reactions', path: 'Défense' },
        { id: 'provocation', name: 'Provocation', description: 'La cible doit vous attaquer (désavantage sinon) pendant 2 tours.', range: 3, cooldown: 4, maxUses: 0, targetType: 'enemy', effect: 'frighten', frightenDuration: 2, category: 'bonusActions', path: 'Contrôle' }
      ],
      4: [
        { id: 'frappe-tourbillonnante', name: 'Frappe tourbillonnante', damage: '1d10+3', range: 1, description: 'Frappe TOUS les ennemis adjacents.', cooldown: 4, maxUses: 0, targetType: 'self', effect: 'whirlwind', category: 'actions', path: 'Offense' },
        { id: 'mur-de-boucliers', name: 'Mur de boucliers', description: '+2 CA pour vous et alliés adjacents pendant 2 tours.', cooldown: 4, maxUses: 0, targetType: 'self', effect: 'shieldWall', acBonus: 2, duration: 3, category: 'bonusActions', path: 'Défense' },
        { id: 'balayage', name: 'Balayage', damage: '1d10+3', range: 1, description: 'Renverse la cible, étourdi 1 tour.', cooldown: 3, maxUses: 0, targetType: 'enemy', effect: 'stun', stunDuration: 1, category: 'actions', path: 'Contrôle' }
      ],
      5: [
        { id: 'sursaut-action', name: 'Sursaut d\'action', description: 'Récupère votre action. Agissez deux fois ce tour.', cooldown: 0, maxUses: 1, targetType: 'self', effect: 'actionSurge', category: 'bonusActions', path: 'Offense' },
        { id: 'determination', name: 'Détermination', description: 'Réduit dégâts de 50%. Si < 25% PV, soigne 1d10+5.', maxUses: 1, trigger: 'onDamage', category: 'reactions', path: 'Défense' },
        { id: 'seconde-attaque', name: 'Seconde attaque', damage: '1d10', range: 1, description: 'Une attaque supplémentaire.', cooldown: 0, maxUses: 1, targetType: 'enemy', category: 'bonusActions', path: 'Offense' }
      ]
    },
    evolution: {
      'attaque-puissante': { cooldown: 1, name: 'Attaque puissante+' },
      'posture-defensive': { acBonus: 3, name: 'Posture défensive+' },
      'cri-de-guerre': { frightenDuration: 3, name: 'Cri de guerre+' }
    }
  },

  mage: {
    baseKit: {
      actions: [
        { id: 'sort-mineur', name: 'Sort mineur', damage: '1d6+3', range: 6, description: 'Attaque magique à distance.', cooldown: 0, maxUses: 0, targetType: 'enemy', magical: true }
      ],
      bonusActions: [],
      reactions: []
    },
    levels: {
      2: [
        { id: 'boule-de-feu', name: 'Boule de feu', damage: '2d6+3', range: 6, description: 'Explosion de feu.', cooldown: 2, maxUses: 0, targetType: 'enemy', magical: true, category: 'actions', path: 'Offense' },
        { id: 'bouclier-magique', name: 'Bouclier magique', description: 'Absorbe 12 dégâts.', cooldown: 3, maxUses: 0, targetType: 'self', effect: 'shield', absorption: 12, category: 'bonusActions', path: 'Défense' },
        { id: 'rayon-givre', name: 'Rayon de givre', damage: '1d8+3', range: 5, description: 'Ralentit la cible 1 tour (stun).', cooldown: 2, maxUses: 0, targetType: 'enemy', magical: true, effect: 'stun', stunDuration: 1, category: 'actions', path: 'Contrôle' }
      ],
      3: [
        { id: 'eclair', name: 'Éclair', damage: '1d10+3', range: 6, description: 'Foudre qui étourdit 1 tour.', cooldown: 3, maxUses: 0, targetType: 'enemy', magical: true, effect: 'stun', stunDuration: 1, category: 'actions', path: 'Offense' },
        { id: 'image-miroir', name: 'Image miroir', description: 'Esquive — désavantage sur les attaques reçues 2 tours.', cooldown: 4, maxUses: 0, targetType: 'self', effect: 'dodge', category: 'bonusActions', path: 'Défense' },
        { id: 'pas-de-mage', name: 'Pas de mage', description: '+2 cases de mouvement ce tour.', cooldown: 2, maxUses: 0, targetType: 'self', effect: 'extraMovement', extraMove: 2, category: 'bonusActions', path: 'Mobilité' }
      ],
      4: [
        { id: 'desintegration', name: 'Désintégration', damage: '3d6+6', range: 6, description: 'Rayon dévastateur, perce l\'armure.', cooldown: 4, maxUses: 0, targetType: 'enemy', magical: true, armorPiercing: true, category: 'actions', path: 'Offense' },
        { id: 'telekinesie', name: 'Télékinésie', range: 6, description: 'Pousse un ennemi de 2 cases.', cooldown: 0, maxUses: 1, targetType: 'enemy', magical: true, effect: 'push', pushDistance: 2, category: 'actions', path: 'Contrôle' },
        { id: 'contresort', name: 'Contresort', description: 'Annule un sort ennemi.', maxUses: 2, trigger: 'enemySpell', effect: 'counterspell', category: 'reactions', path: 'Défense' }
      ],
      5: [
        { id: 'meteor', name: 'Nuée de météores', damage: '4d6+3', range: 6, description: 'Frappe la cible ET les ennemis adjacents.', cooldown: 0, maxUses: 1, targetType: 'enemy', magical: true, effect: 'aoe', category: 'actions', path: 'Offense' },
        { id: 'cage-de-force', name: 'Cage de force', range: 6, description: 'Emprisonne (stun) 2 tours.', cooldown: 0, maxUses: 1, targetType: 'enemy', magical: true, effect: 'stun', stunDuration: 2, category: 'actions', path: 'Contrôle' },
        { id: 'transfert-arcanique', name: 'Transfert arcanique', description: 'Réinitialise tous les cooldowns.', cooldown: 0, maxUses: 1, targetType: 'self', effect: 'arcaneRecovery', category: 'bonusActions', path: 'Utilité' }
      ]
    },
    evolution: {
      'boule-de-feu': { damage: '3d6+3', name: 'Boule de feu+' },
      'bouclier-magique': { absorption: 18, name: 'Bouclier magique+' },
      'rayon-givre': { damage: '2d8+3', name: 'Rayon de givre+' }
    }
  },

  voleur: {
    baseKit: {
      actions: [
        { id: 'attaque-sournoise', name: 'Attaque sournoise', damage: '1d6+3', bonusDamage: '2d6', range: 1, description: '+2d6 si avantage ou allié adjacent.', cooldown: 0, maxUses: 0, targetType: 'enemy', sneakAttack: true }
      ],
      bonusActions: [],
      reactions: [
        { id: 'attaque-opportunite-voleur', name: 'Attaque d\'opportunité', damage: '1d6+3', range: 1, trigger: 'enemyLeaves' }
      ]
    },
    levels: {
      2: [
        { id: 'double-frappe', name: 'Double frappe', damage: '1d6+3', hits: 2, range: 1, description: 'Deux attaques rapides.', cooldown: 3, maxUses: 0, targetType: 'enemy', category: 'actions', path: 'Offense' },
        { id: 'retraite-rapide', name: 'Retraite rapide', description: 'Désengagement en bonus action.', cooldown: 0, maxUses: 0, targetType: 'self', effect: 'disengage', category: 'bonusActions', path: 'Mobilité' },
        { id: 'disparaitre', name: 'Disparaître', description: 'Avantage sur la prochaine attaque.', cooldown: 0, maxUses: 2, targetType: 'self', effect: 'advantage', category: 'bonusActions', path: 'Offense' }
      ],
      3: [
        { id: 'infiltration', name: 'Infiltration', damage: '1d6+3', bonusDamage: '2d6', range: 1, description: 'Depuis le flanc, +2d6 dégâts.', cooldown: 3, maxUses: 0, targetType: 'enemy', requiresFlank: true, category: 'actions', path: 'Offense' },
        { id: 'esquive-reflexe', name: 'Esquive réflexe', description: 'Réduit dégâts de 50%.', maxUses: 2, trigger: 'onDamage', category: 'reactions', path: 'Défense' },
        { id: 'poison-corrosif', name: 'Poison corrosif', description: 'Soins -50% pendant 2 tours.', cooldown: 4, maxUses: 2, targetType: 'enemy', range: 1, effect: 'antiHeal', antiHealDuration: 2, antiHealFactor: 0.5, category: 'bonusActions', path: 'Contrôle' }
      ],
      4: [
        { id: 'coup-fatal', name: 'Coup fatal', range: 1, description: 'Exécution si cible < 25% PV.', cooldown: 0, maxUses: 1, targetType: 'enemy', effect: 'execute', executeThreshold: 0.25, category: 'actions', path: 'Offense' },
        { id: 'esquive-bonus', name: 'Esquive', description: 'Dodge en bonus action.', cooldown: 2, maxUses: 0, targetType: 'self', effect: 'dodge', category: 'bonusActions', path: 'Défense' },
        { id: 'croche-pied', name: 'Croche-pied', damage: '1d6+3', range: 1, description: 'Renverse, étourdi 1 tour.', cooldown: 3, maxUses: 0, targetType: 'enemy', effect: 'stun', stunDuration: 1, category: 'actions', path: 'Contrôle' }
      ],
      5: [
        { id: 'frappe-mortelle', name: 'Frappe mortelle', damage: '1d6+3', bonusDamage: '4d6', range: 1, description: '+4d6 si sneak. Usage unique.', cooldown: 0, maxUses: 1, targetType: 'enemy', sneakAttack: true, category: 'actions', path: 'Offense' },
        { id: 'evasion-voleur', name: 'Évasion', description: 'Réduit tout dégât de 50%. CD 2.', cooldown: 2, maxUses: 0, trigger: 'onDamage', category: 'reactions', path: 'Défense' },
        { id: 'embuscade-parfaite', name: 'Embuscade parfaite', description: '+2 mouvement ET avantage. 1x.', cooldown: 0, maxUses: 1, targetType: 'self', effect: 'ambush', extraMove: 2, category: 'bonusActions', path: 'Mobilité' }
      ]
    },
    evolution: {
      'double-frappe': { hits: 3, name: 'Triple frappe' },
      'retraite-rapide': { name: 'Retraite rapide+' },
      'disparaitre': { maxUses: 4, name: 'Disparaître+' }
    }
  },

  rodeur: {
    baseKit: {
      actions: [
        { id: 'tir-precis', name: 'Tir précis', damage: '1d8+3', range: 5, description: 'Tir à distance.', cooldown: 0, maxUses: 0, targetType: 'enemy' }
      ],
      bonusActions: [],
      reactions: [
        { id: 'attaque-opportunite-rodeur', name: 'Attaque d\'opportunité', damage: '1d8+3', range: 1, trigger: 'enemyLeaves' }
      ]
    },
    levels: {
      2: [
        { id: 'tir-double', name: 'Tir double', damage: '1d8+3', hits: 2, range: 5, description: 'Deux tirs rapides.', cooldown: 4, maxUses: 0, targetType: 'enemy', category: 'actions', path: 'Offense' },
        { id: 'couverture', name: 'Couverture', description: 'Dodge en bonus action.', cooldown: 2, maxUses: 0, targetType: 'self', effect: 'dodge', category: 'bonusActions', path: 'Défense' },
        { id: 'marque-chasse', name: 'Marque de chasse', range: 5, description: '+1d6 dégâts reçus par la cible.', cooldown: 4, maxUses: 0, targetType: 'enemy', effect: 'hunted', huntedBonusDamage: '1d6', category: 'actions', path: 'Contrôle' }
      ],
      3: [
        { id: 'frappe-explosive', name: 'Frappe explosive', damage: '1d8+7', range: 5, description: 'Perce l\'armure.', cooldown: 3, maxUses: 0, targetType: 'enemy', armorPiercing: true, category: 'actions', path: 'Offense' },
        { id: 'tir-represailles', name: 'Tir de représailles', damage: '1d8+3', range: 5, description: 'Tir gratuit si un allié tombe.', maxUses: 1, trigger: 'allyFalls', category: 'reactions', path: 'Défense' },
        { id: 'poison', name: 'Poison', range: 5, description: '3-5 dégâts/tour, 4 tours.', cooldown: 3, maxUses: 2, targetType: 'enemy', effect: 'poison', poisonDamageMin: 3, poisonDamageMax: 5, poisonDuration: 4, category: 'bonusActions', path: 'Contrôle' }
      ],
      4: [
        { id: 'pluie-fleches', name: 'Pluie de flèches', damage: '1d8+3', range: 5, description: 'Touche la cible ET adjacents.', cooldown: 4, maxUses: 0, targetType: 'enemy', effect: 'aoe', category: 'actions', path: 'Offense' },
        { id: 'camouflage', name: 'Camouflage naturel', description: 'Avantage + dodge 2 tours.', cooldown: 4, maxUses: 0, targetType: 'self', effect: 'advantage', category: 'bonusActions', path: 'Défense' },
        { id: 'marque-maudite', name: 'Marque maudite', range: 5, description: 'Annule le prochain soin de la cible.', cooldown: 4, maxUses: 1, targetType: 'enemy', effect: 'cursedMark', category: 'bonusActions', path: 'Contrôle' }
      ],
      5: [
        { id: 'tir-tueur', name: 'Tir du tueur', damage: '3d8+5', range: 5, description: 'Flèche enchantée, perce l\'armure. 1x.', cooldown: 0, maxUses: 1, targetType: 'enemy', armorPiercing: true, category: 'actions', path: 'Offense' },
        { id: 'sentinelle', name: 'Sentinelle', damage: '1d8+3', range: 5, description: 'Tire sur tout ennemi qui attaque un allié.', maxUses: 0, cooldown: 0, trigger: 'allyHit', category: 'reactions', path: 'Défense' },
        { id: 'piege-arcanique', name: 'Piège arcanique', damage: '1d8+3', range: 5, description: 'Stun 2 tours.', cooldown: 4, maxUses: 0, targetType: 'enemy', effect: 'stun', stunDuration: 2, category: 'actions', path: 'Contrôle' }
      ]
    },
    evolution: {
      'tir-double': { hits: 3, name: 'Tir triple' },
      'couverture': { cooldown: 1, name: 'Couverture+' },
      'marque-chasse': { cooldown: 3, name: 'Marque de chasse+' }
    }
  },

  clerc: {
    baseKit: {
      actions: [
        { id: 'frappe-sacree', name: 'Frappe sacrée', damage: '1d8+2', range: 1, description: 'Attaque de mêlée magique.', cooldown: 0, maxUses: 0, targetType: 'enemy', magical: true }
      ],
      bonusActions: [],
      reactions: [
        { id: 'attaque-opportunite-clerc', name: 'Attaque d\'opportunité', damage: '1d8+2', range: 1, trigger: 'enemyLeaves' }
      ]
    },
    levels: {
      2: [
        { id: 'mot-guerison', name: 'Mot de guérison', heal: '1d8+3', range: 3, description: 'Soin à distance.', cooldown: 3, maxUses: 0, targetType: 'ally', category: 'bonusActions', path: 'Soin' },
        { id: 'bouclier-foi', name: 'Bouclier de foi', range: 2, description: 'Absorbe 10 dégâts. Concentration.', cooldown: 3, maxUses: 0, targetType: 'ally', effect: 'faithShield', absorption: 10, duration: 3, concentration: true, category: 'bonusActions', path: 'Défense' },
        { id: 'aider', name: 'Aider', range: 1, description: 'Avantage à un allié adjacent.', cooldown: 0, maxUses: 0, targetType: 'ally', effect: 'giveAdvantage', category: 'actions', path: 'Soutien' }
      ],
      3: [
        { id: 'soin-divin', name: 'Soin divin', heal: '3d8+5', range: 1, description: 'Soin puissant.', cooldown: 4, maxUses: 0, targetType: 'ally', category: 'actions', path: 'Soin' },
        { id: 'interception-divine', name: 'Interception divine', description: 'Réduit dégâts allié adjacent de 1d6+3.', cooldown: 2, maxUses: 0, trigger: 'allyHit', range: 1, category: 'reactions', path: 'Défense' },
        { id: 'purification', name: 'Purification', range: 1, description: 'Retire poison et malédictions.', cooldown: 3, maxUses: 0, targetType: 'ally', effect: 'purify', category: 'actions', path: 'Soutien' }
      ],
      4: [
        { id: 'flamme-sacree', name: 'Flamme sacrée', damage: '2d8+3', range: 4, description: 'Feu divin, perce l\'armure.', cooldown: 3, maxUses: 0, targetType: 'enemy', magical: true, armorPiercing: true, category: 'actions', path: 'Offense' },
        { id: 'mot-guerison-urgence', name: 'Mot de guérison d\'urgence', heal: '1d8+3', description: 'Sauve un allié à 0 PV.', maxUses: 2, trigger: 'allyFalls', category: 'reactions', path: 'Soin' },
        { id: 'injonction', name: 'Injonction', range: 3, description: 'Stun 1 tour.', cooldown: 3, maxUses: 0, targetType: 'enemy', magical: true, effect: 'stun', stunDuration: 1, category: 'actions', path: 'Contrôle' }
      ],
      5: [
        { id: 'guerison-groupe', name: 'Guérison de groupe', heal: '2d8+3', range: 3, description: 'Soigne TOUS les alliés proches. 1x.', cooldown: 0, maxUses: 1, targetType: 'self', effect: 'massHeal', category: 'actions', path: 'Soin' },
        { id: 'gardien-foi', name: 'Gardien de la foi', description: 'Zone de dégâts autour de vous. 2d6 aux ennemis adjacents, 3 tours.', cooldown: 0, maxUses: 1, targetType: 'self', effect: 'guardianOfFaith', guardianDamage: 7, guardianDuration: 3, category: 'actions', path: 'Défense' },
        { id: 'bannissement', name: 'Bannissement', range: 4, description: 'Banit une cible 2 tours (stun). Concentration.', cooldown: 0, maxUses: 1, targetType: 'enemy', magical: true, effect: 'stun', stunDuration: 2, concentration: true, category: 'actions', path: 'Contrôle' }
      ]
    },
    evolution: {
      'mot-guerison': { heal: '2d8+3', name: 'Mot de guérison+' },
      'bouclier-foi': { absorption: 15, name: 'Bouclier de foi+' },
      'aider': { range: 2, name: 'Aider+' }
    }
  }
}
