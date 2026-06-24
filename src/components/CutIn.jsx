import { useEffect, useState } from 'react'

const B = import.meta.env.BASE_URL

const CLASS_IMAGE_MAP = {
  guerrier: 'bdguerrier',
  mage: 'bdmage',
  voleur: 'bdvoleur',
  rodeur: 'bdrôdeur',
  clerc: 'bdclerc'
}

function getImages(classId) {
  const base = CLASS_IMAGE_MAP[classId]
  if (!base) return []
  return [
    `${B}Images/${base}1.png`,
    `${B}Images/${base}2.png`,
    `${B}Images/${base}3.png`
  ]
}

export default function CutIn({ classId, type, onComplete }) {
  const [frame, setFrame] = useState(0)
  const images = getImages(classId)

  useEffect(() => {
    if (images.length === 0) {
      onComplete()
      return
    }

    const timings = [400, 400, 500]
    let current = 0

    const advance = () => {
      current++
      if (current >= images.length) {
        setTimeout(onComplete, timings[current - 1])
      } else {
        setFrame(current)
        setTimeout(advance, timings[current])
      }
    }

    setTimeout(advance, timings[0])

    return () => {}
  }, [])

  if (images.length === 0) return null

  return (
    <div className="cutin-overlay">
      <div className={`cutin-frame cutin-${type}`} key={frame}>
        <img
          src={images[frame]}
          alt=""
          className="cutin-image"
        />
      </div>
      <div className={`cutin-label cutin-label-${type}`}>
        {type === 'crit' ? '⚡ CRITIQUE !' : '💀 KILL !'}
      </div>
    </div>
  )
}
