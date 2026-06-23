import { useEffect, useRef } from 'react'
import { CLASS_COLORS } from '../data/config.js'

export default function Token({ character, isActive, onClick }) {
  const tokenRef = useRef(null)

  useEffect(() => {
    if (character.animation && tokenRef.current) {
      const el = tokenRef.current
      el.classList.remove('anim-shake', 'anim-heal', 'anim-death', 'anim-crit')
      void el.offsetWidth
      if (character.animation === 'shake') el.classList.add('anim-shake')
      if (character.animation === 'heal') el.classList.add('anim-heal')
      if (character.animation === 'death') el.classList.add('anim-death')
    }
  }, [character.animation])

  const hpPercent = character.hp / character.maxHp
  const circumference = Math.PI * 40
  const offset = circumference * (1 - hpPercent)
  const hpColor = hpPercent > 0.5 ? '#4caf50' : hpPercent > 0.25 ? '#ff9800' : '#f44336'
  const isAlly = character.team === 'ally'
  const teamColor = isAlly ? '#c9a84c' : '#8b2020'
  const classColor = CLASS_COLORS[character.classId]
  const hasRage = character.statuses.some(s => s.type === 'rage')
  const hasPoison = character.statuses.some(s => s.type === 'poison')
  const hasShield = character.statuses.some(s => s.type === 'shield' || s.type === 'faithShield')
  const isDodging = character.statuses.some(s => s.type === 'dodge')

  if (character.isDead) {
    return (
      <div
        ref={tokenRef}
        className="token token-dead"
        style={{ '--team-color': teamColor }}
      >
        <div className="token-inner">
          <span className="token-emoji">{character.emoji}</span>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={tokenRef}
      className={`token ${isAlly ? 'token-ally' : 'token-enemy'} ${isActive ? 'token-active' : ''} ${hasRage ? 'token-rage' : ''}`}
      style={{ '--team-color': teamColor, '--class-color': classColor }}
      onClick={onClick}
    >
      <svg className="token-hp-ring" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="20" fill="none" stroke="#333" strokeWidth="3" />
        <circle
          cx="24" cy="24" r="20"
          fill="none"
          stroke={hpColor}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 24 24)"
        />
      </svg>
      <div className="token-inner">
        <span className="token-emoji">{character.emoji}</span>
      </div>
      <div className="token-team-marker">
        {isAlly ? '▲' : '▼'}
      </div>
      {isActive && <div className="token-active-badge">ACTIF</div>}
      <div className="token-status-icons">
        {hasPoison && <span className="status-icon">☠️</span>}
        {hasShield && <span className="status-icon">🛡️</span>}
        {isDodging && <span className="status-icon">💨</span>}
        {hasRage && <span className="status-icon">💢</span>}
      </div>
    </div>
  )
}
