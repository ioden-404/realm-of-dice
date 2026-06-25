import { useState, useEffect, useRef, useCallback } from 'react'
import { BOARD_COLS, BOARD_ROWS } from '../data/config.js'
import Token from './Token.jsx'

const B = import.meta.env.BASE_URL
const THEME_BACKGROUNDS = {
  forest: B + 'Images/bg-forest.png'
}

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
  onTerrainClick,
  onDragPlace,
  gridCols,
  gridRows
}) {
  const cols = gridCols || BOARD_COLS
  const rows = gridRows || BOARD_ROWS
  const [floats, setFloats] = useState([])
  const [dragState, setDragState] = useState(null)
  const boardRef = useRef(null)
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

  const isPlacing = turnState === 'placing'

  const handlePointerDown = useCallback((charId, e) => {
    if (!isPlacing) return
    e.preventDefault()
    e.stopPropagation()
    const el = e.currentTarget
    if (el.setPointerCapture) el.setPointerCapture(e.pointerId)
    setDragState({ charId, x: e.clientX, y: e.clientY, moved: false })
  }, [isPlacing])

  const handlePointerMove = useCallback((e) => {
    if (!dragState) return
    setDragState(prev => prev ? { ...prev, x: e.clientX, y: e.clientY, moved: true } : null)
  }, [dragState])

  const handlePointerUp = useCallback((e) => {
    if (!dragState) return
    const board = boardRef.current
    if (board && dragState.moved) {
      const rect = board.getBoundingClientRect()
      const relX = e.clientX - rect.left
      const relY = e.clientY - rect.top
      const col = Math.floor((relX / rect.width) * cols)
      const row = Math.floor((relY / rect.height) * rows)
      if (col >= 0 && col <= 1 && row >= 0 && row < rows && onDragPlace) {
        onDragPlace(dragState.charId, col, row)
      }
    } else if (!dragState.moved) {
      onTokenClick(dragState.charId)
    }
    setDragState(null)
  }, [dragState, onDragPlace, onTokenClick])

  useEffect(() => {
    if (!dragState) return
    const onMove = (e) => handlePointerMove(e)
    const onUp = (e) => handlePointerUp(e)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [dragState, handlePointerMove, handlePointerUp])

  const cells = []
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
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
      const isCorner = (x === 0 || x === cols - 1) && (y === 0 || y === rows - 1)
      const terrainCell = terrain[`${x},${y}`]
      const terrainClass = terrainCell ? `cell-terrain-${terrainCell.type}` : ''
      const isSelectingCell = turnState === 'selecting-cell'
      const cellIsPlacing = isPlacing && x <= 1
      const isDragOver = dragState && cellIsPlacing

      cells.push(
        <div
          key={`${x}-${y}`}
          className={`cell ${isDark ? 'cell-dark' : 'cell-light'} ${isValidMove ? 'cell-move' : ''} ${isValidTarget ? 'cell-target' : ''} ${terrainClass} ${isSelectingCell ? 'cell-selectable' : ''} ${cellIsPlacing ? 'cell-placement' : ''} ${isDragOver ? 'cell-drag-over' : ''}`}
          onClick={() => {
            if (cellIsPlacing) onCellClick(x, y)
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
            <div
              className={`token-drag-wrapper ${dragState?.charId === charHere.id ? 'token-dragging' : ''}`}
              onPointerDown={isPlacing && charHere.team === 'ally' ? (e) => handlePointerDown(charHere.id, e) : undefined}
              style={isPlacing && charHere.team === 'ally' ? { touchAction: 'none' } : undefined}
            >
              <Token
                character={charHere}
                isActive={charHere.id === currentCharId}
                terrainType={terrainCell?.type}
                onClick={(e) => {
                  if (isPlacing) return
                  e.stopPropagation()
                  onTokenClick(charHere.id)
                }}
              />
            </div>
          )}
          {showDead && (
            <Token character={deadHere} isActive={false} />
          )}
        </div>
      )
    }
  }

  const bgImage = THEME_BACKGROUNDS[terrainTheme]
  const boardStyle = { gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }
  if (bgImage) boardStyle.backgroundImage = `url(${bgImage})`

  return (
    <div className={`board-container ${terrainTheme ? `board-theme-${terrainTheme}` : ''} ${bgImage ? 'board-bg-image' : ''} ${screenShake ? 'board-shake' : ''}`}>
      <div className="board-border">
        <div
          className="board"
          ref={boardRef}
          style={boardStyle}
        >
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
              left: `${((f.position?.x || 0) / cols) * 100 + (100 / cols / 2)}%`,
              top: `${((f.position?.y || 0) / rows) * 100}%`
            }}
          >
            {f.type === 'heal' ? '+' : '-'}{f.amount}
          </div>
        ))}
      </div>

      {dragState && dragState.moved && (
        <div
          className="drag-ghost"
          style={{ left: dragState.x, top: dragState.y }}
        >
          <span className="drag-ghost-emoji">
            {characters[dragState.charId]?.emoji}
          </span>
        </div>
      )}
    </div>
  )
}
