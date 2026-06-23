import { getDistance, getAdjacentEnemies, getAccessibleCells, getCombatDistance } from './movement.js'
import { hasStatus } from './combat.js'
import { TERRAIN_TYPES } from './terrain.js'

function getTargetPriority(enemy) {
  switch (enemy.classId) {
    case 'clerc': return 1.8
    case 'mage': return 1.6
    case 'rodeur': return 1.3
    case 'voleur': return 1.2
    case 'guerrier': return 0.8
    default: return 1.0
  }
}

function canKill(attacker, enemy, ability) {
  if (!ability.damage) return false
  const match = ability.damage.match(/(\d+)d(\d+)(?:\+(\d+))?/)
  if (!match) return false
  const avgDmg = parseInt(match[1]) * (parseInt(match[2]) + 1) / 2 + (parseInt(match[3]) || 0)
  return avgDmg >= enemy.hp
}

export function decideAction(character, characters, getAbilityState, terrain = {}) {
  const enemies = Object.values(characters).filter(c => c.team !== character.team && !c.isDead)
  const allies = Object.values(characters).filter(c => c.team === character.team && !c.isDead && c.id !== character.id)

  if (enemies.length === 0) return { movement: null, action: null, actionTarget: null, bonusAction: null, bonusActionTarget: null }

  const decision = { movement: null, action: null, actionTarget: null, bonusAction: null, bonusActionTarget: null }

  const adjEnemiesNow = getAdjacentEnemies(character.position, characters, character.team)
  const inMelee = adjEnemiesNow.length > 0

  decideBonusAction(character, characters, allies, enemies, decision, getAbilityState)

  const hasFreeDisengage = decision.bonusAction?.effect === 'disengage' || hasStatus(character, 'disengaged')

  let bestEval = evaluatePosition(character, character.position, enemies, allies, characters, getAbilityState, terrain)
  let bestPos = null

  const accessible = getAccessibleCells(character.position, character.movement, characters, character.id, terrain)

  for (const cell of accessible) {
    const eval_ = evaluatePosition(character, cell, enemies, allies, characters, getAbilityState, terrain)

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

  if (!decision.action && !character.actionUsed) {
    const dodgeAbility = findAbilityByEffect(character, 'dodge', 'actions', getAbilityState)
    if (dodgeAbility) {
      decision.action = dodgeAbility
    }
  }

  if (inMelee && bestPos && !hasFreeDisengage) {
    const stayEval = evaluatePosition(character, character.position, enemies, allies, characters, getAbilityState, terrain)
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

function evaluatePosition(character, position, enemies, allies, characters, getAbilityState, terrain = {}) {
  let score = 0
  let bestAction = null
  let bestTarget = null
  let bestActionScore = 0

  const classId = character.classId

  const actions = character.classData.abilities.actions.filter(a => {
    if (a.effect === 'disengage' || a.effect === 'dodge') return false
    const state = getAbilityState(character.id, a)
    return state.available
  })

  for (const ability of actions) {
    const range = ability.range || character.range || 1

    if (ability.heal) {
      const healTargets = ability.targetType === 'ally' ? [...allies, character] : [character]
      for (const target of healTargets) {
        if (target.isDead) continue
        const dist = range <= 1 ? getCombatDistance(position, target.position) : getDistance(position, target.position)
        if (dist > range) continue
        const missingRatio = 1 - target.hp / target.maxHp
        if (missingRatio < 0.15) continue
        let healScore = missingRatio * 25
        if (target.hp / target.maxHp < 0.3) healScore += 12
        if (healScore > bestActionScore) {
          bestActionScore = healScore
          bestAction = ability
          bestTarget = target
        }
      }
      continue
    }

    if (ability.effect === 'purify') {
      for (const ally of [...allies, character]) {
        if (ally.isDead) continue
        const dist = getCombatDistance(position, ally.position)
        if (dist > (ability.range || 1)) continue
        if (!ally.statuses.some(s => ['poison', 'cursedMark', 'antiHeal'].includes(s.type))) continue
        if (14 > bestActionScore) { bestActionScore = 14; bestAction = ability; bestTarget = ally }
      }
      continue
    }

    if (ability.effect === 'giveAdvantage') {
      for (const ally of allies) {
        if (ally.isDead) continue
        const dist = getCombatDistance(position, ally.position)
        if (dist > (ability.range || 1)) continue
        if (getAdjacentEnemies(ally.position, characters, ally.team).length === 0) continue
        if (6 > bestActionScore) { bestActionScore = 6; bestAction = ability; bestTarget = ally }
      }
      continue
    }

    if (ability.effect === 'push' || ability.effect === 'hunted') {
      for (const enemy of enemies) {
        const dist = range <= 1 ? getCombatDistance(position, enemy.position) : getDistance(position, enemy.position)
        if (dist > range) continue
        const effectScore = ability.effect === 'push' ? 8 : 10
        if (effectScore > bestActionScore) { bestActionScore = effectScore; bestAction = ability; bestTarget = enemy }
      }
      continue
    }

    if (!ability.damage && ability.id !== 'coup-fatal') continue

    for (const enemy of enemies) {
      const dist = range <= 1 ? getCombatDistance(position, enemy.position) : getDistance(position, enemy.position)
      if (dist > range) continue
      if (ability.id === 'coup-fatal' && enemy.hp / enemy.maxHp >= (ability.executeThreshold || 0.25)) continue

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
        if (adjAlliesOfEnemy.length > 0 || hasStatus(character, 'advantage')) attackScore += 7
      }
      if (ability.requiresFlank && ability.bonusDamage) attackScore += 7

      attackScore *= getTargetPriority(enemy)

      const hpRatio = enemy.hp / enemy.maxHp
      attackScore += (1 - hpRatio) * 12

      if (canKill(character, enemy, ability)) attackScore += 20

      if (ability.id === 'coup-fatal') attackScore += 30
      if (ability.effect === 'stun') attackScore += 8
      if (ability.pushOnHit) attackScore += 4

      if (attackScore > bestActionScore) {
        bestActionScore = attackScore
        bestAction = ability
        bestTarget = enemy
      }
    }
  }

  score += bestActionScore * 2

  let minEnemyDist = Infinity
  let adjEnemyCount = 0
  for (const enemy of enemies) {
    const d = getCombatDistance(position, enemy.position)
    if (d < minEnemyDist) minEnemyDist = d
    if (d <= 1) adjEnemyCount++
  }

  score += Math.max(0, 10 - minEnemyDist) * 2

  const highPriorityTarget = enemies.reduce((best, e) => {
    const p = getTargetPriority(e)
    return p > (best?.p || 0) ? { target: e, p } : best
  }, null)

  if (highPriorityTarget) {
    const distToTarget = getCombatDistance(position, highPriorityTarget.target.position)
    score += Math.max(0, 8 - distToTarget) * highPriorityTarget.p
  }

  switch (classId) {
    case 'guerrier':
      score += adjEnemyCount * 5
      for (const ally of allies) {
        if (['mage', 'clerc', 'rodeur'].includes(ally.classId)) {
          for (const enemy of enemies) {
            if (getDistance(position, enemy.position) < getDistance(ally.position, enemy.position)) score += 2
          }
        }
      }
      break

    case 'mage':
      if (adjEnemyCount > 0) score -= 30
      score += Math.min(minEnemyDist, 5) * 5
      break

    case 'voleur':
      for (const enemy of enemies) {
        if (getCombatDistance(position, enemy.position) <= 1) {
          const adjAllies = allies.filter(a => getCombatDistance(a.position, enemy.position) <= 1)
          score += adjAllies.length > 0 ? 10 : 2
        }
      }
      break

    case 'rodeur':
      if (adjEnemyCount > 0) score -= 25
      if (minEnemyDist >= 3 && minEnemyDist <= 5) score += 12
      else if (minEnemyDist >= 2) score += 6
      score += Math.min(minEnemyDist, 4) * 3
      break

    case 'clerc':
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

  const posKey = `${position.x},${position.y}`
  const terrainCell = terrain[posKey]
  if (terrainCell) {
    if (terrainCell.type === TERRAIN_TYPES.HAZARD) score -= 20
    if (terrainCell.type === TERRAIN_TYPES.COVER && ['mage', 'rodeur', 'clerc'].includes(classId)) score += 5
  }

  return { score, action: bestAction, target: bestTarget }
}

function decideBonusAction(character, characters, allies, enemies, decision, getAbilityState) {
  const classId = character.classId
  const adjEnemies = getAdjacentEnemies(character.position, characters, character.team)

  if (classId === 'voleur') {
    if (adjEnemies.length > 0) {
      const retraite = findAbility(character, 'retraite-rapide', 'bonusActions', getAbilityState)
      if (retraite) { decision.bonusAction = retraite; return }
    }
    const disparaitre = findAbility(character, 'disparaitre', 'bonusActions', getAbilityState)
    if (disparaitre) { decision.bonusAction = disparaitre; return }

    const poisonTarget = enemies.find(e => !hasStatus(e, 'antiHeal') && getCombatDistance(character.position, e.position) <= 1)
    const poison = findAbility(character, 'poison-corrosif', 'bonusActions', getAbilityState)
    if (poisonTarget && poison) { decision.bonusAction = poison; decision.bonusActionTarget = poisonTarget; return }
  }

  if (classId === 'rodeur') {
    const poisonTarget = enemies.find(e => !hasStatus(e, 'poison') && getDistance(character.position, e.position) <= 5)
    const poison = findAbility(character, 'poison', 'bonusActions', getAbilityState)
    if (poisonTarget && poison) { decision.bonusAction = poison; decision.bonusActionTarget = poisonTarget; return }
    const markTarget = enemies.find(e => !hasStatus(e, 'cursedMark') && getDistance(character.position, e.position) <= 5)
    const mark = findAbility(character, 'marque-maudite', 'bonusActions', getAbilityState)
    if (markTarget && mark) { decision.bonusAction = mark; decision.bonusActionTarget = markTarget; return }
    if (adjEnemies.length > 0) {
      const couverture = findAbility(character, 'couverture', 'bonusActions', getAbilityState)
      if (couverture) { decision.bonusAction = couverture; return }
    }
  }

  if (classId === 'guerrier') {
    if (character.hp / character.maxHp < 0.4) {
      const secondSouffle = findAbility(character, 'second-souffle', 'bonusActions', getAbilityState)
      if (secondSouffle) { decision.bonusAction = secondSouffle; return }
    }
    if (adjEnemies.length >= 2) {
      const posture = findAbility(character, 'posture-defensive', 'bonusActions', getAbilityState)
      if (posture) { decision.bonusAction = posture; return }
    }
    if (adjEnemies.length > 0) {
      const seconde = findAbility(character, 'seconde-attaque', 'bonusActions', getAbilityState)
      if (seconde) { decision.bonusAction = seconde; decision.bonusActionTarget = adjEnemies[0]; return }
    }
  }

  if (classId === 'mage') {
    if (character.hp / character.maxHp < 0.5 && !hasStatus(character, 'shield')) {
      const bouclier = findAbility(character, 'bouclier-magique', 'bonusActions', getAbilityState)
      if (bouclier) { decision.bonusAction = bouclier; return }
    }
    if (adjEnemies.length > 0) {
      const pasDeMage = findAbility(character, 'pas-de-mage', 'bonusActions', getAbilityState)
      if (pasDeMage) { decision.bonusAction = pasDeMage; return }
    }
  }

  if (classId === 'clerc') {
    const hurtAlly = [...allies].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0]
    if (hurtAlly && hurtAlly.hp / hurtAlly.maxHp < 0.5) {
      const motGuerison = findAbility(character, 'mot-guerison', 'bonusActions', getAbilityState)
      if (motGuerison && getDistance(character.position, hurtAlly.position) <= motGuerison.range) {
        decision.bonusAction = motGuerison; decision.bonusActionTarget = hurtAlly; return
      }
    }
    const exposedAlly = allies.find(a => getAdjacentEnemies(a.position, characters, a.team).length > 0 && !hasStatus(a, 'faithShield'))
    if (exposedAlly) {
      const bouclierFoi = findAbility(character, 'bouclier-foi', 'bonusActions', getAbilityState)
      if (bouclierFoi && getDistance(character.position, exposedAlly.position) <= bouclierFoi.range) {
        decision.bonusAction = bouclierFoi; decision.bonusActionTarget = exposedAlly; return
      }
    }
  }

  decideGenericBonusAction(character, characters, allies, enemies, decision, getAbilityState)
}

function decideGenericBonusAction(character, characters, allies, enemies, decision, getAbilityState) {
  if (decision.bonusAction) return

  const bonusActions = character.classData.abilities.bonusActions || []
  const adjEnemies = getAdjacentEnemies(character.position, characters, character.team)

  for (const ability of bonusActions) {
    const state = getAbilityState(character.id, ability)
    if (!state.available) continue

    if (ability.effect === 'shield' && character.hp / character.maxHp < 0.6 && !hasStatus(character, 'shield')) {
      decision.bonusAction = ability; return
    }
    if (ability.effect === 'defensePosture' && adjEnemies.length >= 1) {
      decision.bonusAction = ability; return
    }
    if (ability.effect === 'extraMovement' && adjEnemies.length > 0) {
      decision.bonusAction = ability; return
    }
    if (ability.heal && character.hp / character.maxHp < 0.4) {
      decision.bonusAction = ability; return
    }
  }

  for (const ability of bonusActions) {
    const state = getAbilityState(character.id, ability)
    if (!state.available) continue

    if (ability.damage && adjEnemies.length > 0) {
      const target = adjEnemies.sort((a, b) => a.hp - b.hp)[0]
      decision.bonusAction = ability
      decision.bonusActionTarget = target
      return
    }

    if (ability.effect === 'advantage') {
      decision.bonusAction = ability; return
    }

    if (ability.effect === 'poison') {
      const target = enemies.find(e => !hasStatus(e, 'poison') && getDistance(character.position, e.position) <= (ability.range || 1))
      if (target) { decision.bonusAction = ability; decision.bonusActionTarget = target; return }
    }

    if (ability.effect === 'disengage' && adjEnemies.length > 0) {
      decision.bonusAction = ability; return
    }
    if (ability.effect === 'dodge' && adjEnemies.length > 0) {
      decision.bonusAction = ability; return
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
