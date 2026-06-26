export const MONSTERS = {
  // ============ PROLOGUE ============

  silhouette: {
    name: 'Silhouette',
    emoji: '👤',
    hp: 8, ac: 10, attackBonus: 2, damageDice: '1d4',
    movement: 2, range: 1,
    aiProfile: 'guerrier',
    abilities: {
      actions: [
        { id: 'silh-touch', name: 'Toucher froid', damage: '1d4', range: 1, targetType: 'enemy', cooldown: 0, maxUses: 0, description: 'Un contact glacial' }
      ],
      bonusActions: [],
      reactions: []
    }
  },

  // ============ ACTE 1 — Forêt maudite ============

  goblin: {
    name: 'Gobelin',
    emoji: '👺',
    hp: 16, ac: 13, attackBonus: 4, damageDice: '1d6+2',
    movement: 3, range: 1,
    aiProfile: 'voleur',
    abilities: {
      actions: [
        { id: 'goblin-atk', name: 'Cimeterre', damage: '1d6+2', range: 1, targetType: 'enemy', cooldown: 0, maxUses: 0, description: 'Attaque basique au cimeterre' },
        { id: 'goblin-disengage', name: 'Fuite', effect: 'disengage', targetType: 'self', cooldown: 0, maxUses: 0, description: 'Se désengage sans provoquer d\'AO' }
      ],
      bonusActions: [],
      reactions: [
        { id: 'goblin-ao', name: 'Attaque d\'opportunité', trigger: 'enemyLeaves', damage: '1d6+2', range: 1, targetType: 'enemy', cooldown: 0, maxUses: 0 }
      ]
    }
  },

  wolf: {
    name: 'Loup',
    emoji: '🐺',
    hp: 18, ac: 12, attackBonus: 4, damageDice: '1d8+2',
    movement: 4, range: 1,
    aiProfile: 'guerrier',
    abilities: {
      actions: [
        { id: 'wolf-bite', name: 'Morsure', damage: '1d8+2', range: 1, targetType: 'enemy', cooldown: 0, maxUses: 0, sneakAttack: true, bonusDamage: '1d6', description: 'Morsure vicieuse — bonus si allié adjacent à la cible' },
        { id: 'wolf-dodge', name: 'Esquive', effect: 'dodge', targetType: 'self', cooldown: 0, maxUses: 0, description: 'Esquive les attaques entrantes' }
      ],
      bonusActions: [],
      reactions: [
        { id: 'wolf-ao', name: 'Attaque d\'opportunité', trigger: 'enemyLeaves', damage: '1d8+2', range: 1, targetType: 'enemy', cooldown: 0, maxUses: 0 }
      ]
    }
  },

  skeleton: {
    name: 'Squelette',
    emoji: '💀',
    hp: 20, ac: 13, attackBonus: 4, damageDice: '1d6+2',
    movement: 2, range: 1,
    aiProfile: 'guerrier',
    abilities: {
      actions: [
        { id: 'skel-atk', name: 'Épée rouillée', damage: '1d6+2', range: 1, targetType: 'enemy', cooldown: 0, maxUses: 0, description: 'Frappe avec une épée corrodée' },
        { id: 'skel-dodge', name: 'Garde', effect: 'dodge', targetType: 'self', cooldown: 0, maxUses: 0, description: 'Se met en garde défensive' }
      ],
      bonusActions: [
        { id: 'skel-posture', name: 'Posture d\'os', effect: 'defensePosture', acBonus: 2, targetType: 'self', cooldown: 3, maxUses: 0, description: '+2 CA jusqu\'au prochain tour' }
      ],
      reactions: [
        { id: 'skel-ao', name: 'Attaque d\'opportunité', trigger: 'enemyLeaves', damage: '1d6+2', range: 1, targetType: 'enemy', cooldown: 0, maxUses: 0 }
      ]
    }
  },

  kobold: {
    name: 'Kobold',
    emoji: '🦎',
    hp: 12, ac: 14, attackBonus: 4, damageDice: '1d4+2',
    movement: 3, range: 1,
    aiProfile: 'voleur',
    abilities: {
      actions: [
        { id: 'kobold-atk', name: 'Dague', damage: '1d4+2', range: 1, targetType: 'enemy', cooldown: 0, maxUses: 0, sneakAttack: true, bonusDamage: '1d6', description: 'Dague — bonus si allié adjacent (tactique de meute)' },
        { id: 'kobold-disengage', name: 'Fuite', effect: 'disengage', targetType: 'self', cooldown: 0, maxUses: 0, description: 'Se désengage' }
      ],
      bonusActions: [],
      reactions: [
        { id: 'kobold-ao', name: 'Attaque d\'opportunité', trigger: 'enemyLeaves', damage: '1d4+2', range: 1, targetType: 'enemy', cooldown: 0, maxUses: 0 }
      ]
    }
  },

  bugbear: {
    name: 'Bugbear',
    emoji: '👹',
    hp: 42, ac: 14, attackBonus: 5, damageDice: '2d8+3',
    movement: 3, range: 1,
    aiProfile: 'guerrier',
    bossPhases: [
      { threshold: 0.5, effect: 'enrage', atkBonus: 3, movementBonus: 1, spawnReinforcements: ['goblin', 'goblin'] }
    ],
    abilities: {
      actions: [
        { id: 'bugbear-atk', name: 'Morgenstern', damage: '2d8+3', range: 1, targetType: 'enemy', cooldown: 0, maxUses: 0, description: 'Frappe lourde au morgenstern' },
        { id: 'bugbear-smash', name: 'Frappe brutale', damage: '3d8+3', range: 1, targetType: 'enemy', cooldown: 3, maxUses: 0, description: 'Coup dévastateur' },
        { id: 'bugbear-dodge', name: 'Esquive', effect: 'dodge', targetType: 'self', cooldown: 0, maxUses: 0, description: 'Esquive' }
      ],
      bonusActions: [
        { id: 'bugbear-second', name: 'Seconde attaque', damage: '2d8', range: 1, targetType: 'enemy', cooldown: 0, maxUses: 1, description: 'Un coup supplémentaire' }
      ],
      reactions: [
        { id: 'bugbear-ao', name: 'Attaque d\'opportunité', trigger: 'enemyLeaves', damage: '2d8+3', range: 1, targetType: 'enemy', cooldown: 0, maxUses: 0 }
      ]
    }
  },

  // ============ ACTE 2 — Crypte oubliée ============

  gnoll: {
    name: 'Gnoll',
    emoji: '🐗',
    hp: 30, ac: 14, attackBonus: 5, damageDice: '1d8+3',
    movement: 3, range: 1,
    aiProfile: 'guerrier',
    abilities: {
      actions: [
        { id: 'gnoll-atk', name: 'Hallebarde', damage: '1d8+3', range: 1, targetType: 'enemy', cooldown: 0, maxUses: 0, description: 'Frappe à la hallebarde' },
        { id: 'gnoll-frenzy', name: 'Frappe frénétique', damage: '1d8+3', hits: 2, range: 1, targetType: 'enemy', cooldown: 3, maxUses: 0, description: 'Deux frappes rapides' },
        { id: 'gnoll-dodge', name: 'Esquive', effect: 'dodge', targetType: 'self', cooldown: 0, maxUses: 0, description: 'Esquive' }
      ],
      bonusActions: [],
      reactions: [
        { id: 'gnoll-ao', name: 'Attaque d\'opportunité', trigger: 'enemyLeaves', damage: '1d8+3', range: 1, targetType: 'enemy', cooldown: 0, maxUses: 0 }
      ]
    }
  },

  zombie: {
    name: 'Zombie',
    emoji: '🧟',
    hp: 36, ac: 10, attackBonus: 3, damageDice: '1d6+1',
    movement: 2, range: 1,
    aiProfile: 'guerrier',
    abilities: {
      actions: [
        { id: 'zombie-slam', name: 'Coup', damage: '1d6+1', range: 1, targetType: 'enemy', cooldown: 0, maxUses: 0, description: 'Frappe lente mais lourde' },
        { id: 'zombie-grab', name: 'Étreinte', damage: '1d4+1', range: 1, targetType: 'enemy', cooldown: 2, maxUses: 0, effect: 'stun', stunDuration: 1, description: 'Agrippe et immobilise la cible 1 tour' }
      ],
      bonusActions: [],
      reactions: [
        { id: 'zombie-ao', name: 'Attaque d\'opportunité', trigger: 'enemyLeaves', damage: '1d6+1', range: 1, targetType: 'enemy', cooldown: 0, maxUses: 0 }
      ]
    }
  },

  necromancer: {
    name: 'Nécromancien',
    emoji: '🧙',
    hp: 28, ac: 12, attackBonus: 5, damageDice: '1d8+3',
    movement: 2, range: 5,
    aiProfile: 'mage',
    abilities: {
      actions: [
        { id: 'necro-ray', name: 'Rayon nécrotique', damage: '1d8+3', range: 5, targetType: 'enemy', cooldown: 0, maxUses: 0, magical: true, description: 'Rayon d\'énergie nécrotique' },
        { id: 'necro-drain', name: 'Drain de vie', damage: '1d10+3', range: 5, targetType: 'enemy', cooldown: 2, maxUses: 0, magical: true, description: 'Aspire la force vitale de la cible' },
        { id: 'necro-disengage', name: 'Repli', effect: 'disengage', targetType: 'self', cooldown: 0, maxUses: 0, description: 'Se désengage' }
      ],
      bonusActions: [
        { id: 'necro-shield', name: 'Bouclier d\'os', effect: 'shield', absorption: 10, targetType: 'self', cooldown: 3, maxUses: 0, description: 'Bouclier absorbant 10 dégâts' }
      ],
      reactions: []
    }
  },

  specter: {
    name: 'Spectre',
    emoji: '👻',
    hp: 24, ac: 14, attackBonus: 5, damageDice: '1d8+3',
    movement: 3, range: 1,
    aiProfile: 'voleur',
    abilities: {
      actions: [
        { id: 'specter-touch', name: 'Toucher spectral', damage: '1d8+3', range: 1, targetType: 'enemy', cooldown: 0, maxUses: 0, magical: true, description: 'Toucher glacial qui draine l\'énergie' },
        { id: 'specter-disengage', name: 'Passe-muraille', effect: 'disengage', targetType: 'self', cooldown: 0, maxUses: 0, description: 'Traverse les obstacles' }
      ],
      bonusActions: [
        { id: 'specter-fade', name: 'Évanescence', effect: 'dodge', targetType: 'self', cooldown: 2, maxUses: 0, description: 'Devient semi-intangible' },
        { id: 'specter-vanish', name: 'Disparition', effect: 'advantage', targetType: 'self', cooldown: 0, maxUses: 2, description: 'Disparaît et réapparaît — avantage' }
      ],
      reactions: [
        { id: 'specter-reflexe', name: 'Esquive réflexe', trigger: 'onDamage', cooldown: 0, maxUses: 2, description: 'Réduit les dégâts de 50%' }
      ]
    }
  },

  minotaur: {
    name: 'Minotaure',
    bossPhases: [
      { threshold: 0.5, effect: 'charge', chargeEveryNTurns: 2, chargeDamage: '2d8+4', chargeRange: 3 }
    ],
    emoji: '🐂',
    hp: 58, ac: 16, attackBonus: 6, damageDice: '2d10+4',
    movement: 3, range: 1,
    aiProfile: 'guerrier',
    abilities: {
      actions: [
        { id: 'mino-axe', name: 'Grande hache', damage: '2d10+4', range: 1, targetType: 'enemy', cooldown: 0, maxUses: 0, description: 'Frappe dévastatrice à la hache' },
        { id: 'mino-charge', name: 'Charge', damage: '2d8+4', range: 1, targetType: 'enemy', cooldown: 3, maxUses: 0, pushOnHit: true, pushDistance: 2, description: 'Charge et repousse la cible de 2 cases' },
        { id: 'mino-dodge', name: 'Esquive', effect: 'dodge', targetType: 'self', cooldown: 0, maxUses: 0, description: 'Esquive' }
      ],
      bonusActions: [
        { id: 'mino-posture', name: 'Posture de combat', effect: 'defensePosture', acBonus: 2, targetType: 'self', cooldown: 2, maxUses: 0, description: '+2 CA jusqu\'au prochain tour' },
        { id: 'mino-second', name: 'Coup de corne', damage: '2d10', range: 1, targetType: 'enemy', cooldown: 0, maxUses: 1, description: 'Encorne la cible' }
      ],
      reactions: [
        { id: 'mino-ao', name: 'Attaque d\'opportunité', trigger: 'enemyLeaves', damage: '2d10+4', range: 1, targetType: 'enemy', cooldown: 0, maxUses: 0 }
      ]
    }
  },

  // ============ ACTE 3 — Pic du dragon ============

  orcBerserker: {
    name: 'Orque',
    emoji: '💪',
    hp: 40, ac: 13, attackBonus: 6, damageDice: '1d12+4',
    movement: 3, range: 1,
    aiProfile: 'guerrier',
    initialStatuses: [{ type: 'rage', duration: 99 }],
    abilities: {
      actions: [
        { id: 'orc-axe', name: 'Grande hache', damage: '1d12+4', range: 1, targetType: 'enemy', cooldown: 0, maxUses: 0, description: 'Frappe brutale' },
        { id: 'orc-cleave', name: 'Frappe sauvage', damage: '2d12+4', range: 1, targetType: 'enemy', cooldown: 3, maxUses: 0, description: 'Coup dévastateur plein de rage' },
        { id: 'orc-dodge', name: 'Esquive', effect: 'dodge', targetType: 'self', cooldown: 0, maxUses: 0, description: 'Esquive' }
      ],
      bonusActions: [],
      reactions: [
        { id: 'orc-ao', name: 'Attaque d\'opportunité', trigger: 'enemyLeaves', damage: '1d12+4', range: 1, targetType: 'enemy', cooldown: 0, maxUses: 0 }
      ]
    }
  },

  darkMage: {
    name: 'Mage noir',
    emoji: '🔮',
    hp: 32, ac: 15, attackBonus: 6, damageDice: '2d6+3',
    movement: 2, range: 6,
    aiProfile: 'mage',
    abilities: {
      actions: [
        { id: 'dmage-bolt', name: 'Sort obscur', damage: '2d6+3', range: 6, targetType: 'enemy', cooldown: 0, maxUses: 0, magical: true, description: 'Rayon d\'énergie sombre' },
        { id: 'dmage-blast', name: 'Rayon affaiblissant', damage: '1d8+3', range: 6, targetType: 'enemy', cooldown: 3, maxUses: 0, magical: true, effect: 'stun', stunDuration: 1, description: 'Étourdit la cible 1 tour' },
        { id: 'dmage-disengage', name: 'Téléportation', effect: 'disengage', targetType: 'self', cooldown: 0, maxUses: 0, description: 'Se téléporte pour fuir' }
      ],
      bonusActions: [
        { id: 'dmage-shield', name: 'Bouclier magique', effect: 'shield', absorption: 12, targetType: 'self', cooldown: 3, maxUses: 0, description: 'Bouclier absorbant 12 dégâts' }
      ],
      reactions: []
    }
  },

  deathKnight: {
    name: 'Chevalier mort',
    emoji: '⚔️',
    hp: 48, ac: 18, attackBonus: 6, damageDice: '1d10+4',
    movement: 2, range: 1,
    aiProfile: 'guerrier',
    abilities: {
      actions: [
        { id: 'dk-sword', name: 'Épée maudite', damage: '1d10+4', range: 1, targetType: 'enemy', cooldown: 0, maxUses: 0, description: 'Frappe avec une lame imbibée de ténèbres' },
        { id: 'dk-smash', name: 'Frappe écrasante', damage: '2d10+4', range: 1, targetType: 'enemy', cooldown: 2, maxUses: 0, description: 'Coup dévastateur' },
        { id: 'dk-dodge', name: 'Garde', effect: 'dodge', targetType: 'self', cooldown: 0, maxUses: 0, description: 'Se met en garde' }
      ],
      bonusActions: [
        { id: 'dk-posture', name: 'Posture défensive', effect: 'defensePosture', acBonus: 2, targetType: 'self', cooldown: 2, maxUses: 0, description: '+2 CA' }
      ],
      reactions: [
        { id: 'dk-ao', name: 'Attaque d\'opportunité', trigger: 'enemyLeaves', damage: '1d10+4', range: 1, targetType: 'enemy', cooldown: 0, maxUses: 0 }
      ]
    }
  },

  basilisk: {
    name: 'Basilic',
    emoji: '🐍',
    hp: 38, ac: 15, attackBonus: 5, damageDice: '1d10+3',
    movement: 2, range: 1,
    aiProfile: 'rodeur',
    abilities: {
      actions: [
        { id: 'basi-bite', name: 'Morsure', damage: '1d10+3', range: 1, targetType: 'enemy', cooldown: 0, maxUses: 0, description: 'Morsure venimeuse' },
        { id: 'basi-gaze', name: 'Regard pétrifiant', damage: '1d6', range: 3, targetType: 'enemy', cooldown: 3, maxUses: 0, magical: true, effect: 'stun', stunDuration: 1, description: 'Pétrifie la cible pendant 1 tour' }
      ],
      bonusActions: [
        { id: 'basi-poison', name: 'Venin', effect: 'poison', targetType: 'enemy', range: 1, cooldown: 3, maxUses: 2, poisonDamageMin: 3, poisonDamageMax: 5, poisonDuration: 3, description: 'Empoisonne la cible' }
      ],
      reactions: [
        { id: 'basi-ao', name: 'Attaque d\'opportunité', trigger: 'enemyLeaves', damage: '1d10+3', range: 1, targetType: 'enemy', cooldown: 0, maxUses: 0 }
      ]
    }
  },

  youngDragon: {
    name: 'Jeune Dragon',
    emoji: '🐉',
    bossPhases: [
      { threshold: 0.5, effect: 'fly', flyDuration: 1, landingCreatesTerrain: 'fire' }
    ],
    hp: 65, ac: 17, attackBonus: 7, damageDice: '2d10+5',
    movement: 3, range: 1,
    aiProfile: 'guerrier',
    abilities: {
      actions: [
        { id: 'dragon-claw', name: 'Griffes', damage: '2d10+5', range: 1, targetType: 'enemy', cooldown: 0, maxUses: 0, description: 'Lacère avec ses griffes' },
        { id: 'dragon-breath', name: 'Souffle de feu', damage: '2d12+5', range: 4, targetType: 'enemy', cooldown: 3, maxUses: 0, magical: true, description: 'Crache un torrent de flammes' },
        { id: 'dragon-bite', name: 'Morsure', damage: '2d10+7', range: 1, targetType: 'enemy', cooldown: 2, maxUses: 0, description: 'Morsure dévastatrice' }
      ],
      bonusActions: [
        { id: 'dragon-wings', name: 'Battement d\'ailes', effect: 'extraMovement', extraMove: 2, targetType: 'self', cooldown: 2, maxUses: 0, description: '+2 cases de mouvement ce tour' },
        { id: 'dragon-second', name: 'Queue', damage: '2d8+5', range: 1, targetType: 'enemy', cooldown: 0, maxUses: 1, description: 'Coup de queue' }
      ],
      reactions: [
        { id: 'dragon-ao', name: 'Attaque d\'opportunité', trigger: 'enemyLeaves', damage: '2d10+5', range: 1, targetType: 'enemy', cooldown: 0, maxUses: 0 }
      ]
    }
  }
}
