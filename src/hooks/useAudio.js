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
  const ctxRef = useRef(null)
  const hubRef = useRef(null)
  const combatRef = useRef(null)
  const hubGainRef = useRef(null)
  const combatGainRef = useRef(null)
  const [started, setStarted] = useState(false)
  const [volume, setVolumeState] = useState(() => loadSettings().volume)
  const [muted, setMutedState] = useState(() => loadSettings().muted)
  const [track, setTrack] = useState('hub')

  useEffect(() => {
    const hub = new Audio(hubSrc)
    hub.loop = true
    hub.crossOrigin = 'anonymous'
    hubRef.current = hub

    const combat = new Audio(combatSrc)
    combat.loop = true
    combat.crossOrigin = 'anonymous'
    combatRef.current = combat

    return () => {
      hub.pause(); hub.src = ''
      combat.pause(); combat.src = ''
    }
  }, [hubSrc, combatSrc])

  const ensureContext = useCallback(() => {
    if (ctxRef.current) return
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    ctxRef.current = ctx

    const hubGain = ctx.createGain()
    hubGain.connect(ctx.destination)
    hubGainRef.current = hubGain

    const combatGain = ctx.createGain()
    combatGain.connect(ctx.destination)
    combatGainRef.current = combatGain

    if (hubRef.current) {
      try {
        const hubSource = ctx.createMediaElementSource(hubRef.current)
        hubSource.connect(hubGain)
      } catch {}
    }
    if (combatRef.current) {
      try {
        const combatSource = ctx.createMediaElementSource(combatRef.current)
        combatSource.connect(combatGain)
      } catch {}
    }
  }, [])

  useEffect(() => {
    const vol = muted ? 0 : volume
    if (hubGainRef.current) hubGainRef.current.gain.value = vol
    if (combatGainRef.current) combatGainRef.current.gain.value = vol
    if (hubRef.current) hubRef.current.volume = vol
    if (combatRef.current) combatRef.current.volume = vol
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
    ensureContext()
    if (ctxRef.current?.state === 'suspended') ctxRef.current.resume()
    hubRef.current?.play().catch(() => {})
    setStarted(true)
  }, [started, ensureContext])

  const switchTrack = useCallback((t) => setTrack(t), [])
  const setVolume = useCallback((v) => setVolumeState(v), [])
  const toggleMute = useCallback(() => setMutedState(m => !m), [])

  return { volume, muted, setVolume, toggleMute, start, switchTrack, track }
}
