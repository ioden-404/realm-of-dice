import { useEffect, useState } from 'react'

export default function DamageNumber({ amount, type, position }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 1200)
    return () => clearTimeout(timer)
  }, [])

  if (!visible || !amount) return null

  const color = type === 'heal' ? '#4caf50' : type === 'crit' ? '#e8c96a' : '#f44336'
  const prefix = type === 'heal' ? '+' : '-'

  return (
    <div
      className="damage-number"
      style={{ left: `${position.x}%`, top: position.y, color }}
    >
      {prefix}{amount}
    </div>
  )
}
