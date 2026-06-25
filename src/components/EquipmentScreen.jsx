import { useState } from 'react'
import { CLASS_COLORS, CLASS_EMOJIS } from '../data/config.js'
import { canEquip, getEquipmentForSlot, TIER_COLORS } from '../data/equipment.js'

const SLOT_ICONS = { weapon: '⚔️', armor: '🛡️', boots: '👢' }
const SLOT_LABELS = { weapon: 'Arme', armor: 'Armure', boots: 'Bottes' }

export default function EquipmentScreen({ characters, campaign, onEquip, onUnequip, onClose }) {
  const allies = Object.values(characters).filter(c => c.team === 'ally')
  const [selectedCharIdx, setSelectedCharIdx] = useState(0)
  const [expandedSlot, setExpandedSlot] = useState(null)

  const char = allies[selectedCharIdx]
  if (!char) return null

  const charEquip = campaign.equipment?.[char.id] || { weapon: null, armor: null, boots: null }
  const inventory = campaign.equipmentInventory || []

  const handleEquip = (item) => {
    onEquip(char.id, item)
    setExpandedSlot(null)
  }

  const handleUnequip = (slot) => {
    onUnequip(char.id, slot)
  }

  return (
    <div className="equipment-overlay" onClick={onClose}>
      <div className="equipment-screen" onClick={e => e.stopPropagation()}>
        <button className="equipment-close" onClick={onClose}>✕</button>

        <div className="equipment-tabs">
          {allies.map((a, i) => (
            <button
              key={a.id}
              className={`equipment-tab ${i === selectedCharIdx ? 'equipment-tab-active' : ''}`}
              style={{ '--tab-color': CLASS_COLORS[a.classId] }}
              onClick={() => { setSelectedCharIdx(i); setExpandedSlot(null) }}
            >
              <span className="equipment-tab-emoji">{a.emoji}</span>
              <span className="equipment-tab-name">{a.name}</span>
            </button>
          ))}
        </div>

        <div className="equipment-char-info">
          <span className="equipment-char-emoji">{char.emoji}</span>
          <div>
            <div className="equipment-char-name">{char.name}</div>
            <div className="equipment-char-class">{char.classData?.name}</div>
          </div>
        </div>

        <div className="equipment-slots">
          {['weapon', 'armor', 'boots'].map(slot => {
            const item = charEquip[slot]
            const isExpanded = expandedSlot === slot
            return (
              <div key={slot} className="equipment-slot-group">
                <button
                  className={`equipment-slot ${item ? `equipment-tier-${item.tier}` : 'equipment-slot-empty'}`}
                  onClick={() => setExpandedSlot(isExpanded ? null : slot)}
                >
                  <span className="equipment-slot-icon">{SLOT_ICONS[slot]}</span>
                  <div className="equipment-slot-info">
                    <span className="equipment-slot-label">{SLOT_LABELS[slot]}</span>
                    <span className="equipment-slot-name">{item ? item.name : 'Vide'}</span>
                  </div>
                  {item && <span className="equipment-slot-desc">{item.desc}</span>}
                  {item && (
                    <button className="equipment-unequip" onClick={(e) => { e.stopPropagation(); handleUnequip(slot) }}>✕</button>
                  )}
                </button>

                {isExpanded && (
                  <div className="equipment-available">
                    {getEquipmentForSlot(slot, char.classId, inventory).length === 0 && (
                      <div className="equipment-empty-msg">Aucun équipement disponible</div>
                    )}
                    {getEquipmentForSlot(slot, char.classId, inventory).map(eq => (
                      <button
                        key={eq.id}
                        className={`equipment-item equipment-tier-${eq.tier}`}
                        onClick={() => handleEquip(eq)}
                      >
                        <span className="equipment-item-icon">{eq.icon}</span>
                        <div className="equipment-item-info">
                          <span className="equipment-item-name">{eq.name}</span>
                          <span className="equipment-item-desc">{eq.desc}</span>
                        </div>
                        {eq.classRestriction && (
                          <div className="equipment-item-classes">
                            {eq.classRestriction.map(c => (
                              <span key={c} className="equipment-class-badge">{CLASS_EMOJIS[c]}</span>
                            ))}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="equipment-stats-summary">
          <span>🛡️ CA {char.ac}</span>
          <span>⚔️ ATK +{char.attackBonus}</span>
          <span>🏃 Mouv. {char.movement}</span>
        </div>
      </div>
    </div>
  )
}
