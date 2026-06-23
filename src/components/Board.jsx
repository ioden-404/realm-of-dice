import { BOARD_COLS, BOARD_ROWS } from '../data/config.js'
import Token from './Token.jsx'

export default function Board({
  characters,
  currentCharId,
  validMoves,
  validTargets,
  turnState,
  terrain = {},
  terrainTheme,
  onCellClick,
  onTokenClick,
  onTerrainClick
}) {
  const cells = []
  for (let y = 0; y < BOARD_ROWS; y++) {
    for (let x = 0; x < BOARD_COLS; x++) {
      const isDark = (x + y) % 2 === 0
      const isValidMove = validMoves.some(m => m.x === x && m.y === y)
      const charHere = Object.values(characters).find(
        c => !c.isDead && c.position.x === x && c.position.y === y
      )
      const deadHere = Object.values(characters).find(
        c => c.isDead && c.position.x === x && c.position.y === y
      )
      const showDead = deadHere && !charHere && !Object.values(characters).some(
        c => !c.isDead && c.position.x === x && c.position.y === y
      )
      const isValidTarget = charHere && validTargets.includes(charHere.id)
      const isCorner = (x === 0 || x === BOARD_COLS - 1) && (y === 0 || y === BOARD_ROWS - 1)
      const terrainCell = terrain[`${x},${y}`]
      const terrainClass = terrainCell ? `cell-terrain-${terrainCell.type}` : ''

      cells.push(
        <div
          key={`${x}-${y}`}
          className={`cell ${isDark ? 'cell-dark' : 'cell-light'} ${isValidMove ? 'cell-move' : ''} ${isValidTarget ? 'cell-target' : ''} ${terrainClass}`}
          onClick={() => {
            if (isValidMove) onCellClick(x, y)
            else if (terrainCell && !charHere) onTerrainClick(terrainCell)
          }}
        >
          {isCorner && <div className="cell-rune">᛭</div>}
          {terrainCell && (
            <div className="cell-terrain-icon" title={terrainCell.label}>
              {terrainCell.emoji}
            </div>
          )}
          {charHere && (
            <Token
              character={charHere}
              isActive={charHere.id === currentCharId}
              terrainType={terrainCell?.type}
              onClick={(e) => {
                e.stopPropagation()
                onTokenClick(charHere.id)
              }}
            />
          )}
          {showDead && (
            <Token character={deadHere} isActive={false} />
          )}
        </div>
      )
    }
  }

  return (
    <div className={`board-container ${terrainTheme ? `board-theme-${terrainTheme}` : ''}`}>
      <div className="board-border">
        <div className="board" style={{ gridTemplateColumns: `repeat(${BOARD_COLS}, 1fr)`, gridTemplateRows: `repeat(${BOARD_ROWS}, 1fr)` }}>
          {cells}
        </div>
      </div>
    </div>
  )
}
