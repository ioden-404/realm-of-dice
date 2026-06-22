export function roll(sides) {
  return Math.floor(Math.random() * sides) + 1
}

export function rollD20() {
  return roll(20)
}

export function rollWithAdvantage() {
  const a = rollD20()
  const b = rollD20()
  return { result: Math.max(a, b), rolls: [a, b], type: 'advantage' }
}

export function rollWithDisadvantage() {
  const a = rollD20()
  const b = rollD20()
  return { result: Math.min(a, b), rolls: [a, b], type: 'disadvantage' }
}

export function parseDice(notation) {
  const match = notation.match(/(\d+)d(\d+)(?:\+(\d+))?/)
  if (!match) return null
  return {
    count: parseInt(match[1]),
    sides: parseInt(match[2]),
    modifier: match[3] ? parseInt(match[3]) : 0
  }
}

export function rollDice(notation) {
  const parsed = parseDice(notation)
  if (!parsed) return { rolls: [], modifier: 0, total: 0, notation }

  const rolls = []
  let total = parsed.modifier
  for (let i = 0; i < parsed.count; i++) {
    const r = roll(parsed.sides)
    rolls.push(r)
    total += r
  }
  return { rolls, modifier: parsed.modifier, total, notation }
}

export function rollDiceCrit(notation) {
  const parsed = parseDice(notation)
  if (!parsed) return { rolls: [], modifier: 0, total: 0, notation }

  const doubleCount = parsed.count * 2
  const rolls = []
  let total = parsed.modifier
  for (let i = 0; i < doubleCount; i++) {
    const r = roll(parsed.sides)
    rolls.push(r)
    total += r
  }
  return { rolls, modifier: parsed.modifier, total, notation: `${doubleCount}d${parsed.sides}+${parsed.modifier}`, crit: true }
}

export function rollRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function formatRoll(d20Result, bonus, total, ac, hit) {
  const hitText = hit ? 'Touché !' : 'Raté !'
  return `🎲 d20+${bonus} = ${total} vs CA ${ac} - ${hitText}`
}

export function formatDamage(damageResult) {
  return `🔥 ${damageResult.notation} = ${damageResult.total} dégâts`
}

export function formatHeal(healResult) {
  return `💚 ${healResult.notation} = ${healResult.total} soins`
}
