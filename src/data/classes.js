export const CLASSES = {
  guerrier: {
    id: 'guerrier',
    name: 'Guerrier',
    emoji: '⚔️',
    hp: 52,
    ac: 18,
    attackBonus: 5,
    damageDice: '1d10+3',
    movement: 3,
    range: 1,
    description: 'Combattant robuste, maître du corps à corps et de la défense.',
    abilities: {
      actions: [
        {
          id: 'attaque',
          name: 'Attaque',
          damage: '1d10+3',
          range: 1,
          description: 'Attaque de mêlée standard.',
          cooldown: 0,
          maxUses: 0,
          targetType: 'enemy'
        },
        {
          id: 'attaque-puissante',
          name: 'Attaque puissante',
          damage: '2d10+3',
          range: 1,
          description: 'Coup dévastateur en mêlée.',
          cooldown: 2,
          maxUses: 0,
          targetType: 'enemy'
        },
        {
          id: 'desengagement',
          name: 'Désengagement',
          description: 'Quitter la mêlée sans provoquer d\'attaque d\'opportunité.',
          cooldown: 0,
          maxUses: 0,
          targetType: 'self',
          effect: 'disengage'
        },
        {
          id: 'dodge',
          name: 'Dodge',
          description: 'Désavantage sur toutes les attaques reçues jusqu\'au prochain tour.',
          cooldown: 0,
          maxUses: 0,
          targetType: 'self',
          effect: 'dodge'
        }
      ],
      bonusActions: [
        {
          id: 'seconde-attaque',
          name: 'Seconde attaque',
          damage: '1d10',
          range: 1,
          description: 'Une attaque supplémentaire.',
          cooldown: 0,
          maxUses: 1,
          targetType: 'enemy'
        },
        {
          id: 'posture-defensive',
          name: 'Posture défensive',
          description: '+2 CA jusqu\'au prochain tour.',
          cooldown: 2,
          maxUses: 0,
          targetType: 'self',
          effect: 'defensePosture',
          acBonus: 2
        },
        {
          id: 'second-souffle',
          name: 'Second souffle',
          heal: '1d10+4',
          description: 'Se soigner soi-même.',
          cooldown: 0,
          maxUses: 1,
          targetType: 'self'
        }
      ],
      reactions: [
        {
          id: 'attaque-opportunite',
          name: 'Attaque d\'opportunité',
          damage: '1d10+3',
          range: 1,
          description: 'Frappe un ennemi qui quitte la mêlée.',
          trigger: 'enemyLeaves'
        },
        {
          id: 'interception',
          name: 'Interception',
          description: 'Prend le coup à la place d\'un allié adjacent, dégâts réduits de moitié.',
          cooldown: 2,
          maxUses: 0,
          trigger: 'allyHit',
          range: 1,
          effect: 'intercept'
        }
      ]
    }
  },

  mage: {
    id: 'mage',
    name: 'Mage',
    emoji: '🔥',
    hp: 34,
    ac: 13,
    attackBonus: 5,
    damageDice: '1d6+3',
    movement: 2,
    range: 6,
    description: 'Lanceur de sorts dévastateur à distance.',
    abilities: {
      actions: [
        {
          id: 'sort-mineur',
          name: 'Sort mineur',
          damage: '1d6+3',
          range: 6,
          description: 'Attaque magique à distance.',
          cooldown: 0,
          maxUses: 0,
          targetType: 'enemy',
          magical: true
        },
        {
          id: 'boule-de-feu',
          name: 'Boule de feu',
          damage: '2d6+3',
          range: 6,
          description: 'Explosion de feu dévastatrice.',
          cooldown: 2,
          maxUses: 0,
          targetType: 'enemy',
          magical: true
        },
        {
          id: 'eclair',
          name: 'Éclair',
          damage: '1d10+3',
          range: 6,
          description: 'Foudre qui étourdit 1 tour.',
          cooldown: 3,
          maxUses: 0,
          targetType: 'enemy',
          magical: true,
          effect: 'stun',
          stunDuration: 1
        },
        {
          id: 'telekinesie',
          name: 'Télékinésie',
          range: 6,
          description: 'Pousse un ennemi de 2 cases.',
          cooldown: 0,
          maxUses: 1,
          targetType: 'enemy',
          magical: true,
          effect: 'push',
          pushDistance: 2
        },
        {
          id: 'desengagement-mage',
          name: 'Désengagement',
          description: 'Quitter la mêlée sans provoquer d\'AO.',
          cooldown: 0,
          maxUses: 0,
          targetType: 'self',
          effect: 'disengage'
        }
      ],
      bonusActions: [
        {
          id: 'bouclier-magique',
          name: 'Bouclier magique',
          description: 'Absorbe 12 dégâts.',
          cooldown: 3,
          maxUses: 0,
          targetType: 'self',
          effect: 'shield',
          absorption: 12
        },
        {
          id: 'pas-de-mage',
          name: 'Pas de mage',
          description: '+1 case de mouvement ce tour.',
          cooldown: 2,
          maxUses: 0,
          targetType: 'self',
          effect: 'extraMovement',
          extraMove: 1
        }
      ],
      reactions: [
        {
          id: 'contresort',
          name: 'Contresort',
          description: 'Annule un sort ennemi.',
          maxUses: 2,
          trigger: 'enemySpell',
          effect: 'counterspell'
        }
      ]
    }
  },

  voleur: {
    id: 'voleur',
    name: 'Voleur',
    emoji: '🗡️',
    hp: 38,
    ac: 14,
    attackBonus: 5,
    damageDice: '1d6+3',
    movement: 4,
    range: 1,
    description: 'Assassin agile, maître des attaques sournoises.',
    abilities: {
      actions: [
        {
          id: 'attaque-sournoise',
          name: 'Attaque sournoise',
          damage: '1d6+3',
          bonusDamage: '2d6',
          range: 1,
          description: '+2d6 si avantage ou allié adjacent à la cible.',
          cooldown: 0,
          maxUses: 0,
          targetType: 'enemy',
          sneakAttack: true
        },
        {
          id: 'double-frappe',
          name: 'Double frappe',
          damage: '1d6+3',
          hits: 2,
          range: 1,
          description: 'Deux attaques rapides.',
          cooldown: 3,
          maxUses: 0,
          targetType: 'enemy'
        },
        {
          id: 'coup-fatal',
          name: 'Coup fatal',
          range: 1,
          description: 'Exécution si cible < 25% PV.',
          cooldown: 0,
          maxUses: 1,
          targetType: 'enemy',
          effect: 'execute',
          executeThreshold: 0.25
        },
        {
          id: 'infiltration',
          name: 'Infiltration',
          damage: '1d6+3',
          bonusDamage: '2d6',
          range: 1,
          description: 'Depuis le flanc, +2d6 dégâts.',
          cooldown: 3,
          maxUses: 0,
          targetType: 'enemy',
          requiresFlank: true
        },
        {
          id: 'desengagement-voleur',
          name: 'Désengagement',
          description: 'Quitter la mêlée sans provoquer d\'AO.',
          cooldown: 0,
          maxUses: 0,
          targetType: 'self',
          effect: 'disengage'
        }
      ],
      bonusActions: [
        {
          id: 'retraite-rapide',
          name: 'Retraite rapide',
          description: 'Désengagement gratuit.',
          cooldown: 0,
          maxUses: 0,
          targetType: 'self',
          effect: 'disengage'
        },
        {
          id: 'disparaitre',
          name: 'Disparaître',
          description: 'Avantage sur la prochaine attaque.',
          cooldown: 0,
          maxUses: 2,
          targetType: 'self',
          effect: 'advantage'
        },
        {
          id: 'poison-corrosif',
          name: 'Poison corrosif',
          description: 'Cible reçoit 50% de soins pendant 2 tours.',
          cooldown: 4,
          maxUses: 2,
          targetType: 'enemy',
          range: 1,
          effect: 'antiHeal',
          antiHealDuration: 2,
          antiHealFactor: 0.5
        },
        {
          id: 'esquive-bonus',
          name: 'Esquive',
          description: 'Dodge en bonus action.',
          cooldown: 2,
          maxUses: 0,
          targetType: 'self',
          effect: 'dodge'
        }
      ],
      reactions: [
        {
          id: 'esquive-reflexe',
          name: 'Esquive réflexe',
          description: 'Réduit dégâts reçus de 50%.',
          maxUses: 2,
          trigger: 'onDamage'
        },
        {
          id: 'attaque-opportunite-voleur',
          name: 'Attaque d\'opportunité',
          damage: '1d6+3',
          range: 1,
          trigger: 'enemyLeaves'
        }
      ]
    }
  },

  rodeur: {
    id: 'rodeur',
    name: 'Rôdeur',
    emoji: '🏹',
    hp: 44,
    ac: 15,
    attackBonus: 5,
    damageDice: '1d8+3',
    movement: 3,
    range: 5,
    description: 'Archer expert, maître des poisons et du pistage.',
    abilities: {
      actions: [
        {
          id: 'tir-precis',
          name: 'Tir précis',
          damage: '1d8+3',
          range: 5,
          description: 'Tir à distance standard.',
          cooldown: 0,
          maxUses: 0,
          targetType: 'enemy'
        },
        {
          id: 'tir-double',
          name: 'Tir double',
          damage: '1d8+3',
          hits: 2,
          range: 5,
          description: 'Deux tirs rapides.',
          cooldown: 4,
          maxUses: 0,
          targetType: 'enemy'
        },
        {
          id: 'marque-chasse',
          name: 'Marque de chasse',
          range: 5,
          description: 'Cible reçoit +1d6 dégâts de toutes sources.',
          cooldown: 4,
          maxUses: 0,
          targetType: 'enemy',
          effect: 'hunted',
          huntedBonusDamage: '1d6'
        },
        {
          id: 'frappe-explosive',
          name: 'Frappe explosive',
          damage: '1d8+7',
          range: 5,
          description: 'Tir puissant qui perce l\'armure.',
          cooldown: 3,
          maxUses: 0,
          targetType: 'enemy',
          armorPiercing: true
        }
      ],
      bonusActions: [
        {
          id: 'poison',
          name: 'Poison',
          range: 5,
          description: '3-5 dégâts/tour pendant 4 tours.',
          cooldown: 3,
          maxUses: 2,
          targetType: 'enemy',
          effect: 'poison',
          poisonDamageMin: 3,
          poisonDamageMax: 5,
          poisonDuration: 4
        },
        {
          id: 'marque-maudite',
          name: 'Marque maudite',
          range: 5,
          description: 'Annule le prochain soin de la cible.',
          cooldown: 4,
          maxUses: 1,
          targetType: 'enemy',
          effect: 'cursedMark'
        },
        {
          id: 'couverture',
          name: 'Couverture',
          description: 'Dodge en bonus action.',
          cooldown: 2,
          maxUses: 0,
          targetType: 'self',
          effect: 'dodge'
        }
      ],
      reactions: [
        {
          id: 'tir-represailles',
          name: 'Tir de représailles',
          damage: '1d8+3',
          range: 5,
          description: 'Attaque gratuite si un allié tombe à 0 PV.',
          maxUses: 1,
          trigger: 'allyFalls'
        },
        {
          id: 'attaque-opportunite-rodeur',
          name: 'Attaque d\'opportunité',
          damage: '1d8+3',
          range: 1,
          trigger: 'enemyLeaves'
        }
      ]
    }
  },

  clerc: {
    id: 'clerc',
    name: 'Clerc',
    emoji: '✨',
    hp: 46,
    ac: 16,
    attackBonus: 5,
    damageDice: '1d8+2',
    movement: 3,
    range: 1,
    description: 'Guérisseur sacré, soutien de l\'équipe.',
    abilities: {
      actions: [
        {
          id: 'frappe-sacree',
          name: 'Frappe sacrée',
          damage: '1d8+2',
          range: 1,
          description: 'Attaque magique de mêlée.',
          cooldown: 0,
          maxUses: 0,
          targetType: 'enemy',
          magical: true
        },
        {
          id: 'soin-divin',
          name: 'Soin divin',
          heal: '3d8+5',
          range: 1,
          description: 'Soin puissant sur un allié ou soi-même.',
          cooldown: 4,
          maxUses: 0,
          targetType: 'ally',
          breaksConcentration: true
        },
        {
          id: 'purification',
          name: 'Purification',
          range: 1,
          description: 'Retire poison et malédictions.',
          cooldown: 3,
          maxUses: 0,
          targetType: 'ally',
          effect: 'purify'
        },
        {
          id: 'desengagement-clerc',
          name: 'Désengagement',
          description: 'Quitter la mêlée sans provoquer d\'AO.',
          cooldown: 0,
          maxUses: 0,
          targetType: 'self',
          effect: 'disengage'
        },
        {
          id: 'aider',
          name: 'Aider',
          range: 1,
          description: 'Avantage à un allié adjacent sur sa prochaine attaque.',
          cooldown: 0,
          maxUses: 0,
          targetType: 'ally',
          effect: 'giveAdvantage'
        }
      ],
      bonusActions: [
        {
          id: 'mot-guerison',
          name: 'Mot de guérison',
          heal: '1d8+3',
          range: 3,
          description: 'Soin à distance.',
          cooldown: 3,
          maxUses: 0,
          targetType: 'ally'
        },
        {
          id: 'bouclier-foi',
          name: 'Bouclier de foi',
          range: 2,
          description: 'Absorbe 10 dégâts sur un allié. Concentration.',
          cooldown: 3,
          maxUses: 0,
          targetType: 'ally',
          effect: 'faithShield',
          absorption: 10,
          concentration: true,
          duration: 3
        }
      ],
      reactions: [
        {
          id: 'mot-guerison-urgence',
          name: 'Mot de guérison d\'urgence',
          heal: '1d8+3',
          description: 'Soigne un allié qui tombe à 0 PV, le maintient à 1 PV.',
          maxUses: 2,
          trigger: 'allyFalls'
        },
        {
          id: 'interception-divine',
          name: 'Interception divine',
          description: 'Réduit dégâts d\'un allié adjacent de 1d6+3.',
          cooldown: 2,
          maxUses: 0,
          trigger: 'allyHit',
          range: 1,
          reduction: '1d6+3'
        },
        {
          id: 'attaque-opportunite-clerc',
          name: 'Attaque d\'opportunité',
          damage: '1d8+2',
          range: 1,
          trigger: 'enemyLeaves'
        }
      ]
    }
  }
}

export const CLASS_LIST = Object.values(CLASSES)
