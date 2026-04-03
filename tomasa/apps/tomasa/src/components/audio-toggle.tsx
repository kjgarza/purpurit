"use client"

import { useCallback } from "react"
import { useAudioContext } from "@/context/audio-context"

export function AudioToggle() {
  const { isMuted, toggleMute } = useAudioContext()

  const handleClick = useCallback(() => {
    toggleMute()
  }, [toggleMute])

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isMuted ? "Activar sonido" : "Silenciar"}
      className="fixed top-4 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-foreground/60 text-background backdrop-blur-sm transition-colors hover:bg-foreground/80"
    >
      {isMuted ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11 5 6 9H2v6h4l5 4V5Z" />
          <line x1="22" x2="16" y1="9" y2="15" />
          <line x1="16" x2="22" y1="9" y2="15" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11 5 6 9H2v6h4l5 4V5Z" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      )}
    </button>
  )
}
