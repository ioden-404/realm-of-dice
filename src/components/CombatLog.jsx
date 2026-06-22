import { useEffect, useRef } from 'react'

export default function CombatLog({ log }) {
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [log.length])

  return (
    <div className="combat-log" ref={scrollRef}>
      {log.map((entry, i) => (
        <div
          key={i}
          className={`log-entry log-${entry.type || 'info'}`}
        >
          {entry.text}
        </div>
      ))}
    </div>
  )
}
