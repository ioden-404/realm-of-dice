import { rollD20, rollDice, rollDiceCrit, rollRange, rollWithAdvantage, rollWithDisadvantage } from './dice.js'
import { getDistance, isAdjacent, getAdjacentAllies, getAdjacentEnemies, checkLineOfSight, findPushDestination } from './movement.js'
import { TERRAIN_TYPES, HAZARD_DAMAGE } from './terrain.js'

export function resolveAttack(attacker, target, ability, characters, terrain = {}) {
  const logs = []
  const effects = []
  let hasAdvantage = hasStatus(attacker, 'advantage')
  let hasDisadvantage = false

  if (ability.magical && !checkLineOfSight(attacker, target, characters, terrain)) {
    hasDisadvantage = true
    logs.push('👁️ Ligne de vue bloquée - désavantage !')
  }

  if (hasStatus(target, 'dodge')) {
    hasDisadvantage = true
  }

  if (ability.sneakAttack) {
    const adjacentAllies = getAdjacentAllies(target.position, characters, attacker.team, attacker.id)
    if (adjacentAllies.length > 0 || hasAdvantage) {
      hasAdvantage = true
    }
  }

  let d20Roll
  if (hasAdvantage && !hasDisadvantage) {
    const advRoll = rollWithAdvantage()
    d20Roll = advRoll.result
    logs.push(`🎲 Avantage ! (${advRoll.rolls[0]}, ${advRoll.rolls[1]}) - garde ${d20Roll}`)
  } else if (hasDisadvantage && !hasAdvantage) {
    const disRoll = rollWithDisadvantage()
    d20Roll = disRoll.result
    logs.push(`🎲 Désavantage ! (${disRoll.rolls[0]}, ${disRoll.rolls[1]}) - garde ${d20Roll}`)
  } else {
    d20Roll = rollD20()
  }

  const isCrit = d20Roll === 20
  const isCritFail = d20Roll === 1

  const rageBonus = hasStatus(attacker, 'rage') ? 2 : 0
  const attackTotal = d20Roll + attacker.attackBonus + rageBonus

  let targetAC = getEffectiveAC(target)

  const abilityRange = ability.range || attacker.range || 1
  const targetTerrain = terrain[`${target.position.x},${target.position.y}`]
  const coverBonus = (abilityRange > 1 && targetTerrain && targetTerrain.type === TERRAIN_TYPES.COVER) ? 2 : 0
  targetAC += coverBonus

  if (isCritFail) {
    logs.push(`🎲 d20 = 1 - Raté critique !`)
    return { hit: false, logs, effects, isCrit: false, isCritFail: true }
  }

  const hit = isCrit || attackTotal >= targetAC

  if (!isCrit) {
    logs.push(`🎲 d20+${attacker.attackBonus}${rageBonus ? `+${rageBonus}` : ''} = ${attackTotal} vs CA ${targetAC}${coverBonus ? ' (couvert +2)' : ''} - ${hit ? 'Touché !' : 'Raté !'}`)
  } else {
    logs.push(`🎲 d20 = 20 - CRITIQUE ! ⚡`)
  }

  if (!hit) {
    return { hit: false, logs, effects, isCrit: false, isCritFail: false }
  }

  let totalDamage = 0
  const damageNotation = ability.damage || attacker.damageDice

  if (damageNotation) {
    const damageRoll = isCrit ? rollDiceCrit(damageNotation) : rollDice(damageNotation)
    totalDamage += damageRoll.total

    if (ability.sneakAttack && ability.bonusDamage) {
      const adjacentAllies = getAdjacentAllies(target.position, characters, attacker.team, attacker.id)
      if (adjacentAllies.length > 0 || hasAdvantage) {
        const sneakRoll = isCrit ? rollDiceCrit(ability.bonusDamage) : rollDice(ability.bonusDamage)
        totalDamage += sneakRoll.total
        logs.push(`🗡️ Attaque sournoise ! +${sneakRoll.total} dégâts`)
      }
    }

    if (ability.requiresFlank && ability.bonusDamage) {
      const flankRoll = isCrit ? rollDiceCrit(ability.bonusDamage) : rollDice(ability.bonusDamage)
      totalDamage += flankRoll.total
      logs.push(`🗡️ Infiltration ! +${flankRoll.total} dégâts`)
    }
  }

  if (hasStatus(attacker, 'rage')) {
    const rageDmg = rollDice('1d4')
    totalDamage += rageDmg.total
    logs.push(`💢 Rage ! +${rageDmg.total} dégâts`)
  }

  if (hasStatus(target, 'hunted')) {
    const huntedDmg = rollDice('1d6')
    totalDamage += huntedDmg.total
    logs.push(`🎯 Marque de chasse ! +${huntedDmg.total} dégâts`)
  }

  if (ability.armorPiercing) {
    logs.push(`🔥 ${damageNotation} = ${totalDamage} dégâts (perce l'armure)`)
  } else {
    logs.push(`🔥 ${totalDamage} dégâts`)
  }

  const { finalDamage, absorbed, intercepted, shieldEffects } = applyDamageReductions(target, totalDamage, characters)

  if (absorbed > 0) {
    logs.push(`🛡️ Bouclier absorbe ${absorbed} dégâts`)
  }
  if (intercepted) {
    logs.push(`🛡️ ${intercepted.name} intercepte ! Dégâts réduits`)
  }

  effects.push(...shieldEffects)
  effects.push({ type: 'damage', targetId: target.id, amount: finalDamage })

  if (ability.effect === 'stun') {
    effects.push({ type: 'addStatus', targetId: target.id, status: { type: 'stunned', duration: ability.stunDuration } })
    logs.push(`⚡ ${target.name} est étourdi !`)
  }

  if (target.concentration) {
    const conSave = rollD20() + 2
    const dc = Math.max(10, Math.floor(finalDamage / 2))
    if (conSave < dc) {
      effects.push({ type: 'breakConcentration', targetId: target.id })
      logs.push(`💔 Concentration brisée ! (${conSave} vs DD ${dc})`)
    } else {
      logs.push(`✨ Concentration maintenue (${conSave} vs DD ${dc})`)
    }
  }

  return { hit: true, logs, effects, isCrit, isCritFail: false, damage: finalDamage }
}

export function resolveMultiHit(attacker, target, ability, characters, terrain = {}) {
  const allLogs = []
  const allEffects = []
  let totalDamage = 0

  for (let i = 0; i < ability.hits; i++) {
    allLogs.push(`--- Frappe ${i + 1} ---`)
    const result = resolveAttack(attacker, target, { ...ability, hits: undefined }, characters, terrain)
    allLogs.push(...result.logs)
    allEffects.push(...result.effects)
    if (result.hit) totalDamage += result.damage || 0
  }

  return { logs: allLogs, effects: allEffects, totalDamage }
}

export function resolveHeal(healer, target, ability) {
  const logs = []
  const effects = []

  const healRoll = rollDice(ability.heal)
  let healAmount = healRoll.total

  if (hasStatus(target, 'antiHeal')) {
    const factor = getStatusValue(target, 'antiHeal', 'factor') || 0.5
    healAmount = Math.floor(healAmount * factor)
    logs.push(`☠️ Poison corrosif ! Soins réduits de moitié`)
  }

  if (hasStatus(target, 'cursedMark')) {
    healAmount = 0
    effects.push({ type: 'removeStatus', targetId: target.id, statusType: 'cursedMark' })
    logs.push(`💀 Marque maudite ! Soin annulé !`)
  }

  const actualHeal = Math.min(healAmount, target.maxHp - target.hp)
  effects.push({ type: 'heal', targetId: target.id, amount: actualHeal })
  logs.push(`💚 ${ability.heal} = ${actualHeal} soins sur ${target.name}`)

  return { logs, effects, healAmount: actualHeal }
}

export function resolveAbility(attacker, target, ability, characters, terrain = {}) {
  const logs = []
  const effects = []

  if (ability.effect === 'disengage') {
    effects.push({ type: 'addStatus', targetId: attacker.id, status: { type: 'disengaged', duration: 0 } })
    logs.push(`🏃 ${attacker.name} se désengage !`)
    return { logs, effects }
  }

  if (ability.effect === 'dodge') {
    effects.push({ type: 'addStatus', targetId: attacker.id, status: { type: 'dodge', duration: 1 } })
    logs.push(`🛡️ ${attacker.name} esquive ! Désavantage sur les attaques entrantes`)
    return { logs, effects }
  }

  if (ability.effect === 'defensePosture') {
    effects.push({ type: 'addStatus', targetId: attacker.id, status: { type: 'defensePosture', duration: 1, acBonus: ability.acBonus } })
    logs.push(`🛡️ ${attacker.name} prend une posture défensive (+${ability.acBonus} CA)`)
    return { logs, effects }
  }

  if (ability.effect === 'advantage') {
    effects.push({ type: 'addStatus', targetId: attacker.id, status: { type: 'advantage', duration: 1 } })
    logs.push(`👻 ${attacker.name} disparaît dans l'ombre !`)
    return { logs, effects }
  }

  if (ability.effect === 'shield') {
    effects.push({ type: 'addStatus', targetId: attacker.id, status: { type: 'shield', absorption: ability.absorption } })
    logs.push(`🛡️ ${attacker.name} invoque un bouclier magique (${ability.absorption} absorption)`)
    return { logs, effects }
  }

  if (ability.effect === 'extraMovement') {
    effects.push({
      type: 'addStatus',
      targetId: attacker.id,
      status: { type: 'extraMovement', amount: ability.extraMove, duration: 0 }
    })
    logs.push(`✨ ${attacker.name} gagne +${ability.extraMove} case de mouvement`)
    return { logs, effects }
  }

  if (ability.effect === 'push') {
    const newPos = findPushDestination(target, attacker, ability.pushDistance, characters, terrain)
    effects.push({ type: 'move', characterId: target.id, position: newPos })
    logs.push(`🌀 ${attacker.name} repousse ${target.name} !`)

    const destTerrain = terrain[`${newPos.x},${newPos.y}`]
    if (destTerrain && destTerrain.type === TERRAIN_TYPES.HAZARD) {
      effects.push({ type: 'damage', targetId: target.id, amount: HAZARD_DAMAGE })
      logs.push(`🔥 ${target.name} est projeté dans ${destTerrain.label} ! ${HAZARD_DAMAGE} dégâts !`)
    }

    return { logs, effects }
  }

  if (ability.effect === 'poison') {
    const dmg = rollRange(ability.poisonDamageMin, ability.poisonDamageMax)
    effects.push({
      type: 'addStatus',
      targetId: target.id,
      status: { type: 'poison', duration: ability.poisonDuration, damage: dmg, source: attacker.name }
    })
    logs.push(`☠️ ${attacker.name} empoisonne ${target.name} ! (${dmg} dégâts/tour, ${ability.poisonDuration} tours)`)
    return { logs, effects }
  }

  if (ability.effect === 'antiHeal') {
    effects.push({
      type: 'addStatus',
      targetId: target.id,
      status: { type: 'antiHeal', duration: ability.antiHealDuration, factor: ability.antiHealFactor }
    })
    logs.push(`☠️ ${attacker.name} inflige un poison corrosif à ${target.name} ! (soins -50% pendant ${ability.antiHealDuration} tours)`)
    return { logs, effects }
  }

  if (ability.effect === 'cursedMark') {
    effects.push({
      type: 'addStatus',
      targetId: target.id,
      status: { type: 'cursedMark' }
    })
    logs.push(`💀 ${attacker.name} marque ${target.name} d'une malédiction !`)
    return { logs, effects }
  }

  if (ability.effect === 'hunted') {
    effects.push({
      type: 'addStatus',
      targetId: target.id,
      status: { type: 'hunted', bonusDamage: ability.huntedBonusDamage }
    })
    logs.push(`🎯 ${attacker.name} marque ${target.name} pour la chasse ! (+1d6 dégâts reçus)`)
    return { logs, effects }
  }

  if (ability.effect === 'purify') {
    effects.push({ type: 'removeStatus', targetId: target.id, statusType: 'poison' })
    effects.push({ type: 'removeStatus', targetId: target.id, statusType: 'cursedMark' })
    effects.push({ type: 'removeStatus', targetId: target.id, statusType: 'antiHeal' })
    logs.push(`✨ ${attacker.name} purifie ${target.name} !`)
    return { logs, effects }
  }

  if (ability.effect === 'giveAdvantage') {
    effects.push({ type: 'addStatus', targetId: target.id, status: { type: 'advantage', duration: 1 } })
    logs.push(`🤝 ${attacker.name} aide ${target.name} ! (avantage prochain jet)`)
    return { logs, effects }
  }

  if (ability.effect === 'faithShield') {
    if (attacker.concentration) {
      effects.push({ type: 'breakConcentration', targetId: attacker.id })
      logs.push(`💔 Concentration précédente brisée`)
    }
    effects.push({
      type: 'addStatus',
      targetId: target.id,
      status: { type: 'faithShield', absorption: ability.absorption, duration: ability.duration, source: attacker.id }
    })
    effects.push({
      type: 'setConcentration',
      targetId: attacker.id,
      spell: { id: ability.id, targetId: target.id }
    })
    logs.push(`✨ ${attacker.name} invoque un Bouclier de foi sur ${target.name} (${ability.absorption} absorption)`)
    return { logs, effects }
  }

  if (ability.effect === 'execute') {
    effects.push({ type: 'damage', targetId: target.id, amount: target.hp })
    logs.push(`💀 ${attacker.name} exécute ${target.name} ! COUP FATAL !`)
    return { logs, effects }
  }

  if (ability.heal) {
    return resolveHeal(attacker, target || attacker, ability)
  }

  if (ability.damage) {
    if (ability.hits && ability.hits > 1) {
      return resolveMultiHit(attacker, target, ability, characters, terrain)
    }
    return resolveAttack(attacker, target, ability, characters, terrain)
  }

  return { logs, effects }
}

export function processStartOfTurn(character, terrain = {}) {
  const logs = []
  const effects = []

  const poison = character.statuses.find(s => s.type === 'poison')
  if (poison) {
    effects.push({ type: 'damage', targetId: character.id, amount: poison.damage })
    logs.push(`☠️ ${character.name} subit ${poison.damage} dégâts de poison (${poison.source})`)
  }

  const terrainCell = terrain[`${character.position.x},${character.position.y}`]
  if (terrainCell && terrainCell.type === TERRAIN_TYPES.HAZARD) {
    effects.push({ type: 'damage', targetId: character.id, amount: HAZARD_DAMAGE })
    logs.push(`🔥 ${character.name} subit ${HAZARD_DAMAGE} dégâts de ${terrainCell.label} !`)
  }

  return { logs, effects }
}

export function processEndOfTurn(character) {
  const effects = []

  effects.push({ type: 'tickStatuses', targetId: character.id })
  effects.push({ type: 'removeStatus', targetId: character.id, statusType: 'advantage' })
  effects.push({ type: 'removeStatus', targetId: character.id, statusType: 'disengaged' })

  return { effects }
}

export function resolveOpportunityAttacks(mover, oldPosition, characters) {
  const logs = []
  const effects = []

  if (hasStatus(mover, 'disengaged')) return { logs, effects }

  for (const char of Object.values(characters)) {
    if (char.isDead || char.team === mover.team || char.reactionUsed) continue

    const wasAdjacent = Math.max(
      Math.abs(oldPosition.x - char.position.x),
      Math.abs(oldPosition.y - char.position.y)
    ) <= 1

    if (!wasAdjacent) continue

    const aoAbility = char.classData.abilities.reactions.find(r => r.trigger === 'enemyLeaves')
    if (!aoAbility) continue
    if (!aoAbility.damage) continue

    logs.push(`⚡ ATTAQUE D'OPPORTUNITÉ - ${char.name} réagit !`)

    const d20 = rollD20()
    const isCrit = d20 === 20
    const isFail = d20 === 1
    const rageBonus = hasStatus(char, 'rage') ? 2 : 0
    const total = d20 + char.attackBonus + rageBonus
    const targetAC = mover.ac

    if (isFail) {
      logs.push(`🎲 d20 = 1 - Raté critique !`)
      effects.push({ type: 'useReaction', targetId: char.id })
      continue
    }

    const hit = isCrit || total >= targetAC
    logs.push(`🎲 d20+${char.attackBonus}${rageBonus ? `+${rageBonus}` : ''} = ${total} vs CA ${targetAC} - ${hit ? 'Touché !' : 'Raté !'}`)

    if (hit) {
      const dmgRoll = isCrit ? rollDiceCrit(aoAbility.damage) : rollDice(aoAbility.damage)
      let dmg = dmgRoll.total
      if (hasStatus(char, 'rage')) {
        const rageDmg = rollDice('1d4')
        dmg += rageDmg.total
      }
      logs.push(`🔥 ${dmg} dégâts d'opportunité`)
      effects.push({ type: 'damage', targetId: mover.id, amount: dmg })
    }

    effects.push({ type: 'useReaction', targetId: char.id })
  }

  return { logs, effects }
}

export function checkRageComeback(deadCharacter, characters) {
  const logs = []
  const effects = []
  const team = deadCharacter.team

  const survivors = Object.values(characters).filter(c => c.team === team && !c.isDead && c.id !== deadCharacter.id)

  if (survivors.length > 0) {
    for (const ally of survivors) {
      if (!hasStatus(ally, 'rage')) {
        effects.push({
          type: 'addStatus',
          targetId: ally.id,
          status: { type: 'rage', duration: 3 }
        })
      }
    }
    logs.push(`⚡ RAGE - L'équipe est galvanisée par la chute de ${deadCharacter.name} !`)
  }

  return { logs, effects }
}

export function hasStatus(character, statusType) {
  return character.statuses.some(s => s.type === statusType)
}

function getStatusValue(character, statusType, key) {
  const status = character.statuses.find(s => s.type === statusType)
  return status ? status[key] : null
}

function getEffectiveAC(character) {
  let ac = character.ac
  const defPosture = character.statuses.find(s => s.type === 'defensePosture')
  if (defPosture) ac += defPosture.acBonus || 2
  return ac
}

function applyDamageReductions(target, damage, characters) {
  let finalDamage = damage
  let absorbed = 0
  let intercepted = null
  const shieldEffects = []

  const shield = target.statuses.find(s => s.type === 'shield')
  if (shield) {
    const absorb = Math.min(shield.absorption, finalDamage)
    finalDamage -= absorb
    absorbed += absorb
    const remaining = shield.absorption - absorb
    if (remaining <= 0) {
      shieldEffects.push({ type: 'removeStatus', targetId: target.id, statusType: 'shield' })
    } else {
      shieldEffects.push({
        type: 'addStatus',
        targetId: target.id,
        status: { ...shield, absorption: remaining }
      })
    }
  }

  const faithShield = target.statuses.find(s => s.type === 'faithShield')
  if (faithShield) {
    const absorb = Math.min(faithShield.absorption, finalDamage)
    finalDamage -= absorb
    absorbed += absorb
    const remaining = faithShield.absorption - absorb
    if (remaining <= 0) {
      shieldEffects.push({ type: 'removeStatus', targetId: target.id, statusType: 'faithShield' })
    } else {
      shieldEffects.push({
        type: 'addStatus',
        targetId: target.id,
        status: { ...faithShield, absorption: remaining }
      })
    }
  }

  return { finalDamage, absorbed, intercepted, shieldEffects }
}
