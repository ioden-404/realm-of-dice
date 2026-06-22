import { rollD20 } from './dice.js'

export function rollInitiative(characters) {
  const results = []

  for (const char of Object.values(characters)) {
    if (char.isDead) continue
    const roll = rollD20()
    results.push({
      id: char.id,
      roll,
      dexBonus: char.classId === 'voleur' ? 3 : char.classId === 'rodeur' ? 2 : 1,
      total: roll + (char.classId === 'voleur' ? 3 : char.classId === 'rodeur' ? 2 : 1)
    })
  }

  results.sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total
    return b.dexBonus - a.dexBonus
  })

  return results.map(r => r.id)
}
