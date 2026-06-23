import { CLASS_COLORS } from '../data/config.js'

export default function InitiativeBar({ characters, initiativeOrder, currentTurnIndex, round, children }) {
  return (
    <div className="initiative-bar">
      <span className="initiative-label">Initiative</span>
      <div className="initiative-tokens">
        {initiativeOrder.map((id, idx) => {
          const char = characters[id]
          if (!char) return null
          const isCurrent = idx === currentTurnIndex
          const teamColor = char.team === 'ally' ? '#c9a84c' : '#8b2020'

          return (
            <div
              key={id}
              className={`initiative-token ${isCurrent ? 'initiative-current' : ''} ${char.isDead ? 'initiative-dead' : ''}`}
              style={{ borderColor: teamColor }}
              title={`${char.name} - ${char.hp}/${char.maxHp} PV`}
            >
              <span className="initiative-emoji">{char.emoji}</span>
              {isCurrent && <div className="initiative-arrow">▼</div>}
            </div>
          )
        })}
      </div>
      <span className="initiative-round">R{round}</span>
      {children}
    </div>
  )
}
