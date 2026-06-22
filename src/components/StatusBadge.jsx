import { useState } from 'react'

const STATUS_INFO = {
  poison: {
    icon: '☠️',
    label: 'Poison',
    desc: 'Subit des dégâts au début de chaque tour.'
  },
  rage: {
    icon: '💢',
    label: 'Rage',
    desc: '+2 bonus d\'attaque, +1d4 dégâts par attaque. Déclenché par la chute d\'un allié.'
  },
  dodge: {
    icon: '💨',
    label: 'Dodge',
    desc: 'Désavantage sur toutes les attaques reçues jusqu\'au prochain tour.'
  },
  stunned: {
    icon: '⚡',
    label: 'Étourdi',
    desc: 'Ne peut effectuer aucune action ce tour.'
  },
  shield: {
    icon: '🛡️',
    label: 'Bouclier magique',
    desc: 'Absorbe les prochains dégâts reçus.'
  },
  faithShield: {
    icon: '✨',
    label: 'Bouclier de foi',
    desc: 'Absorbe les prochains dégâts. Maintenu par Concentration du Clerc.'
  },
  defensePosture: {
    icon: '🛡️',
    label: 'Posture défensive',
    desc: '+2 CA jusqu\'au prochain tour.'
  },
  antiHeal: {
    icon: '💀',
    label: 'Poison corrosif',
    desc: 'Les soins reçus sont réduits de 50%.'
  },
  cursedMark: {
    icon: '💀',
    label: 'Marque maudite',
    desc: 'Le prochain soin reçu est annulé.'
  },
  hunted: {
    icon: '🎯',
    label: 'Marque de chasse',
    desc: 'Reçoit +1d6 dégâts de toutes les sources.'
  },
  advantage: {
    icon: '⬆️',
    label: 'Avantage',
    desc: 'Lance 2d20 et garde le meilleur sur la prochaine attaque.'
  },
  concentration: {
    icon: '🔮',
    label: 'Concentration',
    desc: 'Maintient un sort actif. Peut être brisé si le lanceur subit des dégâts.'
  },
  disengaged: {
    icon: '🏃',
    label: 'Désengagé',
    desc: 'Peut quitter la mêlée sans provoquer d\'attaque d\'opportunité.'
  },
  extraMovement: {
    icon: '💫',
    label: 'Mouvement bonus',
    desc: '+1 case de mouvement ce tour.'
  }
}

export default function StatusBadge({ status }) {
  const [open, setOpen] = useState(false)
  const info = STATUS_INFO[status.type] || { icon: '?', label: status.type, desc: '' }

  return (
    <span className="status-badge-wrap">
      <button
        className="status-badge"
        onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
      >
        {info.icon}
        {status.duration !== undefined && status.duration > 0 && (
          <span className="status-duration">{status.duration}</span>
        )}
      </button>
      {open && (
        <>
          <div className="status-tooltip-backdrop" onClick={() => setOpen(false)} />
          <div className="status-tooltip">
            <div className="status-tooltip-header">
              <span className="status-tooltip-icon">{info.icon}</span>
              <span className="status-tooltip-label">{info.label}</span>
              {status.duration !== undefined && status.duration > 0 && (
                <span className="status-tooltip-turns">{status.duration} tour{status.duration > 1 ? 's' : ''}</span>
              )}
            </div>
            <p className="status-tooltip-desc">{info.desc}</p>
            {status.damage && (
              <p className="status-tooltip-detail">🔥 {status.damage} dégâts/tour</p>
            )}
            {status.absorption !== undefined && (
              <p className="status-tooltip-detail">🛡️ {status.absorption} absorption restante</p>
            )}
            {status.acBonus && (
              <p className="status-tooltip-detail">🛡️ +{status.acBonus} CA</p>
            )}
          </div>
        </>
      )}
    </span>
  )
}
