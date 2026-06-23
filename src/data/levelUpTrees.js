export const LEVEL_THRESHOLDS = [
  { level: 2, xp: 3 },
  { level: 3, xp: 9 },
  { level: 4, xp: 16 },
  { level: 5, xp: 23 }
]

export const LEVEL_UP_TREES = {
  guerrier: {
    baseKit: {
      actions: [
        { id: 'attaque', name: 'Attaque', damage: '1d10+3', range: 1, description: 'Attaque de mêlée standard.', cooldown: 0, maxUses: 0, targetType: 'enemy' },
        { id: 'attaque-puissante', name: 'Attaque puissante', damage: '2d10+3', range: 1, description: 'Coup dévastateur en mêlée.', cooldown: 2, maxUses: 0, targetType: 'enemy' }
      ],
      bonusActions: [
        { id: 'second-souffle', name: 'Second souffle', heal: '1d10+4', description: 'Se soigner soi-même.', cooldown: 0, maxUses: 1, targetType: 'self' },
        { id: 'posture-defensive', name: 'Posture défensive', description: '+2 CA jusqu\'au prochain tour.', cooldown: 2, maxUses: 0, targetType: 'self', effect: 'defensePosture', acBonus: 2 }
      ],
      reactions: [
        { id: 'attaque-opportunite', name: 'Attaque d\'opportunité', damage: '1d10+3', range: 1, trigger: 'enemyLeaves' }
      ]
    },
    levels: {
      2: [
        { id: 'enchainement', name: 'Enchaînement', damage: '1d10+3', range: 1, description: 'Frappe la cible et un ennemi adjacent.', cooldown: 3, maxUses: 0, targetType: 'enemy', effect: 'cleave', category: 'actions', path: 'Offense' },
        { id: 'cri-de-guerre', name: 'Cri de guerre', description: 'Cible a désavantage 2 tours.', range: 3, cooldown: 3, maxUses: 0, targetType: 'enemy', effect: 'frighten', frightenDuration: 2, category: 'bonusActions', path: 'Contrôle' },
        { id: 'interception', name: 'Interception', description: 'Prend le coup d\'un allié adjacent, dégâts /2.', cooldown: 2, maxUses: 0, trigger: 'allyHit', range: 1, effect: 'intercept', category: 'reactions', path: 'Défense' }
      ],
      3: [
        { id: 'frappe-tourbillonnante', name: 'Frappe tourbillonnante', damage: '1d10+3', range: 1, description: 'Frappe TOUS les ennemis adjacents.', cooldown: 4, maxUses: 0, targetType: 'self', effect: 'whirlwind', category: 'actions', path: 'Offense' },
        { id: 'mur-de-boucliers', name: 'Mur de boucliers', description: '+2 CA vous et alliés adjacents, 2 tours.', cooldown: 4, maxUses: 0, targetType: 'self', effect: 'shieldWall', acBonus: 2, duration: 3, category: 'bonusActions', path: 'Défense' },
        { id: 'provocation', name: 'Provocation', description: 'Désavantage sur cible 2 tours.', range: 3, cooldown: 4, maxUses: 0, targetType: 'enemy', effect: 'frighten', frightenDuration: 2, category: 'bonusActions', path: 'Contrôle' }
      ],
      4: [
        { id: 'balayage', name: 'Balayage', damage: '1d10+3', range: 1, description: 'Renverse, étourdi 1 tour.', cooldown: 3, maxUses: 0, targetType: 'enemy', effect: 'stun', stunDuration: 1, category: 'actions', path: 'Contrôle' },
        { id: 'seconde-attaque', name: 'Seconde attaque', damage: '1d10', range: 1, description: 'Une attaque supplémentaire.', cooldown: 0, maxUses: 1, targetType: 'enemy', category: 'bonusActions', path: 'Offense' },
        { id: 'determination', name: 'Détermination', description: 'Réduit dégâts de 50%.', maxUses: 1, trigger: 'onDamage', category: 'reactions', path: 'Défense' }
      ],
      5: [
        { id: 'sursaut-action', name: 'Sursaut d\'action', description: 'Récupère votre action. Agissez deux fois.', cooldown: 0, maxUses: 1, targetType: 'self', effect: 'actionSurge', category: 'bonusActions', path: 'Offense' },
        { id: 'champion', name: 'Champion', damage: '3d10+3', range: 1, description: 'Coup ultime dévastateur.', cooldown: 0, maxUses: 1, targetType: 'enemy', category: 'actions', path: 'Offense' },
        { id: 'bastion', name: 'Bastion', description: '+3 CA équipe adjacente, 3 tours.', cooldown: 0, maxUses: 1, targetType: 'self', effect: 'shieldWall', acBonus: 3, duration: 4, category: 'bonusActions', path: 'Défense' }
      ]
    },
    evolution: {
      'enchainement': { cooldown: 2, name: 'Enchaînement+' },
      'cri-de-guerre': { frightenDuration: 3, name: 'Cri de guerre+' },
      'interception': { cooldown: 1, name: 'Interception+' }
    }
  },

  mage: {
    baseKit: {
      actions: [
        { id: 'sort-mineur', name: 'Sort mineur', damage: '1d6+3', range: 6, description: 'Attaque magique à distance.', cooldown: 0, maxUses: 0, targetType: 'enemy', magical: true }
      ],
      bonusActions: [
        { id: 'bouclier-magique', name: 'Bouclier magique', description: 'Absorbe 12 dégâts.', cooldown: 3, maxUses: 0, targetType: 'self', effect: 'shield', absorption: 12 },
        { id: 'pas-de-mage', name: 'Pas de mage', description: '+2 cases de mouvement.', cooldown: 2, maxUses: 0, targetType: 'self', effect: 'extraMovement', extraMove: 2 }
      ],
      reactions: []
    },
    levels: {
      2: [
        { id: 'boule-de-feu', name: 'Boule de feu', damage: '2d6+3', range: 6, description: 'Explosion de feu.', cooldown: 2, maxUses: 0, targetType: 'enemy', magical: true, category: 'actions', path: 'Offense' },
        { id: 'rayon-givre', name: 'Rayon de givre', damage: '1d8+3', range: 5, description: 'Stun 1 tour.', cooldown: 2, maxUses: 0, targetType: 'enemy', magical: true, effect: 'stun', stunDuration: 1, category: 'actions', path: 'Contrôle' },
        { id: 'image-miroir', name: 'Image miroir', description: 'Dodge 2 tours.', cooldown: 4, maxUses: 0, targetType: 'self', effect: 'dodge', category: 'bonusActions', path: 'Défense' }
      ],
      3: [
        { id: 'eclair', name: 'Éclair', damage: '1d10+3', range: 6, description: 'Foudre + stun 1 tour.', cooldown: 3, maxUses: 0, targetType: 'enemy', magical: true, effect: 'stun', stunDuration: 1, category: 'actions', path: 'Offense' },
        { id: 'telekinesie', name: 'Télékinésie', range: 6, description: 'Pousse 2 cases.', cooldown: 0, maxUses: 1, targetType: 'enemy', magical: true, effect: 'push', pushDistance: 2, category: 'actions', path: 'Contrôle' },
        { id: 'contresort', name: 'Contresort', description: 'Annule un sort ennemi.', maxUses: 2, trigger: 'enemySpell', effect: 'counterspell', category: 'reactions', path: 'Défense' }
      ],
      4: [
        { id: 'desintegration', name: 'Désintégration', damage: '3d6+6', range: 6, description: 'Perce l\'armure.', cooldown: 4, maxUses: 0, targetType: 'enemy', magical: true, armorPiercing: true, category: 'actions', path: 'Offense' },
        { id: 'cage-de-force', name: 'Cage de force', range: 6, description: 'Stun 2 tours.', cooldown: 0, maxUses: 1, targetType: 'enemy', magical: true, effect: 'stun', stunDuration: 2, category: 'actions', path: 'Contrôle' },
        { id: 'transfert-arcanique', name: 'Transfert arcanique', description: 'Reset tous les cooldowns.', cooldown: 0, maxUses: 1, targetType: 'self', effect: 'arcaneRecovery', category: 'bonusActions', path: 'Utilité' }
      ],
      5: [
        { id: 'meteor', name: 'Nuée de météores', damage: '4d6+3', range: 6, description: 'Frappe cible + adjacents.', cooldown: 0, maxUses: 1, targetType: 'enemy', magical: true, effect: 'aoe', category: 'actions', path: 'Offense' },
        { id: 'mur-de-feu', name: 'Mur de feu', description: 'Crée zone feu 1x3. 6 dégâts/tour, 3 tours.', cooldown: 0, maxUses: 1, targetType: 'cell', range: 5, magical: true, effect: 'createTerrain', terrainType: 'fire', terrainEmoji: '🔥', terrainLabel: 'Feu magique', aoeSize: 1, duration: 3, category: 'actions', path: 'Contrôle' },
        { id: 'globe-invulnerabilite', name: 'Globe d\'invulnérabilité', description: 'Absorbe 25 dégâts.', cooldown: 0, maxUses: 1, targetType: 'self', effect: 'shield', absorption: 25, category: 'bonusActions', path: 'Défense' }
      ]
    },
    evolution: {
      'boule-de-feu': { damage: '3d6+3', name: 'Boule de feu+' },
      'rayon-givre': { damage: '2d8+3', name: 'Rayon de givre+' },
      'image-miroir': { cooldown: 3, name: 'Image miroir+' }
    }
  },

  voleur: {
    baseKit: {
      actions: [
        { id: 'attaque-sournoise', name: 'Attaque sournoise', damage: '1d6+3', bonusDamage: '2d6', range: 1, description: '+2d6 si avantage ou allié adjacent.', cooldown: 0, maxUses: 0, targetType: 'enemy', sneakAttack: true }
      ],
      bonusActions: [
        { id: 'retraite-rapide', name: 'Retraite rapide', description: 'Désengagement en bonus action.', cooldown: 0, maxUses: 0, targetType: 'self', effect: 'disengage' },
        { id: 'disparaitre', name: 'Disparaître', description: 'Avantage prochaine attaque.', cooldown: 0, maxUses: 2, targetType: 'self', effect: 'advantage' }
      ],
      reactions: [
        { id: 'attaque-opportunite-voleur', name: 'Attaque d\'opportunité', damage: '1d6+3', range: 1, trigger: 'enemyLeaves' }
      ]
    },
    levels: {
      2: [
        { id: 'double-frappe', name: 'Double frappe', damage: '1d6+3', hits: 2, range: 1, description: 'Deux attaques rapides.', cooldown: 3, maxUses: 0, targetType: 'enemy', category: 'actions', path: 'Offense' },
        { id: 'poison-corrosif', name: 'Poison corrosif', description: 'Soins -50% pendant 2 tours.', cooldown: 4, maxUses: 2, targetType: 'enemy', range: 1, effect: 'antiHeal', antiHealDuration: 2, antiHealFactor: 0.5, category: 'bonusActions', path: 'Contrôle' },
        { id: 'esquive-reflexe', name: 'Esquive réflexe', description: 'Réduit dégâts de 50%.', maxUses: 2, trigger: 'onDamage', category: 'reactions', path: 'Défense' }
      ],
      3: [
        { id: 'infiltration', name: 'Infiltration', damage: '1d6+3', bonusDamage: '2d6', range: 1, description: 'Depuis le flanc, +2d6.', cooldown: 3, maxUses: 0, targetType: 'enemy', requiresFlank: true, category: 'actions', path: 'Offense' },
        { id: 'croche-pied', name: 'Croche-pied', damage: '1d6+3', range: 1, description: 'Stun 1 tour.', cooldown: 3, maxUses: 0, targetType: 'enemy', effect: 'stun', stunDuration: 1, category: 'actions', path: 'Contrôle' },
        { id: 'esquive-bonus', name: 'Esquive', description: 'Dodge en bonus action.', cooldown: 2, maxUses: 0, targetType: 'self', effect: 'dodge', category: 'bonusActions', path: 'Défense' }
      ],
      4: [
        { id: 'coup-fatal', name: 'Coup fatal', range: 1, description: 'Exécution si cible < 25% PV.', cooldown: 0, maxUses: 1, targetType: 'enemy', effect: 'execute', executeThreshold: 0.25, category: 'actions', path: 'Offense' },
        { id: 'embuscade-parfaite', name: 'Embuscade parfaite', description: '+2 mouvement ET avantage. 1x.', cooldown: 0, maxUses: 1, targetType: 'self', effect: 'ambush', extraMove: 2, category: 'bonusActions', path: 'Mobilité' },
        { id: 'evasion-voleur', name: 'Évasion', description: 'Réduit tout dégât de 50%. CD 2.', cooldown: 2, maxUses: 0, trigger: 'onDamage', category: 'reactions', path: 'Défense' }
      ],
      5: [
        { id: 'frappe-mortelle', name: 'Frappe mortelle', damage: '1d6+3', bonusDamage: '4d6', range: 1, description: '+4d6 si sneak. 1x.', cooldown: 0, maxUses: 1, targetType: 'enemy', sneakAttack: true, category: 'actions', path: 'Offense' },
        { id: 'maitre-ombres', name: 'Maître des ombres', description: 'Avantage permanent 3 tours.', cooldown: 0, maxUses: 1, targetType: 'self', effect: 'advantage', category: 'bonusActions', path: 'Mobilité' },
        { id: 'assassinat', name: 'Assassinat', damage: '3d6+3', range: 1, description: 'Dégâts doublés si cible n\'a pas encore agi.', cooldown: 0, maxUses: 1, targetType: 'enemy', category: 'actions', path: 'Offense' }
      ]
    },
    evolution: {
      'double-frappe': { hits: 3, name: 'Triple frappe' },
      'poison-corrosif': { antiHealDuration: 3, name: 'Poison mortel' },
      'esquive-reflexe': { maxUses: 3, name: 'Esquive réflexe+' }
    }
  },

  rodeur: {
    baseKit: {
      actions: [
        { id: 'tir-precis', name: 'Tir précis', damage: '1d8+3', range: 5, description: 'Tir à distance.', cooldown: 0, maxUses: 0, targetType: 'enemy' },
        { id: 'marque-chasse', name: 'Marque de chasse', range: 5, description: '+1d6 dégâts reçus par la cible.', cooldown: 4, maxUses: 0, targetType: 'enemy', effect: 'hunted', huntedBonusDamage: '1d6' }
      ],
      bonusActions: [
        { id: 'couverture', name: 'Couverture', description: 'Dodge en bonus action.', cooldown: 2, maxUses: 0, targetType: 'self', effect: 'dodge' }
      ],
      reactions: [
        { id: 'attaque-opportunite-rodeur', name: 'Attaque d\'opportunité', damage: '1d8+3', range: 1, trigger: 'enemyLeaves' }
      ]
    },
    levels: {
      2: [
        { id: 'tir-double', name: 'Tir double', damage: '1d8+3', hits: 2, range: 5, description: 'Deux tirs rapides.', cooldown: 4, maxUses: 0, targetType: 'enemy', category: 'actions', path: 'Offense' },
        { id: 'poison', name: 'Poison', range: 5, description: '3-5 dégâts/tour, 4 tours.', cooldown: 3, maxUses: 2, targetType: 'enemy', effect: 'poison', poisonDamageMin: 3, poisonDamageMax: 5, poisonDuration: 4, category: 'bonusActions', path: 'Contrôle' },
        { id: 'tir-represailles', name: 'Tir de représailles', damage: '1d8+3', range: 5, description: 'Tir gratuit si un allié tombe.', maxUses: 1, trigger: 'allyFalls', category: 'reactions', path: 'Défense' }
      ],
      3: [
        { id: 'frappe-explosive', name: 'Frappe explosive', damage: '1d8+7', range: 5, description: 'Perce l\'armure.', cooldown: 3, maxUses: 0, targetType: 'enemy', armorPiercing: true, category: 'actions', path: 'Offense' },
        { id: 'marque-maudite', name: 'Marque maudite', range: 5, description: 'Annule le prochain soin.', cooldown: 4, maxUses: 1, targetType: 'enemy', effect: 'cursedMark', category: 'bonusActions', path: 'Contrôle' },
        { id: 'camouflage', name: 'Camouflage naturel', description: 'Avantage 2 tours.', cooldown: 4, maxUses: 0, targetType: 'self', effect: 'advantage', category: 'bonusActions', path: 'Défense' }
      ],
      4: [
        { id: 'pluie-fleches', name: 'Pluie de flèches', damage: '1d8+3', range: 5, description: 'Cible + adjacents.', cooldown: 4, maxUses: 0, targetType: 'enemy', effect: 'aoe', category: 'actions', path: 'Offense' },
        { id: 'piege-arcanique', name: 'Piège arcanique', damage: '1d8+3', range: 5, description: 'Stun 2 tours.', cooldown: 4, maxUses: 0, targetType: 'enemy', effect: 'stun', stunDuration: 2, category: 'actions', path: 'Contrôle' },
        { id: 'sentinelle', name: 'Sentinelle', damage: '1d8+3', range: 5, description: 'Tire si un allié est attaqué.', maxUses: 0, cooldown: 0, trigger: 'allyHit', category: 'reactions', path: 'Défense' }
      ],
      5: [
        { id: 'tir-tueur', name: 'Tir du tueur', damage: '3d8+5', range: 5, description: 'Perce l\'armure. 1x.', cooldown: 0, maxUses: 1, targetType: 'enemy', armorPiercing: true, category: 'actions', path: 'Offense' },
        { id: 'pluie-empoisonnee', name: 'Pluie empoisonnée', damage: '1d8+3', range: 5, description: 'AoE + poison 3 tours.', cooldown: 0, maxUses: 1, targetType: 'enemy', effect: 'aoe', category: 'actions', path: 'Contrôle' },
        { id: 'oeil-de-faucon', name: 'Œil de faucon', description: 'Ignore couvert et LOS. Avantage 3 tours.', cooldown: 0, maxUses: 1, targetType: 'self', effect: 'advantage', category: 'bonusActions', path: 'Offense' }
      ]
    },
    evolution: {
      'tir-double': { hits: 3, name: 'Tir triple' },
      'poison': { poisonDuration: 5, name: 'Poison+' },
      'tir-represailles': { maxUses: 2, name: 'Tir de représailles+' }
    }
  },

  clerc: {
    baseKit: {
      actions: [
        { id: 'frappe-sacree', name: 'Frappe sacrée', damage: '1d8+2', range: 1, description: 'Attaque de mêlée magique.', cooldown: 0, maxUses: 0, targetType: 'enemy', magical: true },
        { id: 'aider', name: 'Aider', range: 1, description: 'Avantage à un allié adjacent.', cooldown: 0, maxUses: 0, targetType: 'ally', effect: 'giveAdvantage' }
      ],
      bonusActions: [
        { id: 'mot-guerison', name: 'Mot de guérison', heal: '1d8+3', range: 3, description: 'Soin à distance.', cooldown: 3, maxUses: 0, targetType: 'ally' }
      ],
      reactions: [
        { id: 'attaque-opportunite-clerc', name: 'Attaque d\'opportunité', damage: '1d8+2', range: 1, trigger: 'enemyLeaves' }
      ]
    },
    levels: {
      2: [
        { id: 'soin-divin', name: 'Soin divin', heal: '3d8+5', range: 1, description: 'Soin puissant.', cooldown: 4, maxUses: 0, targetType: 'ally', category: 'actions', path: 'Soin' },
        { id: 'bouclier-foi', name: 'Bouclier de foi', range: 2, description: 'Absorbe 10 dégâts. Concentration.', cooldown: 3, maxUses: 0, targetType: 'ally', effect: 'faithShield', absorption: 10, duration: 3, concentration: true, category: 'bonusActions', path: 'Défense' },
        { id: 'purification', name: 'Purification', range: 1, description: 'Retire poison et malédictions.', cooldown: 3, maxUses: 0, targetType: 'ally', effect: 'purify', category: 'actions', path: 'Soutien' }
      ],
      3: [
        { id: 'flamme-sacree', name: 'Flamme sacrée', damage: '2d8+3', range: 4, description: 'Feu divin, perce l\'armure.', cooldown: 3, maxUses: 0, targetType: 'enemy', magical: true, armorPiercing: true, category: 'actions', path: 'Offense' },
        { id: 'interception-divine', name: 'Interception divine', description: 'Réduit dégâts allié de 1d6+3.', cooldown: 2, maxUses: 0, trigger: 'allyHit', range: 1, reduction: '1d6+3', category: 'reactions', path: 'Défense' },
        { id: 'injonction', name: 'Injonction', range: 3, description: 'Stun 1 tour.', cooldown: 3, maxUses: 0, targetType: 'enemy', magical: true, effect: 'stun', stunDuration: 1, category: 'actions', path: 'Contrôle' }
      ],
      4: [
        { id: 'mot-guerison-urgence', name: 'Mot de guérison d\'urgence', heal: '1d8+3', description: 'Sauve un allié à 0 PV.', maxUses: 2, trigger: 'allyFalls', category: 'reactions', path: 'Soin' },
        { id: 'chatiment-sacre', name: 'Châtiment sacré', damage: '2d8+3', range: 1, description: 'Soigne le Clerc de 50% des dégâts.', cooldown: 3, maxUses: 0, targetType: 'enemy', magical: true, category: 'actions', path: 'Offense' },
        { id: 'benediction', name: 'Bénédiction', description: '+1 ATK allié adjacent 3 tours.', cooldown: 4, maxUses: 0, targetType: 'ally', range: 1, effect: 'giveAdvantage', category: 'bonusActions', path: 'Soutien' }
      ],
      5: [
        { id: 'guerison-groupe', name: 'Guérison de groupe', heal: '2d8+3', range: 3, description: 'Soigne TOUS les alliés. 1x.', cooldown: 0, maxUses: 1, targetType: 'self', effect: 'massHeal', category: 'actions', path: 'Soin' },
        { id: 'gardien-foi', name: 'Gardien de la foi', description: 'Zone dégâts adjacents, 3 tours.', cooldown: 0, maxUses: 1, targetType: 'self', effect: 'guardianOfFaith', guardianDamage: 7, guardianDuration: 3, category: 'actions', path: 'Défense' },
        { id: 'bannissement', name: 'Bannissement', range: 4, description: 'Stun 2 tours. Concentration.', cooldown: 0, maxUses: 1, targetType: 'enemy', magical: true, effect: 'stun', stunDuration: 2, concentration: true, category: 'actions', path: 'Contrôle' }
      ]
    },
    evolution: {
      'soin-divin': { heal: '4d8+5', name: 'Soin divin+' },
      'bouclier-foi': { absorption: 15, name: 'Bouclier de foi+' },
      'purification': { cooldown: 2, name: 'Purification+' }
    }
  }
}
