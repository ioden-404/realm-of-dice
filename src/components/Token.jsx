import { useEffect, useRef } from 'react'
import { CLASS_COLORS } from '../data/config.js'

const B = import.meta.env.BASE_URL

const TOKEN_IMAGES = {
  guerrier: B + 'Images/guerriertoken.png',
  mage: B + 'Images/magetoken.png',
  voleur: B + 'Images/voleurtoken.png',
  rodeur: B + 'Images/Rodeurtoken.png',
  clerc: B + 'Images/clerctoken.png'
}

const TERRAIN_BADGES = {
  cover: '🛡️',
  hazard: '🔥',
  difficult: '🐌',
  fire: '🔥',
  oil: '🛢️',
  smoke: '🌫️'
}

export default function Token({ character, isActive, terrainType, onClick }) {
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
  const teamColor = isAlly ? '#c9a84c' : '#c83030'
  const classColor = CLASS_COLORS[character.classId]
  const hasRage = character.statuses.some(s => s.type === 'rage')
  const hasPoison = character.statuses.some(s => s.type === 'poison')
  const hasShield = character.statuses.some(s => s.type === 'shield' || s.type === 'faithShield')
  const isDodging = character.statuses.some(s => s.type === 'dodge')

  const hasSprite = isAlly && TOKEN_IMAGES[character.classId]

  if (character.isDead) {
    return (
      <div
        ref={tokenRef}
        className={`token token-dead ${hasSprite ? 'token-sprite-mode' : ''}`}
        style={{ '--team-color': teamColor }}
      >
        <div className="token-inner">
          {hasSprite ? (
            <img src={TOKEN_IMAGES[character.classId]} alt="" className="token-sprite" />
          ) : (
            <span className="token-emoji">{character.emoji}</span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      ref={tokenRef}
      className={`token ${isAlly ? 'token-ally' : 'token-enemy'} ${isActive ? 'token-active' : ''} ${hasRage ? 'token-rage' : ''} ${hasSprite ? 'token-sprite-mode' : ''}`}
      style={{ '--team-color': teamColor, '--class-color': classColor }}
      onClick={onClick}
    >
      {hasSprite ? (
        <div className="token-hp-bar-bottom">
          <div className="token-hp-bar-fill" style={{ width: `${hpPercent * 100}%`, background: hpColor }} />
        </div>
      ) : (
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
      )}
      <div className="token-inner">
        {hasSprite ? (
          <img src={TOKEN_IMAGES[character.classId]} alt="" className="token-sprite" />
        ) : (
          <span className="token-emoji">{character.emoji}</span>
        )}
      </div>
      {!hasSprite && (
        <div className="token-team-marker">
          {isAlly ? '▲' : '▼'}
        </div>
      )}
      {isActive && <div className="token-active-badge">ACTIF</div>}
      <div className="token-status-icons">
        {hasPoison && <span className="status-icon">☠️</span>}
        {hasShield && <span className="status-icon">🛡️</span>}
        {isDodging && <span className="status-icon">💨</span>}
        {hasRage && <span className="status-icon">💢</span>}
      </div>
      {terrainType && TERRAIN_BADGES[terrainType] && (
        <div className="token-terrain-badge">{TERRAIN_BADGES[terrainType]}</div>
      )}
    </div>
  )
}
