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

function estimateAODamage(adjEnemies) {
  let total = 0
  for (const enemy of adjEnemies) {
    if (enemy.reactionUsed) continue
    const ao = enemy.classData?.abilities?.reactions?.find(r => r.trigger === 'enemyLeaves')
    if (!ao?.damage) continue
    const match = ao.damage.match(/(\d+)d(\d+)(?:\+(\d+))?/)
    if (match) {
      total += (parseInt(match[1]) * (parseInt(match[2]) + 1) / 2 + (parseInt(match[3]) || 0)) * 0.6
    }
  }
  return Math.round(total)
}

function assessBattlefield(allies, enemies, difficulty) {
  if (difficulty < 2) return { strategy: 'BASIC', focusTarget: null }

  const enemyHealer = enemies.find(c => c.classId === 'clerc')
  const healerAlive = enemyHealer && enemyHealer.hp > 0
  const healerHealthy = healerAlive && enemyHealer.hp > enemyHealer.maxHp * 0.25

  const allyHpRatio = allies.reduce((s, c) => s + c.hp, 0) / Math.max(1, allies.reduce((s, c) => s + c.maxHp, 0))
  const enemyHpRatio = enemies.reduce((s, c) => s + c.hp, 0) / Math.max(1, enemies.reduce((s, c) => s + c.maxHp, 0))

  const almostDead = enemies.filter(e => e.hp / e.maxHp < 0.25)

  let strategy = 'AGGRO'
  let focusTarget = null

  if (almostDead.length > 0) {
    strategy = 'FINISH'
    focusTarget = almostDead.sort((a, b) => a.hp - b.hp)[0]?.id
  } else if (healerHealthy && enemies.length >= 2 && enemyHpRatio > 0.4) {
    strategy = 'FOCUS_HEALER'
    focusTarget = enemyHealer.id
  } else if (allyHpRatio < 0.3 && allies.length <= 2) {
    strategy = 'DESPERATE'
    focusTarget = enemies.sort((a, b) => a.hp - b.hp)[0]?.id
  } else if (enemyHpRatio < 0.35) {
    strategy = 'OVERWHELM'
    focusTarget = enemies.sort((a, b) => a.hp - b.hp)[0]?.id
  } else {
    focusTarget = enemies.sort((a, b) => {
      const aScore = getTargetPriority(a) * (1 + (1 - a.hp / a.maxHp))
      const bScore = getTargetPriority(b) * (1 + (1 - b.hp / b.maxHp))
      return bScore - aScore
    })[0]?.id
  }

  return { strategy, focusTarget }
}

export function decideAction(character, characters, getAbilityState, terrain = {}, difficulty = 2) {
  const enemies = Object.values(characters).filter(c => c.team !== character.team && !c.isDead)
  const allies = Object.values(characters).filter(c => c.team === character.team && !c.isDead && c.id !== character.id)

  if (enemies.length === 0) return { movement: null, action: null, actionTarget: null, bonusAction: null, bonusActionTarget: null }

  const battlePlan = assessBattlefield([character, ...allies], enemies, difficulty)

  const decision = { movement: null, action: null, actionTarget: null, bonusAction: null, bonusActionTarget: null }

  const classId = character.classId
  const adjEnemiesNow = getAdjacentEnemies(character.position, characters, character.team)
  const inMelee = adjEnemiesNow.length > 0

  decideBonusAction(character, characters, allies, enemies, decision, getAbilityState)

  const hasFreeDisengage = decision.bonusAction?.effect === 'disengage' || hasStatus(character, 'disengaged')

  const stayEval = evaluatePosition(character, character.position, enemies, allies, characters, getAbilityState, terrain, battlePlan, difficulty)
  let best = { score: stayEval.score, action: stayEval.action, target: stayEval.target, movement: null }

  const aoDmg = inMelee && !hasFreeDisengage ? estimateAODamage(adjEnemiesNow) : 0
  const wouldDieFromAO = aoDmg >= character.hp

  const accessible = getAccessibleCells(character.position, character.movement, characters, character.id, terrain)
  const isMeleeClass = classId === 'guerrier' || classId === 'voleur'

  for (const cell of accessible) {
    const eval_ = evaluatePosition(character, cell, enemies, allies, characters, getAbilityState, terrain, battlePlan, difficulty)

    let moveCost = 0
    if (inMelee && !hasFreeDisengage) {
      if (wouldDieFromAO) continue
      moveCost = (aoDmg / character.maxHp) * 50
    }

    const netScore = eval_.score - moveCost
    if (netScore > best.score) {
      best = { score: netScore, action: eval_.action, target: eval_.target, movement: cell, rawScore: eval_.score, moveCost }
    }
  }

  if (best.movement && inMelee && !hasFreeDisengage && best.moveCost > 0) {
    const disengage = findAbilityByEffect(character, 'disengage', 'actions', getAbilityState)
    if (disengage) {
      const moveGainWithoutAO = best.rawScore - stayEval.score
      const stayActionValue = stayEval.action?.damage ? 8 : 0
      if (moveGainWithoutAO > stayActionValue) {
        best.action = disengage
        best.target = null
      }
    } else if (!isMeleeClass && best.moveCost > 15) {
      best = { score: stayEval.score, action: stayEval.action, target: stayEval.target, movement: null }
    }
  }

  decision.movement = best.movement
  decision.action = best.action
  decision.actionTarget = best.target

  if (!decision.action && !character.actionUsed) {
    const dodgeAbility = findAbilityByEffect(character, 'dodge', 'actions', getAbilityState)
    if (dodgeAbility) {
      decision.action = dodgeAbility
      if (!decision.movement) {
        let bestMoveScore = -Infinity
        let bestMovePos = null
        for (const cell of accessible) {
          const eval_ = evaluatePosition(character, cell, enemies, allies, characters, getAbilityState, terrain, battlePlan, difficulty)
          if (eval_.score > bestMoveScore) {
            bestMoveScore = eval_.score
            bestMovePos = cell
          }
        }
        if (bestMovePos && bestMoveScore > stayEval.score) {
          decision.movement = bestMovePos
        }
      }
    }
  }

  return decision
}

function evaluatePosition(character, position, enemies, allies, characters, getAbilityState, terrain, battlePlan, difficulty) {
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
        if (healScore > bestActionScore) { bestActionScore = healScore; bestAction = ability; bestTarget = target }
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
        let effectScore = ability.effect === 'push' ? 8 : 10
        if (difficulty >= 3 && battlePlan.focusTarget === enemy.id) effectScore += 5
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
        if (match) attackScore += parseInt(match[1]) * (parseInt(match[2]) + 1) / 2 + (parseInt(match[3]) || 0)
      }

      if (ability.hits) attackScore *= ability.hits * 0.85
      if (ability.sneakAttack && ability.bonusDamage) {
        const adjAllies = allies.filter(a => getCombatDistance(a.position, enemy.position) <= 1)
        if (adjAllies.length > 0 || hasStatus(character, 'advantage')) attackScore += 7
      }
      if (ability.requiresFlank && ability.bonusDamage) attackScore += 7

      attackScore *= getTargetPriority(enemy)

      const hpRatio = enemy.hp / enemy.maxHp
      attackScore += (1 - hpRatio) * 12

      if (canKill(character, enemy, ability)) attackScore += 25

      if (dist <= 1) attackScore += 4

      if (difficulty >= 2 && battlePlan.focusTarget === enemy.id) {
        attackScore *= difficulty >= 3 ? 1.6 : 1.3
      }

      if (difficulty >= 3 && ability.effect === 'stun' && battlePlan.focusTarget === enemy.id) {
        attackScore += 15
      }

      const guardsNearTarget = enemies.filter(e =>
        e.id !== enemy.id && e.classId === 'guerrier' &&
        getCombatDistance(e.position, enemy.position) <= 1 &&
        getCombatDistance(position, e.position) < dist
      )
      if (guardsNearTarget.length > 0) {
        attackScore *= difficulty >= 3 ? 0.7 : 0.55
      }

      if (ability.id === 'coup-fatal') attackScore += 30
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
  let danger = 0
  for (const enemy of enemies) {
    const d = getCombatDistance(position, enemy.position)
    if (d < minEnemyDist) minEnemyDist = d
    if (d <= 1) {
      adjEnemyCount++
      danger += 5
      if (enemy.classId === 'guerrier') danger += 5
      if (enemy.classId === 'voleur') danger += 2
    }
  }

  const isMelee = classId === 'guerrier' || classId === 'voleur'
  score -= danger * (isMelee ? 0.3 : 0.8)

  let allyNearby = 0
  for (const ally of allies) {
    if (getCombatDistance(position, ally.position) <= 2) allyNearby++
  }
  if (adjEnemyCount > 0 && allyNearby === 0 && difficulty >= 2) score -= 10

  score += Math.max(0, 10 - minEnemyDist) * 2

  if (battlePlan.focusTarget && difficulty >= 2) {
    const focusEnemy = enemies.find(e => e.id === battlePlan.focusTarget)
    if (focusEnemy) {
      const distToFocus = getCombatDistance(position, focusEnemy.position)
      const focusPriority = getTargetPriority(focusEnemy)
      const guardedFocus = enemies.some(e =>
        e.id !== focusEnemy.id && e.classId === 'guerrier' &&
        getCombatDistance(e.position, focusEnemy.position) <= 1
      )
      const mult = guardedFocus ? 0.7 : 1.0
      score += Math.max(0, 8 - distToFocus) * focusPriority * mult * (difficulty >= 3 ? 1.5 : 1.0)
    }
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
        const hr = ally.hp / ally.maxHp
        if (hr < 0.7) {
          if (allyDist <= 1) score += (1 - hr) * 15
          else if (allyDist <= 3) score += (1 - hr) * 8
          else score += (1 - hr) * 3
        }
      }
      if (adjEnemyCount > 0) score -= 15
      score += Math.min(minEnemyDist, 3) * 3
      break
  }

  const terrainCell = terrain[`${position.x},${position.y}`]
  if (terrainCell) {
    if (terrainCell.type === TERRAIN_TYPES.HAZARD || terrainCell.type === TERRAIN_TYPES.FIRE) score -= 8
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
    const rpois = findAbility(character, 'poison', 'bonusActions', getAbilityState)
    if (poisonTarget && rpois) { decision.bonusAction = rpois; decision.bonusActionTarget = poisonTarget; return }
    const markTarget = enemies.find(e => !hasStatus(e, 'cursedMark') && getDistance(character.position, e.position) <= 5)
    const mark = findAbility(character, 'marque-maudite', 'bonusActions', getAbilityState)
    if (markTarget && mark) { decision.bonusAction = mark; decision.bonusActionTarget = markTarget; return }
    if (adjEnemies.length > 0) { const c = findAbility(character, 'couverture', 'bonusActions', getAbilityState); if (c) { decision.bonusAction = c; return } }
  }
  if (classId === 'guerrier') {
    if (character.hp / character.maxHp < 0.4) { const s = findAbility(character, 'second-souffle', 'bonusActions', getAbilityState); if (s) { decision.bonusAction = s; return } }
    if (adjEnemies.length >= 2) { const p = findAbility(character, 'posture-defensive', 'bonusActions', getAbilityState); if (p) { decision.bonusAction = p; return } }
    if (adjEnemies.length > 0) { const s = findAbility(character, 'seconde-attaque', 'bonusActions', getAbilityState); if (s) { decision.bonusAction = s; decision.bonusActionTarget = adjEnemies[0]; return } }
  }
  if (classId === 'mage') {
    if (character.hp / character.maxHp < 0.5 && !hasStatus(character, 'shield')) { const b = findAbility(character, 'bouclier-magique', 'bonusActions', getAbilityState); if (b) { decision.bonusAction = b; return } }
    if (adjEnemies.length > 0) { const p = findAbility(character, 'pas-de-mage', 'bonusActions', getAbilityState); if (p) { decision.bonusAction = p; return } }
  }
  if (classId === 'clerc') {
    const hurtAlly = [...allies].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0]
    if (hurtAlly && hurtAlly.hp / hurtAlly.maxHp < 0.5) {
      const m = findAbility(character, 'mot-guerison', 'bonusActions', getAbilityState)
      if (m && getDistance(character.position, hurtAlly.position) <= m.range) { decision.bonusAction = m; decision.bonusActionTarget = hurtAlly; return }
    }
    const exposed = allies.find(a => getAdjacentEnemies(a.position, characters, a.team).length > 0 && !hasStatus(a, 'faithShield'))
    if (exposed) { const b = findAbility(character, 'bouclier-foi', 'bonusActions', getAbilityState); if (b && getDistance(character.position, exposed.position) <= b.range) { decision.bonusAction = b; decision.bonusActionTarget = exposed; return } }
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
    if (ability.effect === 'shield' && character.hp / character.maxHp < 0.6 && !hasStatus(character, 'shield')) { decision.bonusAction = ability; return }
    if (ability.effect === 'defensePosture' && adjEnemies.length >= 1) { decision.bonusAction = ability; return }
    if (ability.effect === 'extraMovement' && adjEnemies.length > 0) { decision.bonusAction = ability; return }
    if (ability.heal && character.hp / character.maxHp < 0.4) { decision.bonusAction = ability; return }
  }
  for (const ability of bonusActions) {
    const state = getAbilityState(character.id, ability)
    if (!state.available) continue
    if (ability.damage && adjEnemies.length > 0) { decision.bonusAction = ability; decision.bonusActionTarget = adjEnemies.sort((a, b) => a.hp - b.hp)[0]; return }
    if (ability.effect === 'advantage') { decision.bonusAction = ability; return }
    if (ability.effect === 'poison') {
      const t = enemies.find(e => !hasStatus(e, 'poison') && getDistance(character.position, e.position) <= (ability.range || 1))
      if (t) { decision.bonusAction = ability; decision.bonusActionTarget = t; return }
    }
    if (ability.effect === 'disengage' && adjEnemies.length > 0) { decision.bonusAction = ability; return }
    if (ability.effect === 'dodge' && adjEnemies.length > 0) { decision.bonusAction = ability; return }
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
