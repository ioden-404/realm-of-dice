import { useEffect, useRef } from 'react'
import { CLASS_COLORS } from '../data/config.js'

const B = import.meta.env.BASE_URL

const ALLY_IMAGES = {
  guerrier: B + 'Images/guerriertoken.png',
  mage: B + 'Images/magetoken.png',
  voleur: B + 'Images/voleurtoken.png',
  rodeur: B + 'Images/Rodeurtoken.png',
  clerc: B + 'Images/clerctoken.png'
}

const MONSTER_IMAGES = {
  silhouette: B + 'Images/silhouette.png',
  goblin: B + 'Images/gobelin.png',
  wolf: B + 'Images/loup.png',
  skeleton: B + 'Images/squelette.png',
  kobold: B + 'Images/kobold.png',
  bugbear: B + 'Images/bugbear.png',
  gnoll: B + 'Images/gnoll.png',
  zombie: B + 'Images/zombie.png',
  necromancer: B + 'Images/necromancien.png',
  specter: B + 'Images/spectre.png',
  minotaur: B + 'Images/minotaure.png',
  orcBerserker: B + 'Images/orque.png',
  darkMage: B + 'Images/magenoir.png',
  deathKnight: B + 'Images/chevaliermort.png',
  basilisk: B + 'Images/basilic.png',
  youngDragon: B + 'Images/dragon.png'
}

const MONSTERS_NEED_FLIP = new Set([
  'necromancer', 'specter', 'minotaur', 'orcBerserker', 'darkMage'
])

const TERRAIN_BADGES = {
  cover: '🛡️',
  hazard: '🔥',
  difficult: '🐌',
  fire: '🔥',
  oil: '🛢️',
  smoke: '🌫️'
}

function getSpriteUrl(character) {
  if (character.team === 'ally') return ALLY_IMAGES[character.classId] || null
  const monsterId = character.id?.replace(/^enemy-/, '').replace(/-\d+$/, '')
  return MONSTER_IMAGES[monsterId] || null
}

function needsFlip(character) {
  if (character.team === 'ally') return false
  const monsterId = character.id?.replace(/^enemy-/, '').replace(/-\d+$/, '')
  return MONSTERS_NEED_FLIP.has(monsterId)
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

  const spriteUrl = getSpriteUrl(character)
  const baseFlip = needsFlip(character)
  const facing = character.facingRight

  let shouldFlip = baseFlip
  if (facing !== undefined) {
    if (isAlly) {
      shouldFlip = !facing
    } else {
      shouldFlip = facing ? !baseFlip : baseFlip
    }
  }

  if (spriteUrl) {
    return (
      <div
        ref={tokenRef}
        className={`token-sprite-container ${character.isDead ? 'token-dead' : ''}`}
        onClick={onClick}
      >
        <img
          src={spriteUrl}
          alt=""
          className={`token-sprite ${shouldFlip ? 'token-sprite-flip' : ''}`}
        />
        {!character.isDead && (
          <div className="token-hp-bar-bottom">
            <div className="token-hp-bar-fill" style={{ width: `${hpPercent * 100}%`, background: hpColor }} />
          </div>
        )}
        {isActive && <div className="token-active-badge">ACTIF</div>}
        {character.isLeader && <div className="token-leader-badge">👑</div>}
        {character.isCrystal && <div className="token-crystal-badge">💎</div>}
        <div className="token-status-icons">
          {hasPoison && <span className="status-icon">☠️</span>}
          {hasShield && <span className="status-icon">🛡️</span>}
          {isDodging && <span className="status-icon">💨</span>}
          {hasRage && <span className="status-icon">💢</span>}
        </div>
      </div>
    )
  }

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
      {terrainType && TERRAIN_BADGES[terrainType] && (
        <div className="token-terrain-badge">{TERRAIN_BADGES[terrainType]}</div>
      )}
    </div>
  )
}
