import { useEffect, useState, useRef } from 'react'

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

const FRAME_TIMINGS = [500, 450, 600]

export default function CutIn({ classId, type, onComplete }) {
  const [frame, setFrame] = useState(0)
  const [flash, setFlash] = useState(false)
  const timersRef = useRef([])
  const images = getImages(classId)

  useEffect(() => {
    if (images.length === 0) {
      onComplete()
      return
    }

    images.forEach(src => {
      const img = new Image()
      img.src = src
    })

    let current = 0

    const schedule = (fn, delay) => {
      const id = setTimeout(fn, delay)
      timersRef.current.push(id)
      return id
    }

    const advance = () => {
      current++
      if (current >= images.length) {
        schedule(onComplete, FRAME_TIMINGS[current - 1])
      } else {
        setFlash(true)
        schedule(() => {
          setFlash(false)
          setFrame(current)
          schedule(advance, FRAME_TIMINGS[current])
        }, 80)
      }
    }

    schedule(advance, FRAME_TIMINGS[0])

    return () => {
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
    }
  }, [])

  if (images.length === 0) return null

  const frameAnim = frame === 0 ? 'cutin-slide-left' :
                    frame === 1 ? 'cutin-slide-right' :
                    'cutin-slam'

  return (
    <div className={`cutin-overlay cutin-overlay-${type}`}>
      {flash && <div className={`cutin-flash cutin-flash-${type}`} />}
      <div className={`cutin-frame ${frameAnim}`} key={frame}>
        <img src={images[frame]} alt="" className="cutin-image" />
      </div>
      <div className={`cutin-label cutin-label-${type}`}>
        {type === 'crit' ? '⚡ CRITIQUE !' : '💀 KILL !'}
      </div>
    </div>
  )
}
