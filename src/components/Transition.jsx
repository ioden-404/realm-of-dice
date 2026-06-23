import { useEffect, useState } from 'react'

export default function Transition({ active, onComplete }) {
  const [phase, setPhase] = useState('idle')

  useEffect(() => {
    if (!active) {
      setPhase('idle')
      return
    }

    setPhase('cover')
    const revealTimer = setTimeout(() => setPhase('reveal'), 500)
    const doneTimer = setTimeout(() => {
      setPhase('idle')
      onComplete()
    }, 1000)

    return () => {
      clearTimeout(revealTimer)
      clearTimeout(doneTimer)
    }
  }, [active])

  if (phase === 'idle') return null

  return (
    <div className={`transition-overlay transition-${phase}`}>
      <div className="transition-parchment" />
    </div>
  )
}
