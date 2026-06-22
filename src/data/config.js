export const BOARD_COLS = 6
export const BOARD_ROWS = 4

export const CELL_SIZE = 52
export const TOKEN_SIZE = 44

export const ALLY_START_COLS = [0, 1]
export const ENEMY_START_COLS = [4, 5]

export const TEAMS = {
  ALLY: 'ally',
  ENEMY: 'enemy'
}

export const PHASES = {
  TEAM_SELECT: 'team-select',
  COMBAT: 'combat',
  VICTORY: 'victory',
  DEFEAT: 'defeat'
}

export const TURN_STATES = {
  IDLE: 'idle',
  MOVING: 'moving',
  SELECTING_ACTION: 'selecting-action',
  SELECTING_TARGET: 'selecting-target',
  ENEMY_TURN: 'enemy-turn',
  ANIMATING: 'animating'
}

export const ACTION_TYPES = {
  ACTION: 'action',
  BONUS: 'bonus',
  REACTION: 'reaction'
}

export const ALLY_NAMES = {
  guerrier: 'Aldric',
  mage: 'Lyra',
  voleur: 'Kael',
  rodeur: 'Sylva',
  clerc: 'Theron'
}

export const ENEMY_NAMES = {
  guerrier: 'Gorath',
  mage: 'Malakar',
  voleur: 'Shade',
  rodeur: 'Veyra',
  clerc: 'Morgaine'
}

export const CLASS_EMOJIS = {
  guerrier: '⚔️',
  mage: '🔥',
  voleur: '🗡️',
  rodeur: '🏹',
  clerc: '✨'
}

export const CLASS_COLORS = {
  guerrier: '#4a6fa5',
  mage: '#7b4fa5',
  voleur: '#2d6a4f',
  rodeur: '#8b5e3c',
  clerc: '#d4a843'
}
