import { rollD20 } from './dice.js'

export function rollInitiative(characters) {
  const results = []

  for (const char of Object.values(characters)) {
    if (char.isDead) continue
    const roll = rollD20()
    const dexMod = char.movement >= 4 ? 3 : char.movement >= 3 ? 1 : 0
    results.push({
      id: char.id,
      roll,
      dexMod,
      total: roll + dexMod
    })
  }

  results.sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total
    if (b.roll !== a.roll) return b.roll - a.roll
    return Math.random() - 0.5
  })

  return results.map(r => r.id)
}
