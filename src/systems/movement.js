import { BOARD_COLS, BOARD_ROWS } from '../data/config.js'
import { TERRAIN_TYPES } from './terrain.js'

const CARDINAL = [
  { dx: 0, dy: -1 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
  { dx: 1, dy: 0 }
]

const ALL_DIRECTIONS = [
  { dx: 0, dy: -1 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
  { dx: 1, dy: 0 },
  { dx: -1, dy: -1 },
  { dx: -1, dy: 1 },
  { dx: 1, dy: -1 },
  { dx: 1, dy: 1 }
]

export function isInBounds(x, y) {
  return x >= 0 && x < BOARD_COLS && y >= 0 && y < BOARD_ROWS
}

export function getDistance(pos1, pos2) {
  return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y)
}

export function getCombatDistance(pos1, pos2) {
  return Math.max(Math.abs(pos1.x - pos2.x), Math.abs(pos1.y - pos2.y))
}

export function isAdjacent(pos1, pos2) {
  return getCombatDistance(pos1, pos2) === 1
}

export function getOccupiedCells(characters) {
  const occupied = {}
  for (const char of Object.values(characters)) {
    if (!char.isDead) {
      occupied[`${char.position.x},${char.position.y}`] = char.id
    }
  }
  return occupied
}

export function getAccessibleCells(position, movementRemaining, characters, characterId, terrain = {}) {
  const occupied = getOccupiedCells(characters)
  const accessible = []
  const costs = new Map()
  const startKey = `${position.x},${position.y}`
  costs.set(startKey, 0)
  const queue = [{ x: position.x, y: position.y, cost: 0 }]

  while (queue.length > 0) {
    queue.sort((a, b) => a.cost - b.cost)
    const current = queue.shift()

    if (current.cost > 0 && !accessible.some(a => a.x === current.x && a.y === current.y)) {
      accessible.push({ x: current.x, y: current.y })
    }

    for (const dir of CARDINAL) {
      const nx = current.x + dir.dx
      const ny = current.y + dir.dy
      const key = `${nx},${ny}`

      if (!isInBounds(nx, ny)) continue

      const terrainCell = terrain[key]
      if (terrainCell && terrainCell.type === TERRAIN_TYPES.BLOCKING) continue

      if (occupied[key] && occupied[key] !== characterId) continue

      const moveCost = (terrainCell && terrainCell.type === TERRAIN_TYPES.DIFFICULT) ? 2 : 1
      const newCost = current.cost + moveCost

      if (newCost > movementRemaining) continue

      const prevCost = costs.get(key)
      if (prevCost !== undefined && prevCost <= newCost) continue

      costs.set(key, newCost)
      queue.push({ x: nx, y: ny, cost: newCost })
    }
  }

  return accessible
}

export function canMoveTo(position, direction, characters, characterId, terrain = {}) {
  const nx = position.x + direction.dx
  const ny = position.y + direction.dy

  if (!isInBounds(nx, ny)) return false

  const key = `${nx},${ny}`
  const terrainCell = terrain[key]
  if (terrainCell && terrainCell.type === TERRAIN_TYPES.BLOCKING) return false

  const occupied = getOccupiedCells(characters)
  if (occupied[key] && occupied[key] !== characterId) return false

  return true
}

export function getAdjacentEnemies(position, characters, team) {
  const enemies = []

  for (const dir of ALL_DIRECTIONS) {
    const nx = position.x + dir.dx
    const ny = position.y + dir.dy

    for (const char of Object.values(characters)) {
      if (!char.isDead && char.team !== team &&
          char.position.x === nx && char.position.y === ny) {
        enemies.push(char)
      }
    }
  }

  return enemies
}

export function getAdjacentAllies(position, characters, team, excludeId) {
  const allies = []

  for (const dir of ALL_DIRECTIONS) {
    const nx = position.x + dir.dx
    const ny = position.y + dir.dy

    for (const char of Object.values(characters)) {
      if (!char.isDead && char.team === team && char.id !== excludeId &&
          char.position.x === nx && char.position.y === ny) {
        allies.push(char)
      }
    }
  }

  return allies
}

export function checkLineOfSight(attacker, target, characters, terrain = {}) {
  const dx = target.position.x - attacker.position.x
  const dy = target.position.y - attacker.position.y
  const steps = Math.max(Math.abs(dx), Math.abs(dy))

  if (steps <= 1) return true

  for (let i = 1; i < steps; i++) {
    const checkX = Math.round(attacker.position.x + (dx * i) / steps)
    const checkY = Math.round(attacker.position.y + (dy * i) / steps)

    const terrainCell = terrain[`${checkX},${checkY}`]
    if (terrainCell && (terrainCell.type === TERRAIN_TYPES.BLOCKING || terrainCell.type === TERRAIN_TYPES.SMOKE)) return false

    for (const char of Object.values(characters)) {
      if (char.isDead) continue
      if (char.id === attacker.id || char.id === target.id) continue
      if (char.position.x === checkX && char.position.y === checkY) {
        return false
      }
    }
  }

  return true
}

export function getValidTargets(attacker, ability, characters) {
  const targets = []

  for (const char of Object.values(characters)) {
    if (char.isDead) continue

    if (ability.targetType === 'enemy' && char.team === attacker.team) continue
    if (ability.targetType === 'ally' && char.team !== attacker.team) continue
    if (ability.targetType === 'ally' && char.id === attacker.id && !ability.heal && ability.effect !== 'purify') continue
    if (ability.targetType === 'self') continue

    const range = ability.range || attacker.range || 1
    const dist = range <= 1 ? getCombatDistance(attacker.position, char.position) : getDistance(attacker.position, char.position)

    if (dist > range) continue

    if (ability.id === 'coup-fatal') {
      if (char.hp / char.maxHp >= ability.executeThreshold) continue
    }

    targets.push(char)
  }

  return targets
}

export function findPushDestination(target, attacker, distance, characters, terrain = {}) {
  const dx = target.position.x - attacker.position.x
  const dy = target.position.y - attacker.position.y
  const dirX = dx === 0 ? 0 : dx > 0 ? 1 : -1
  const dirY = dy === 0 ? 0 : dy > 0 ? 1 : -1

  const occupied = getOccupiedCells(characters)
  let finalPos = { ...target.position }

  for (let i = 0; i < distance; i++) {
    const nx = finalPos.x + dirX
    const ny = finalPos.y + dirY

    if (!isInBounds(nx, ny)) break

    const key = `${nx},${ny}`
    const terrainCell = terrain[key]
    if (terrainCell && terrainCell.type === TERRAIN_TYPES.BLOCKING) break

    if (occupied[key] && occupied[key] !== target.id) break

    finalPos = { x: nx, y: ny }
  }

  return finalPos
}
