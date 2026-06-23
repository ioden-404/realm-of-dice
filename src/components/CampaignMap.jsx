import { ACTS, NODE_TYPES, XP_PALIERS, SHOP_ITEMS } from '../data/campaign.js'

const EVOLUTION_DETAILS = {
  guerrier: { from: 'Guerrier', to: 'Chevalier', change: 'Attaque puissante : CD réduit' },
  mage: { from: 'Mage', to: 'Archimage', change: 'Sort mineur : 1d8+3 dégâts' },
  voleur: { from: 'Voleur', to: 'Assassin', change: 'Coup fatal : seuil 30%' },
  rodeur: { from: 'Rôdeur', to: 'Traqueur', change: 'Tir précis : portée 6' },
  clerc: { from: 'Clerc', to: 'Haut-Clerc', change: 'Soin divin : CD réduit' }
}
import { CLASS_COLORS } from '../data/config.js'

const LAYER_H = 70
const NODE_R = 20

function getNodeX(nodeIdx, layerSize) {
  if (layerSize === 1) return 50
  const pad = 18
  return pad + (nodeIdx / (layerSize - 1)) * (100 - 2 * pad)
}

function getNodeY(layerIdx) {
  return layerIdx * LAYER_H + NODE_R + 10
}

export default function CampaignMap({
  campaign, characters, campaignEvent, stats,
  onSelectNode, onSelectReward, onEventDone, onAbandon
}) {
  const { map, currentLayer, lastNodeId, visitedNodes } = campaign
  const act = ACTS[campaign.act]
  const allies = Object.values(characters).filter(c => c.team === 'ally')
  const mapHeight = map.length * LAYER_H + 30

  const lastNode = lastNodeId ? map.flat().find(n => n.id === lastNodeId) : null

  function isAvailable(node) {
    if (node.layerIndex !== currentLayer) return false
    if (visitedNodes.includes(node.id)) return false
    if (!lastNode) return true
    return lastNode.connections.includes(node.nodeIndex)
  }

  function isReachable(node) {
    if (visitedNodes.includes(node.id)) return true
    if (isAvailable(node)) return true
    if (node.layerIndex <= currentLayer) return false

    let reachableFromAvailable = false
    const check = (layerIdx, parentConnections) => {
      if (layerIdx === node.layerIndex) {
        return parentConnections === null || parentConnections.includes(node.nodeIndex)
      }
      if (layerIdx >= map.length) return false
      const layer = map[layerIdx]
      for (const n of layer) {
        if (parentConnections !== null && !parentConnections.includes(n.nodeIndex)) continue
        if (check(layerIdx + 1, n.connections)) return true
      }
      return false
    }

    const availableNodes = map[currentLayer]?.filter(n => isAvailable(n)) || []
    for (const av of availableNodes) {
      if (node.layerIndex === currentLayer) {
        if (av.id === node.id) return true
      } else {
        const startConns = av.connections
        const checkFrom = (li, conns) => {
          if (li === node.layerIndex) return conns.includes(node.nodeIndex)
          if (li >= map.length) return false
          for (const idx of conns) {
            const n = map[li]?.[idx]
            if (n && checkFrom(li + 1, n.connections)) return true
          }
          return false
        }
        if (checkFrom(currentLayer + 1, startConns)) { reachableFromAvailable = true; break }
      }
    }
    return reachableFromAvailable
  }

  const themeClass = `cmap-theme-${act.terrainTheme || 'forest'}`

  return (
    <div className={`cmap ${themeClass}`}>
      <div className="cmap-scroll">
        <div className="cmap-header">
          <h2 className="cmap-title">{act.name}</h2>
        </div>

        <div className="cmap-team">
          {allies.map(char => {
            const pct = char.hp / char.maxHp
            const color = pct > 0.5 ? '#4caf50' : pct > 0.25 ? '#ff9800' : '#f44336'
            return (
              <div key={char.id} className="cmap-char">
                <span className="cmap-char-emoji">{char.emoji}</span>
                <div className="cmap-char-hp">
                  <div className="cmap-char-hp-fill" style={{ width: `${pct * 100}%`, background: color }} />
                </div>
                <span className="cmap-char-hp-text">{char.hp}/{char.maxHp}</span>
              </div>
            )
          })}
        </div>

        {stats && stats.damageDealt > 0 && currentLayer > 0 && (
          <div className="cmap-banner">⚔️ Victoire ! L'équipe récupère ses forces...</div>
        )}

        <div className="cmap-xp">
          <div className="cmap-xp-header">
            <span className="cmap-xp-label">XP : {campaign.xp || 0}</span>
            {(() => {
              const next = XP_PALIERS.find(p => !(campaign.appliedPaliers || []).includes(p.id))
              return next ? <span className="cmap-xp-next">Prochain : {next.label} ({next.xp} XP)</span> : <span className="cmap-xp-next">Max !</span>
            })()}
          </div>
          <div className="cmap-xp-bar">
            {XP_PALIERS.map(p => {
              const reached = (campaign.appliedPaliers || []).includes(p.id)
              const pct = Math.min((p.xp / 15) * 100, 100)
              return (
                <div
                  key={p.id}
                  className={`cmap-xp-pip ${reached ? 'cmap-xp-pip-done' : ''} ${p.isEvolution ? 'cmap-xp-pip-evo' : ''}`}
                  style={{ left: `${pct}%` }}
                  title={`${p.xp} XP : ${p.label}`}
                />
              )
            })}
            <div className="cmap-xp-fill" style={{ width: `${Math.min(((campaign.xp || 0) / 15) * 100, 100)}%` }} />
          </div>
        </div>

        <div className="cmap-gold">
          <span>🪙 {campaign.gold || 0} or</span>
        </div>

        {campaign.relics && campaign.relics.length > 0 && (
          <div className="cmap-relics">
            {campaign.relics.map((r, i) => (
              <span key={i} className="cmap-relic" title={r.name}>{r.icon}</span>
            ))}
          </div>
        )}

        {campaign.evolved && (
          <div className="cmap-evo-banner">
            <div className="cmap-evo-title">⚡ Classes évoluées !</div>
            {allies.map(char => {
              const evo = EVOLUTION_DETAILS[char.classId]
              return evo ? (
                <div key={char.id} className="cmap-evo-line">
                  <span>{char.emoji} {evo.from} → <strong>{evo.to}</strong></span>
                  <span className="cmap-evo-change">{evo.change}</span>
                </div>
              ) : null
            })}
          </div>
        )}

        <div className="cmap-grid" style={{ height: mapHeight }}>
          <svg className="cmap-lines" viewBox={`0 0 100 ${mapHeight}`} preserveAspectRatio="none">
            {map.map((layer, li) =>
              layer.map(node =>
                node.connections.map(ci => {
                  const nextLayer = map[li + 1]
                  if (!nextLayer || !nextLayer[ci]) return null
                  const x1 = getNodeX(node.nodeIndex, layer.length)
                  const y1 = getNodeY(li)
                  const x2 = getNodeX(ci, nextLayer.length)
                  const y2 = getNodeY(li + 1)
                  const isVisitedPath = visitedNodes.includes(node.id) && visitedNodes.includes(nextLayer[ci].id)
                  const isNextPath = visitedNodes.includes(node.id) && isAvailable(nextLayer[ci])
                  return (
                    <line
                      key={`${node.id}-${ci}`}
                      x1={x1} y1={y1} x2={x2} y2={y2}
                      className={`cmap-line ${isVisitedPath ? 'cmap-line-visited' : ''} ${isNextPath ? 'cmap-line-available' : ''}`}
                    />
                  )
                })
              )
            )}
          </svg>

          {map.map((layer, li) =>
            layer.map(node => {
              const x = getNodeX(node.nodeIndex, layer.length)
              const y = getNodeY(li)
              const visited = visitedNodes.includes(node.id)
              const available = isAvailable(node)
              const reachable = isReachable(node)
              const info = NODE_TYPES[node.type]
              return (
                <button
                  key={node.id}
                  className={`cmap-node ${visited ? 'cmap-node-visited' : ''} ${available ? 'cmap-node-available' : ''} ${!visited && !available && !reachable ? 'cmap-node-hidden' : ''}`}
                  style={{ left: `${x}%`, top: y }}
                  onClick={() => available && onSelectNode(node)}
                  disabled={!available}
                  title={info.label}
                >
                  <span className="cmap-node-icon">{info.icon}</span>
                  {node.type === 'boss' && <span className="cmap-node-boss-label">BOSS</span>}
                </button>
              )
            })
          )}
        </div>

        <button className="abandon-btn" onClick={onAbandon} style={{ marginTop: 8 }}>
          🚪 Abandonner la campagne
        </button>
      </div>

      {campaignEvent && (
        <div className="cmap-event-overlay" onClick={
          (campaignEvent.type === 'treasure' || campaignEvent.rewardSelected) ? onEventDone : undefined
        }>
          <div className="cmap-event" onClick={e => e.stopPropagation()}>
            {campaignEvent.type === 'treasure' && (
              <>
                <h3 className="cmap-event-title">🎁 Trésor trouvé !</h3>
                <p className="cmap-event-gold">+{campaignEvent.goldGain} 🪙</p>
                <button className="campaign-next-btn" onClick={onEventDone}>Continuer</button>
              </>
            )}

            {campaignEvent.type === 'merchant' && (
              <>
                <h3 className="cmap-event-title">🛒 Marchand ambulant</h3>
                <p className="cmap-event-desc">🪙 {campaign.gold || 0} or disponible</p>
                <div className="cmap-event-rewards">
                  {(campaignEvent.items || []).map(item => {
                    const canAfford = (campaign.gold || 0) >= item.cost
                    return (
                      <button
                        key={item.id}
                        className={`campaign-reward ${!canAfford ? 'reward-disabled' : ''}`}
                        onClick={() => canAfford && onSelectReward(item)}
                        disabled={!canAfford || campaignEvent.rewardSelected}
                      >
                        <span className="reward-icon">{item.icon}</span>
                        <div className="reward-info">
                          <span className="reward-name">{item.name}</span>
                          <span className="reward-desc">{item.desc}</span>
                        </div>
                        <span className="reward-cost">🪙 {item.cost}</span>
                      </button>
                    )
                  })}
                </div>
                <button className="campaign-next-btn" onClick={onEventDone}>Quitter la boutique</button>
              </>
            )}

            {(campaignEvent.type === 'relic-minor' || campaignEvent.type === 'relic-major') && (
              <>
                <h3 className="cmap-event-title">
                  {campaignEvent.type === 'relic-minor' ? '💀 Relique trouvée !' : '👹 Relique majeure !'}
                </h3>
                <p className="cmap-event-desc">Choisissez une relique</p>
                <div className="cmap-event-rewards">
                  {(campaignEvent.relics || []).map(r => (
                    <button
                      key={r.id}
                      className={`campaign-reward ${campaignEvent.type === 'relic-major' ? 'reward-major' : ''} ${campaignEvent.rewardSelected ? 'reward-disabled' : ''}`}
                      onClick={() => !campaignEvent.rewardSelected && onSelectReward(r)}
                      disabled={campaignEvent.rewardSelected}
                    >
                      <span className="reward-icon">{r.icon}</span>
                      <div className="reward-info">
                        <span className="reward-name">{r.name}</span>
                        <span className="reward-desc">{r.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
                {campaignEvent.rewardSelected && (
                  <button className="campaign-next-btn" onClick={onEventDone}>Continuer</button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
