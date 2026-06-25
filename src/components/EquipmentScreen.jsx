import { useState } from 'react'
import { CLASS_COLORS, CLASS_EMOJIS } from '../data/config.js'
import { canEquip, getEquipmentForSlot, TIER_COLORS } from '../data/equipment.js'

const B = import.meta.env.BASE_URL
const TOKEN_IMAGES = {
  guerrier: B + 'Images/guerriertoken.png',
  mage: B + 'Images/magetoken.png',
  voleur: B + 'Images/voleurtoken.png',
  rodeur: B + 'Images/Rodeurtoken.png',
  clerc: B + 'Images/clerctoken.png'
}

const SLOT_ICONS = { weapon: '⚔️', armor: '🛡️', boots: '👢' }
const SLOT_LABELS = { weapon: 'Arme', armor: 'Armure', boots: 'Bottes' }

export default function EquipmentScreen({ characters, campaign, initialCharId, onEquip, onUnequip, onClose }) {
  const allies = Object.values(characters).filter(c => c.team === 'ally')
  const initialIdx = Math.max(0, allies.findIndex(c => c.id === initialCharId))
  const [selectedCharIdx, setSelectedCharIdx] = useState(initialIdx)
  const [expandedSlot, setExpandedSlot] = useState(null)

  const char = allies[selectedCharIdx]
  if (!char) return null

  const charEquip = campaign.equipment?.[char.id] || { weapon: null, armor: null, boots: null }
  const inventory = campaign.equipmentInventory || []
  const spriteUrl = TOKEN_IMAGES[char.classId]

  const handleEquip = (item) => {
    onEquip(char.id, item)
    setExpandedSlot(null)
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
            </button>
          ))}
        </div>

        <div className="equipment-char-header">
          <span className="equipment-char-name" style={{ color: CLASS_COLORS[char.classId] }}>{char.name}</span>
          <span className="equipment-char-class">{char.classData?.name}</span>
        </div>

        <div className="equipment-body">
          <div className="equipment-slot-col">
            {renderSlot('weapon', charEquip, expandedSlot, setExpandedSlot, handleEquip, onUnequip, char, inventory)}
          </div>

          <div className="equipment-portrait">
            {spriteUrl ? (
              <img src={spriteUrl} alt="" className="equipment-sprite" />
            ) : (
              <span className="equipment-portrait-emoji">{char.emoji}</span>
            )}
          </div>

          <div className="equipment-slot-col">
            {renderSlot('armor', charEquip, expandedSlot, setExpandedSlot, handleEquip, onUnequip, char, inventory)}
            {renderSlot('boots', charEquip, expandedSlot, setExpandedSlot, handleEquip, onUnequip, char, inventory)}
          </div>
        </div>

        <div className="equipment-stats">
          <div className="equipment-stat">
            <span className="equipment-stat-icon">🛡️</span>
            <span className="equipment-stat-label">CA</span>
            <span className="equipment-stat-value">{char.ac}</span>
          </div>
          <div className="equipment-stat">
            <span className="equipment-stat-icon">⚔️</span>
            <span className="equipment-stat-label">ATK</span>
            <span className="equipment-stat-value">+{char.attackBonus}</span>
          </div>
          <div className="equipment-stat">
            <span className="equipment-stat-icon">🏃</span>
            <span className="equipment-stat-label">Mouv.</span>
            <span className="equipment-stat-value">{char.movement}</span>
          </div>
          <div className="equipment-stat">
            <span className="equipment-stat-icon">❤️</span>
            <span className="equipment-stat-label">PV</span>
            <span className="equipment-stat-value">{char.hp}/{char.maxHp}</span>
          </div>
        </div>

        {expandedSlot && (
          <div className="equipment-available">
            <div className="equipment-available-title">{SLOT_ICONS[expandedSlot]} {SLOT_LABELS[expandedSlot]} disponibles</div>
            {getEquipmentForSlot(expandedSlot, char.classId, inventory).length === 0 && (
              <div className="equipment-empty-msg">Aucun équipement disponible</div>
            )}
            {getEquipmentForSlot(expandedSlot, char.classId, inventory).map(eq => (
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
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function renderSlot(slot, charEquip, expandedSlot, setExpandedSlot, handleEquip, onUnequip, char, inventory) {
  const item = charEquip[slot]
  const isExpanded = expandedSlot === slot
  return (
    <button
      className={`equipment-slot ${item ? `equipment-tier-${item.tier}` : 'equipment-slot-empty'} ${isExpanded ? 'equipment-slot-selected' : ''}`}
      onClick={() => setExpandedSlot(isExpanded ? null : slot)}
    >
      <span className="equipment-slot-icon">{item ? item.icon : SLOT_ICONS[slot]}</span>
      <span className="equipment-slot-name">{item ? item.name : SLOT_LABELS[slot]}</span>
      {item && (
        <button className="equipment-unequip" onClick={(e) => { e.stopPropagation(); onUnequip(char.id, slot) }}>✕</button>
      )}
    </button>
  )
}
