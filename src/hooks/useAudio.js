import { useRef, useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'rod-audio-settings'

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

export function useAudio(hubSrc, combatSrc) {
  const hubRef = useRef(null)
  const combatRef = useRef(null)
  const [started, setStarted] = useState(false)
  const [volume, setVolumeState] = useState(() => loadSettings().volume)
  const [muted, setMutedState] = useState(() => loadSettings().muted)
  const [track, setTrack] = useState('hub')

  useEffect(() => {
    const hub = new Audio(hubSrc)
    hub.loop = true
    hubRef.current = hub

    const combat = new Audio(combatSrc)
    combat.loop = true
    combatRef.current = combat

    return () => {
      hub.pause(); hub.src = ''
      combat.pause(); combat.src = ''
    }
  }, [hubSrc, combatSrc])

  useEffect(() => {
    const applyVolume = (audio) => {
      if (!audio) return
      try { audio.volume = volume } catch {}
      audio.muted = muted
    }
    applyVolume(hubRef.current)
    applyVolume(combatRef.current)
    saveSettings({ volume, muted })
  }, [volume, muted])

  useEffect(() => {
    if (!started) return
    if (track === 'combat') {
      hubRef.current?.pause()
      combatRef.current?.play().catch(() => {})
    } else {
      combatRef.current?.pause()
      hubRef.current?.play().catch(() => {})
    }
  }, [track, started])

  const start = useCallback(() => {
    if (started) return
    hubRef.current?.play().catch(() => {})
    setStarted(true)
  }, [started])

  const switchTrack = useCallback((t) => setTrack(t), [])
  const setVolume = useCallback((v) => setVolumeState(v), [])
  const toggleMute = useCallback(() => setMutedState(m => !m), [])

  return { volume, muted, setVolume, toggleMute, start, switchTrack, track }
}
