"use client"

import {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react"
import type { ReactNode } from "react"

interface AudioContextValue {
  isMuted: boolean
  toggleMute: () => void
  isInlinePlaying: boolean
  setInlinePlaying: (playing: boolean) => void
  userHasInteracted: boolean
  setUserHasInteracted: (interacted: boolean) => void
}

const AudioContext = createContext<AudioContextValue | null>(null)

export function AudioProvider({ children }: { children: ReactNode }) {
  const [isMuted, setIsMuted] = useState(false)
  const [isInlinePlaying, setInlinePlaying] = useState(false)
  const [userHasInteracted, setUserHasInteracted] = useState(false)

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev)
  }, [])

  const handleSetInlinePlaying = useCallback((playing: boolean) => {
    setInlinePlaying(playing)
  }, [])

  const handleSetUserHasInteracted = useCallback((interacted: boolean) => {
    setUserHasInteracted(interacted)
  }, [])

  return (
    <AudioContext.Provider
      value={{
        isMuted,
        toggleMute,
        isInlinePlaying,
        setInlinePlaying: handleSetInlinePlaying,
        userHasInteracted,
        setUserHasInteracted: handleSetUserHasInteracted,
      }}
    >
      {children}
    </AudioContext.Provider>
  )
}

export function useAudioContext(): AudioContextValue {
  const context = useContext(AudioContext)
  if (!context) {
    throw new Error("useAudioContext must be used within an AudioProvider")
  }
  return context
}
