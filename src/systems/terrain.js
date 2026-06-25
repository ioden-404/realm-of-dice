import { BOARD_COLS, BOARD_ROWS } from '../data/config.js'

export const TERRAIN_TYPES = {
  BLOCKING: 'blocking',
  DIFFICULT: 'difficult',
  COVER: 'cover',
  HAZARD: 'hazard',
  OIL: 'oil',
  FIRE: 'fire',
  SMOKE: 'smoke'
}

export const HAZARD_DAMAGE = 4

const CARDINAL = [
  { dx: 0, dy: -1 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
  { dx: 1, dy: 0 }
]

const B = import.meta.env.BASE_URL

const MAP_THEMES = {
  ruins: {
    name: 'Ruines antiques',
    obstacles: [
      { type: TERRAIN_TYPES.BLOCKING, emoji: '🪨', label: 'Pilier', image: B + 'Images/terrain-ruins-pillar.png' },
      { type: TERRAIN_TYPES.DIFFICULT, emoji: '🧱', label: 'Gravats' },
      { type: TERRAIN_TYPES.COVER, emoji: '🏛️', label: 'Muret' }
    ],
    density: { blocking: [1, 2], difficult: [1, 2], cover: [1, 2], hazard: [0, 0] }
  },
  forest: {
    name: 'Forêt sombre',
    obstacles: [
      { type: TERRAIN_TYPES.BLOCKING, emoji: '🌳', label: 'Arbre', image: B + 'Images/terrain-forest-tree.png', large: true },
      { type: TERRAIN_TYPES.DIFFICULT, emoji: '💧', label: 'Ruisseau', image: B + 'Images/terrain-forest-stream.png', fillCell: true },
      { type: TERRAIN_TYPES.COVER, emoji: '🌿', label: 'Buisson', image: B + 'Images/terrain-forest-bush.png' }
    ],
    density: { blocking: [1, 2], difficult: [1, 2], cover: [1, 2], hazard: [0, 0] }
  },
  crypt: {
    name: 'Crypte maudite',
    obstacles: [
      { type: TERRAIN_TYPES.BLOCKING, emoji: '⚰️', label: 'Sarcophage', image: B + 'Images/terrain-crypt-sarcophagus.png' },
      { type: TERRAIN_TYPES.DIFFICULT, emoji: '🦴', label: 'Ossements', image: B + 'Images/terrain-crypt-bones.png' },
      { type: TERRAIN_TYPES.COVER, emoji: '⛩️', label: 'Autel', image: B + 'Images/terrain-crypt-altar.png' },
      { type: TERRAIN_TYPES.HAZARD, emoji: '💀', label: 'Feu maudit', image: B + 'Images/terrain-crypt-fire.png' }
    ],
    density: { blocking: [1, 2], difficult: [0, 1], cover: [0, 1], hazard: [1, 2] }
  },
  volcano: {
    name: 'Cratère volcanique',
    obstacles: [
      { type: TERRAIN_TYPES.BLOCKING, emoji: '🗿', label: 'Roche', image: B + 'Images/terrain-volcano-rock.png' },
      { type: TERRAIN_TYPES.COVER, emoji: '🌫️', label: 'Fumerolle', image: B + 'Images/terrain-volcano-steam.png' },
      { type: TERRAIN_TYPES.HAZARD, emoji: '🔥', label: 'Lave', image: B + 'Images/terrain-volcano-lava.png' }
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
        label: obstacleData.label,
        image: obstacleData.image || null,
        large: obstacleData.large || false,
        fillCell: obstacleData.fillCell || false
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
