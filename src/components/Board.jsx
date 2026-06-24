import { useState, useEffect } from 'react'
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
  visualEvents = [],
  screenShake,
  onCellClick,
  onTokenClick,
  onTerrainClick
}) {
  const [floats, setFloats] = useState([])
  const eventsKey = visualEvents.map(v => v.id).join(',')

  useEffect(() => {
    if (visualEvents.length > 0) {
      setFloats(visualEvents)
      const timer = setTimeout(() => setFloats([]), 1500)
      return () => clearTimeout(timer)
    } else {
      setFloats([])
    }
  }, [eventsKey])
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
      const isSelectingCell = turnState === 'selecting-cell'
      const isPlacing = turnState === 'placing' && x <= 1

      cells.push(
        <div
          key={`${x}-${y}`}
          className={`cell ${isDark ? 'cell-dark' : 'cell-light'} ${isValidMove ? 'cell-move' : ''} ${isValidTarget ? 'cell-target' : ''} ${terrainClass} ${isSelectingCell ? 'cell-selectable' : ''} ${isPlacing ? 'cell-placement' : ''}`}
          onClick={() => {
            if (isPlacing) onCellClick(x, y)
            else if (isSelectingCell) onCellClick(x, y)
            else if (isValidMove) onCellClick(x, y)
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
    <div className={`board-container ${terrainTheme ? `board-theme-${terrainTheme}` : ''} ${screenShake ? 'board-shake' : ''}`}>
      <div className="board-border">
        <div className="board" style={{ gridTemplateColumns: `repeat(${BOARD_COLS}, 1fr)`, gridTemplateRows: `repeat(${BOARD_ROWS}, 1fr)` }}>
          {cells}
        </div>
        {floats.filter(f => f.type === 'dice').map(f => (
          <div key={f.id} className={`d20-roll ${f.isCrit ? 'd20-crit' : ''} ${f.isFail ? 'd20-fail' : ''}`}>
            <div className="d20-shape">
              <span className="d20-value">{f.value}</span>
            </div>
          </div>
        ))}
        {floats.filter(f => f.type !== 'dice').map(f => (
          <div
            key={f.id}
            className={`float-number float-${f.type}`}
            style={{
              left: `${((f.position?.x || 0) / BOARD_COLS) * 100 + (100 / BOARD_COLS / 2)}%`,
              top: `${((f.position?.y || 0) / BOARD_ROWS) * 100}%`
            }}
          >
            {f.type === 'heal' ? '+' : '-'}{f.amount}
          </div>
        ))}
      </div>
    </div>
  )
}
