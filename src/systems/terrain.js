import { BOARD_COLS, BOARD_ROWS } from '../data/config.js'

export const TERRAIN_TYPES = {
  BLOCKING: 'blocking',
  DIFFICULT: 'difficult',
  COVER: 'cover',
  HAZARD: 'hazard'
}

export const HAZARD_DAMAGE = 4

const CARDINAL = [
  { dx: 0, dy: -1 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
  { dx: 1, dy: 0 }
]

const MAP_THEMES = {
  ruins: {
    name: 'Ruines antiques',
    obstacles: [
      { type: TERRAIN_TYPES.BLOCKING, emoji: '🪨', label: 'Pilier' },
      { type: TERRAIN_TYPES.DIFFICULT, emoji: '🧱', label: 'Gravats' },
      { type: TERRAIN_TYPES.COVER, emoji: '🏛️', label: 'Muret' }
    ],
    density: { blocking: [1, 2], difficult: [1, 2], cover: [1, 2], hazard: [0, 0] }
  },
  forest: {
    name: 'Forêt sombre',
    obstacles: [
      { type: TERRAIN_TYPES.BLOCKING, emoji: '🌳', label: 'Arbre' },
      { type: TERRAIN_TYPES.DIFFICULT, emoji: '💧', label: 'Ruisseau' },
      { type: TERRAIN_TYPES.COVER, emoji: '🌿', label: 'Buisson' }
    ],
    density: { blocking: [1, 2], difficult: [1, 2], cover: [1, 2], hazard: [0, 0] }
  },
  crypt: {
    name: 'Crypte maudite',
    obstacles: [
      { type: TERRAIN_TYPES.BLOCKING, emoji: '⚰️', label: 'Sarcophage' },
      { type: TERRAIN_TYPES.DIFFICULT, emoji: '🦴', label: 'Ossements' },
      { type: TERRAIN_TYPES.COVER, emoji: '⛩️', label: 'Autel' },
      { type: TERRAIN_TYPES.HAZARD, emoji: '💀', label: 'Feu maudit' }
    ],
    density: { blocking: [1, 2], difficult: [0, 1], cover: [0, 1], hazard: [1, 2] }
  },
  volcano: {
    name: 'Cratère volcanique',
    obstacles: [
      { type: TERRAIN_TYPES.BLOCKING, emoji: '🗿', label: 'Roche' },
      { type: TERRAIN_TYPES.COVER, emoji: '🌫️', label: 'Fumerolle' },
      { type: TERRAIN_TYPES.HAZARD, emoji: '🔥', label: 'Lave' }
    ],
    density: { blocking: [1, 2], difficult: [0, 0], cover: [1, 2], hazard: [1, 2] }
  },
  swamp: {
    name: 'Marais putride',
    obstacles: [
      { type: TERRAIN_TYPES.BLOCKING, emoji: '🪵', label: 'Arbre mort' },
      { type: TERRAIN_TYPES.DIFFICULT, emoji: '🌊', label: 'Eau profonde' },
      { type: TERRAIN_TYPES.COVER, emoji: '🌾', label: 'Roseaux' },
      { type: TERRAIN_TYPES.HAZARD, emoji: '☠️', label: 'Marécage toxique' }
    ],
    density: { blocking: [0, 1], difficult: [1, 2], cover: [1, 2], hazard: [0, 1] }
  }
}

const PLACEABLE_CELLS = []
for (let x = 2; x <= 4; x++) {
  for (let y = 0; y < BOARD_ROWS; y++) {
    PLACEABLE_CELLS.push({ x, y })
  }
}

function isInBounds(x, y) {
  return x >= 0 && x < BOARD_COLS && y >= 0 && y < BOARD_ROWS
}

function isTraversable(terrain) {
  const visited = new Set()
  const queue = []

  for (let y = 0; y < BOARD_ROWS; y++) {
    const key = `0,${y}`
    if (!terrain[key] || terrain[key].type !== TERRAIN_TYPES.BLOCKING) {
      queue.push({ x: 0, y })
      visited.add(key)
    }
  }

  while (queue.length > 0) {
    const { x, y } = queue.shift()
    if (x === BOARD_COLS - 1) return true

    for (const { dx, dy } of CARDINAL) {
      const nx = x + dx
      const ny = y + dy
      const key = `${nx},${ny}`
      if (!isInBounds(nx, ny) || visited.has(key)) continue
      if (terrain[key] && terrain[key].type === TERRAIN_TYPES.BLOCKING) continue
      visited.add(key)
      queue.push({ x: nx, y: ny })
    }
  }

  return false
}

export function generateTerrain(forceTheme = null, attempt = 0) {
  if (attempt > 20) return { terrain: {}, theme: 'plains', themeName: 'Plaines' }

  const themeKeys = Object.keys(MAP_THEMES)
  const themeKey = (forceTheme && MAP_THEMES[forceTheme]) ? forceTheme : themeKeys[Math.floor(Math.random() * themeKeys.length)]
  const theme = MAP_THEMES[themeKey]

  const terrain = {}
  const usedCells = new Set()

  const typeOrder = ['blocking', 'hazard', 'difficult', 'cover']

  for (const terrainType of typeOrder) {
    const [min, max] = theme.density[terrainType] || [0, 0]
    const count = min + Math.floor(Math.random() * (max - min + 1))
    if (count === 0) continue

    const obstacleData = theme.obstacles.find(o => o.type === terrainType)
    if (!obstacleData) continue

    const available = PLACEABLE_CELLS.filter(c => !usedCells.has(`${c.x},${c.y}`))
    const shuffled = [...available].sort(() => Math.random() - 0.5)

    for (let i = 0; i < Math.min(count, shuffled.length); i++) {
      const cell = shuffled[i]
      const key = `${cell.x},${cell.y}`
      terrain[key] = {
        type: obstacleData.type,
        emoji: obstacleData.emoji,
        label: obstacleData.label
      }
      usedCells.add(key)
    }
  }

  if (!isTraversable(terrain)) {
    return generateTerrain(forceTheme, attempt + 1)
  }

  return { terrain, theme: themeKey, themeName: theme.name }
}

export function getTerrainAt(terrain, x, y) {
  return terrain[`${x},${y}`] || null
}

export function isBlockingTerrain(terrain, x, y) {
  const cell = terrain[`${x},${y}`]
  return cell && cell.type === TERRAIN_TYPES.BLOCKING
}

export function getTerrainMoveCost(terrain, x, y) {
  const cell = terrain[`${x},${y}`]
  if (cell && cell.type === TERRAIN_TYPES.DIFFICULT) return 2
  return 1
}
