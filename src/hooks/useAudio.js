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

export function useAudio(src) {
  const audioRef = useRef(null)
  const [started, setStarted] = useState(false)
  const [volume, setVolumeState] = useState(() => loadSettings().volume)
  const [muted, setMutedState] = useState(() => loadSettings().muted)

  useEffect(() => {
    const audio = new Audio(src)
    audio.loop = true
    audio.volume = muted ? 0 : volume
    audioRef.current = audio
    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [src])

  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.volume = muted ? 0 : volume
    saveSettings({ volume, muted })
  }, [volume, muted])

  const start = useCallback(() => {
    if (started || !audioRef.current) return
    audioRef.current.play().catch(() => {})
    setStarted(true)
  }, [started])

  const setVolume = useCallback((v) => {
    setVolumeState(v)
  }, [])

  const toggleMute = useCallback(() => {
    setMutedState(m => !m)
  }, [])

  return { volume, muted, setVolume, toggleMute, start }
}
