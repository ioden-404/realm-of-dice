import { useRef, useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'rod-audio-settings'
const FADE_MS = 800
const FADE_STEP = 50

function loadSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return { volume: 0.5, muted: false }
}

function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {}
}

function fadeOut(audio, duration = FADE_MS) {
  if (!audio || audio.paused) return Promise.resolve()
  return new Promise(resolve => {
    const startVol = audio.volume || 0.01
    const steps = duration / FADE_STEP
    const decrement = startVol / steps
    let current = startVol
    const interval = setInterval(() => {
      current -= decrement
      if (current <= 0) {
        clearInterval(interval)
        audio.volume = 0
        audio.pause()
        resolve()
      } else {
        try { audio.volume = current } catch { clearInterval(interval); audio.pause(); resolve() }
      }
    }, FADE_STEP)
  })
}

function fadeIn(audio, targetVol, duration = FADE_MS) {
  if (!audio) return
  audio.volume = 0
  audio.play().catch(() => {})
  const steps = duration / FADE_STEP
  const increment = targetVol / steps
  let current = 0
  const interval = setInterval(() => {
    current += increment
    if (current >= targetVol) {
      clearInterval(interval)
      try { audio.volume = targetVol } catch {}
    } else {
      try { audio.volume = current } catch { clearInterval(interval) }
    }
  }, FADE_STEP)
}

export function useAudio(tracks) {
  const audioRefs = useRef({})
  const fadeRef = useRef(null)
  const [started, setStarted] = useState(false)
  const [volume, setVolumeState] = useState(() => loadSettings().volume)
  const [muted, setMutedState] = useState(() => loadSettings().muted)
  const [currentTrack, setCurrentTrack] = useState('hub')

  useEffect(() => {
    const refs = {}
    for (const [name, src] of Object.entries(tracks)) {
      const audio = new Audio(src)
      audio.loop = true
      audio.volume = 0
      refs[name] = audio
    }
    audioRefs.current = refs
    return () => {
      for (const audio of Object.values(refs)) {
        audio.pause()
        audio.src = ''
      }
    }
  }, [])

  useEffect(() => {
    const vol = muted ? 0 : volume
    const active = audioRefs.current[currentTrack]
    if (active && !active.paused) {
      try { active.volume = vol } catch {}
    }
    saveSettings({ volume, muted })
  }, [volume, muted])

  useEffect(() => {
    if (!started) return

    if (fadeRef.current) clearTimeout(fadeRef.current)

    const targetVol = muted ? 0 : volume
    const refs = audioRefs.current

    for (const [name, audio] of Object.entries(refs)) {
      if (name === currentTrack) {
        if (audio.paused) {
          fadeIn(audio, targetVol)
        }
      } else if (!audio.paused) {
        fadeOut(audio)
      }
    }
  }, [currentTrack, started])

  const start = useCallback(() => {
    if (started) return
    const audio = audioRefs.current[currentTrack]
    if (audio) {
      const vol = muted ? 0 : volume
      audio.volume = vol
      audio.play().catch(() => {})
    }
    setStarted(true)
  }, [started, currentTrack, volume, muted])

  const switchTrack = useCallback((t) => {
    if (t !== currentTrack) setCurrentTrack(t)
  }, [currentTrack])

  const setVolume = useCallback((v) => setVolumeState(v), [])
  const toggleMute = useCallback(() => setMutedState(m => !m), [])

  return { volume, muted, setVolume, toggleMute, start, switchTrack, track: currentTrack }
}
