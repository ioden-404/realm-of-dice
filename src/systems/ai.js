import { getDistance, getAdjacentEnemies, getAccessibleCells, getCombatDistance } from './movement.js'
import { hasStatus } from './combat.js'

export function decideAction(character, characters, getAbilityState) {
  const enemies = Object.values(characters).filter(c => c.team !== character.team && !c.isDead)
  const allies = Object.values(characters).filter(c => c.team === character.team && !c.isDead && c.id !== character.id)

  if (enemies.length === 0) return { movement: null, action: null, actionTarget: null, bonusAction: null, bonusActionTarget: null }

  const decision = { movement: null, action: null, actionTarget: null, bonusAction: null, bonusActionTarget: null }

  const adjEnemiesNow = getAdjacentEnemies(character.position, characters, character.team)
  const inMelee = adjEnemiesNow.length > 0

  // Bonus action en premier : certaines affectent le mouvement
  decideBonusAction(character, characters, allies, enemies, decision, getAbilityState)

  const hasFreeDisengage = decision.bonusAction?.effect === 'disengage' || hasStatus(character, 'disengaged')

  // Evaluer la position actuelle
  let bestEval = evaluatePosition(character, character.position, enemies, allies, characters, getAbilityState)
  let bestPos = null

  // Evaluer chaque case accessible
  const accessible = getAccessibleCells(character.position, character.movement, characters, character.id)

  for (const cell of accessible) {
    const eval_ = evaluatePosition(character, cell, enemies, allies, characters, getAbilityState)

    // Pénalité AO si on quitte la mêlée sans désengagement
    if (inMelee && !hasFreeDisengage) {
      eval_.score -= 15
    }

    if (eval_.score > bestEval.score) {
      bestEval = eval_
      bestPos = cell
    }
  }

  decision.movement = bestPos
  decision.action = bestEval.action
  decision.actionTarget = bestEval.target

  // Si rien de bon à faire avec l'action, tenter dodge
  if (!decision.action && !character.actionUsed) {
    const dodgeAbility = findAbilityByEffect(character, 'dodge', 'actions', getAbilityState)
    if (dodgeAbility) {
      decision.action = dodgeAbility
    }
  }

  // Si on est en mêlée, qu'on veut bouger, et qu'on n'a pas de désengagement gratuit,
  // il faut utiliser l'action pour se désengager (si ça vaut le coup)
  if (inMelee && bestPos && !hasFreeDisengage) {
    const stayEval = evaluatePosition(character, character.position, enemies, allies, characters, getAbilityState)
    const moveGain = bestEval.score + 15 - stayEval.score

    if (moveGain > 10) {
      const disengage = findAbilityByEffect(character, 'disengage', 'actions', getAbilityState)
      if (disengage) {
        decision.action = disengage
        decision.actionTarget = null
      } else {
        decision.movement = null
        decision.action = stayEval.action
        decision.actionTarget = stayEval.target
      }
    } else {
      decision.movement = null
      decision.action = stayEval.action
      decision.actionTarget = stayEval.target
    }
  }

  return decision
}

function evaluatePosition(character, position, enemies, allies, characters, getAbilityState) {
  let score = 0
  let bestAction = null
  let bestTarget = null
  let bestActionScore = 0

  const classId = character.classId

  // --- Potentiel d'action depuis cette position ---
  const actions = character.classData.abilities.actions.filter(a => {
    if (a.effect === 'disengage' || a.effect === 'dodge') return false
    const state = getAbilityState(character.id, a)
    return state.available
  })

  for (const ability of actions) {
    const range = ability.range || character.range || 1

    // Soins (Clerc)
    if (ability.heal) {
      const healTargets = ability.targetType === 'ally' ? [...allies] : []
      if (ability.targetType === 'ally') healTargets.push(character)

      for (const target of healTargets) {
        if (target.isDead) continue
        const dist = range <= 1 ? getCombatDistance(position, target.position) : getDistance(position, target.position)
        if (dist > range) continue
        const missingHp = 1 - target.hp / target.maxHp
        if (missingHp < 0.15) continue
        const healScore = missingHp * 22
        if (target.hp / target.maxHp < 0.3) healScore + 10

        if (healScore > bestActionScore) {
          bestActionScore = healScore
          bestAction = ability
          bestTarget = target
        }
      }
      continue
    }

    // Purification
    if (ability.effect === 'purify') {
      for (const ally of [...allies, character]) {
        if (ally.isDead) continue
        const dist = getCombatDistance(position, ally.position)
        if (dist > (ability.range || 1)) continue
        const hasBad = ally.statuses.some(s => ['poison', 'cursedMark', 'antiHeal'].includes(s.type))
        if (!hasBad) continue
        const purifyScore = 14
        if (purifyScore > bestActionScore) {
          bestActionScore = purifyScore
          bestAction = ability
          bestTarget = ally
        }
      }
      continue
    }

    // Aider
    if (ability.effect === 'giveAdvantage') {
      for (const ally of allies) {
        if (ally.isDead) continue
        const dist = getCombatDistance(position, ally.position)
        if (dist > (ability.range || 1)) continue
        const adjEnemiesOfAlly = getAdjacentEnemies(ally.position, characters, ally.team)
        if (adjEnemiesOfAlly.length === 0) continue
        const helpScore = 6
        if (helpScore > bestActionScore) {
          bestActionScore = helpScore
          bestAction = ability
          bestTarget = ally
        }
      }
      continue
    }

    // Effets spéciaux (télékinésie, marque de chasse, etc.)
    if (ability.effect === 'push' || ability.effect === 'hunted') {
      for (const enemy of enemies) {
        const dist = range <= 1 ? getCombatDistance(position, enemy.position) : getDistance(position, enemy.position)
        if (dist > range) continue
        const effectScore = ability.effect === 'push' ? 8 : 10
        if (effectScore > bestActionScore) {
          bestActionScore = effectScore
          bestAction = ability
          bestTarget = enemy
        }
      }
      continue
    }

    // Attaques
    if (!ability.damage && ability.id !== 'coup-fatal') continue

    for (const enemy of enemies) {
      const dist = range <= 1 ? getCombatDistance(position, enemy.position) : getDistance(position, enemy.position)
      if (dist > range) continue
      if (ability.id === 'coup-fatal' && enemy.hp / enemy.maxHp >= 0.25) continue

      let attackScore = 0

      if (ability.damage) {
        const match = ability.damage.match(/(\d+)d(\d+)(?:\+(\d+))?/)
        if (match) {
          attackScore += parseInt(match[1]) * (parseInt(match[2]) + 1) / 2 + (parseInt(match[3]) || 0)
        }
      }

      if (ability.hits) attackScore *= ability.hits * 0.85

      if (ability.sneakAttack && ability.bonusDamage) {
        const adjAlliesOfEnemy = allies.filter(a => getCombatDistance(a.position, enemy.position) <= 1)
        if (adjAlliesOfEnemy.length > 0 || hasStatus(character, 'advantage')) {
          attackScore += 7
        }
      }

      if (ability.requiresFlank && ability.bonusDamage) attackScore += 7

      attackScore += (1 - enemy.hp / enemy.maxHp) * 10
      if (ability.id === 'coup-fatal') attackScore += 30
      if (ability.effect === 'stun') attackScore += 6

      if (attackScore > bestActionScore) {
        bestActionScore = attackScore
        bestAction = ability
        bestTarget = enemy
      }
    }
  }

  score += bestActionScore * 2

  // --- Évaluation stratégique de la position ---
  let minEnemyDist = Infinity
  let adjEnemyCount = 0
  for (const enemy of enemies) {
    const d = getCombatDistance(position, enemy.position)
    if (d < minEnemyDist) minEnemyDist = d
    if (d <= 1) adjEnemyCount++
  }

  switch (classId) {
    case 'guerrier':
      // Tank : veut être au contact, protéger les alliés fragiles
      score += adjEnemyCount * 5
      for (const ally of allies) {
        if (ally.classId === 'mage' || ally.classId === 'clerc' || ally.classId === 'rodeur') {
          for (const enemy of enemies) {
            const allyToEnemy = getDistance(ally.position, enemy.position)
            const meToEnemy = getDistance(position, enemy.position)
            if (meToEnemy < allyToEnemy) score += 2
          }
        }
      }
      break

    case 'mage':
      // Canon de verre : fuir la mêlée, maximiser la distance
      if (adjEnemyCount > 0) score -= 30
      score += Math.min(minEnemyDist, 5) * 5
      break

    case 'voleur':
      // Assassin : chercher les positions de flanc
      for (const enemy of enemies) {
        const d = getCombatDistance(position, enemy.position)
        if (d <= 1) {
          const adjAlliesOfEnemy = allies.filter(a => getCombatDistance(a.position, enemy.position) <= 1)
          if (adjAlliesOfEnemy.length > 0) {
            score += 10
          } else {
            score += 2
          }
        }
      }
      break

    case 'rodeur':
      // Tireur d'élite : rester à portée optimale (3-5), fuir la mêlée
      if (adjEnemyCount > 0) score -= 25
      if (minEnemyDist >= 3 && minEnemyDist <= 5) score += 12
      else if (minEnemyDist >= 2) score += 6
      score += Math.min(minEnemyDist, 4) * 3
      break

    case 'clerc':
      // Soutien : rester près des alliés blessés, loin des ennemis
      for (const ally of allies) {
        const allyDist = getCombatDistance(position, ally.position)
        const hpRatio = ally.hp / ally.maxHp
        if (hpRatio < 0.7) {
          if (allyDist <= 1) score += (1 - hpRatio) * 15
          else if (allyDist <= 3) score += (1 - hpRatio) * 8
          else score += (1 - hpRatio) * 3
        }
      }
      if (adjEnemyCount > 0) score -= 15
      score += Math.min(minEnemyDist, 3) * 3
      break
  }

  return { score, action: bestAction, target: bestTarget }
}

function decideBonusAction(character, characters, allies, enemies, decision, getAbilityState) {
  const classId = character.classId
  const adjEnemies = getAdjacentEnemies(character.position, characters, character.team)

  if (classId === 'voleur') {
    // Retraite rapide si en mêlée (pour pouvoir fuir et attaquer)
    if (adjEnemies.length > 0) {
      const retraite = findAbility(character, 'retraite-rapide', 'bonusActions', getAbilityState)
      if (retraite) {
        decision.bonusAction = retraite
        return
      }
      const disparaitre = findAbility(character, 'disparaitre', 'bonusActions', getAbilityState)
      if (disparaitre) {
        decision.bonusAction = disparaitre
        return
      }
    } else {
      const disparaitre = findAbility(character, 'disparaitre', 'bonusActions', getAbilityState)
      if (disparaitre) {
        decision.bonusAction = disparaitre
        return
      }
    }

    const poisonTarget = enemies.find(e => !hasStatus(e, 'antiHeal') && getCombatDistance(character.position, e.position) <= 1)
    const poison = findAbility(character, 'poison-corrosif', 'bonusActions', getAbilityState)
    if (poisonTarget && poison) {
      decision.bonusAction = poison
      decision.bonusActionTarget = poisonTarget
      return
    }
  }

  if (classId === 'rodeur') {
    const poisonTarget = enemies.find(e => !hasStatus(e, 'poison') && getDistance(character.position, e.position) <= 5)
    const poison = findAbility(character, 'poison', 'bonusActions', getAbilityState)
    if (poisonTarget && poison) {
      decision.bonusAction = poison
      decision.bonusActionTarget = poisonTarget
      return
    }

    const markTarget = enemies.find(e => !hasStatus(e, 'cursedMark') && getDistance(character.position, e.position) <= 5)
    const mark = findAbility(character, 'marque-maudite', 'bonusActions', getAbilityState)
    if (markTarget && mark) {
      decision.bonusAction = mark
      decision.bonusActionTarget = markTarget
      return
    }

    if (adjEnemies.length > 0) {
      const couverture = findAbility(character, 'couverture', 'bonusActions', getAbilityState)
      if (couverture) {
        decision.bonusAction = couverture
        return
      }
    }
  }

  if (classId === 'guerrier') {
    if (character.hp / character.maxHp < 0.4) {
      const secondSouffle = findAbility(character, 'second-souffle', 'bonusActions', getAbilityState)
      if (secondSouffle) {
        decision.bonusAction = secondSouffle
        return
      }
    }

    if (adjEnemies.length >= 2) {
      const posture = findAbility(character, 'posture-defensive', 'bonusActions', getAbilityState)
      if (posture) {
        decision.bonusAction = posture
        return
      }
    }

    // Seconde attaque si adjacent à un ennemi
    if (adjEnemies.length > 0) {
      const seconde = findAbility(character, 'seconde-attaque', 'bonusActions', getAbilityState)
      if (seconde) {
        decision.bonusAction = seconde
        decision.bonusActionTarget = adjEnemies[0]
        return
      }
    }
  }

  if (classId === 'mage') {
    if (character.hp / character.maxHp < 0.5 && !hasStatus(character, 'shield')) {
      const bouclier = findAbility(character, 'bouclier-magique', 'bonusActions', getAbilityState)
      if (bouclier) {
        decision.bonusAction = bouclier
        return
      }
    }

    const pasDeMage = findAbility(character, 'pas-de-mage', 'bonusActions', getAbilityState)
    if (pasDeMage && adjEnemies.length > 0) {
      decision.bonusAction = pasDeMage
      return
    }
  }

  if (classId === 'clerc') {
    // Mot de guérison à distance si allié blessé
    const hurtAlly = [...allies].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0]
    if (hurtAlly && hurtAlly.hp / hurtAlly.maxHp < 0.5) {
      const motGuerison = findAbility(character, 'mot-guerison', 'bonusActions', getAbilityState)
      if (motGuerison && getDistance(character.position, hurtAlly.position) <= motGuerison.range) {
        decision.bonusAction = motGuerison
        decision.bonusActionTarget = hurtAlly
        return
      }
    }

    // Bouclier de foi sur allié exposé
    const exposedAlly = allies.find(a => {
      const adjE = getAdjacentEnemies(a.position, characters, a.team)
      return adjE.length > 0 && !hasStatus(a, 'faithShield')
    })
    if (exposedAlly) {
      const bouclierFoi = findAbility(character, 'bouclier-foi', 'bonusActions', getAbilityState)
      if (bouclierFoi && getDistance(character.position, exposedAlly.position) <= bouclierFoi.range) {
        decision.bonusAction = bouclierFoi
        decision.bonusActionTarget = exposedAlly
        return
      }
    }
  }
}

function findAbility(character, abilityId, category, getAbilityState) {
  const abilities = character.classData.abilities[category] || []
  const ability = abilities.find(a => a.id === abilityId)
  if (!ability) return null
  const state = getAbilityState(character.id, ability)
  if (!state.available) return null
  return ability
}

function findAbilityByEffect(character, effect, category, getAbilityState) {
  const abilities = character.classData.abilities[category] || []
  for (const ability of abilities) {
    if (ability.effect === effect) {
      const state = getAbilityState(character.id, ability)
      if (state.available) return ability
    }
  }
  return null
}
