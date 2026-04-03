"use client"

import { useEffect, useRef, useCallback } from "react"
import type { Decade } from "@repo/utils"
import { useAudioContext } from "@/context/audio-context"

const BASE_VOLUME = 0.15
const DUCKED_VOLUME = 0.02
const FADE_DURATION = 1000
const FADE_INTERVAL = 50

export function useAmbientAudio(activeDecadeId: string, decades: Decade[]): void {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fadeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { isMuted, isInlinePlaying, userHasInteracted } = useAudioContext()

  const targetVolume = isMuted ? 0 : isInlinePlaying ? DUCKED_VOLUME : BASE_VOLUME

  const clearFadeTimer = useCallback(() => {
    if (fadeTimerRef.current !== null) {
      clearInterval(fadeTimerRef.current)
      fadeTimerRef.current = null
    }
  }, [])

  const fadeVolume = useCallback(
    (audio: HTMLAudioElement, from: number, to: number, onComplete?: () => void) => {
      clearFadeTimer()
      const steps = FADE_DURATION / FADE_INTERVAL
      const delta = (to - from) / steps
      let step = 0

      fadeTimerRef.current = setInterval(() => {
        step++
        const newVolume = Math.min(1, Math.max(0, from + delta * step))
        audio.volume = newVolume

        if (step >= steps) {
          clearFadeTimer()
          audio.volume = Math.min(1, Math.max(0, to))
          onComplete?.()
        }
      }, FADE_INTERVAL)
    },
    [clearFadeTimer],
  )

  // Handle decade changes — cross-fade
  useEffect(() => {
    if (typeof window === "undefined" || !userHasInteracted) return

    const decade = decades.find((d) => d.id === activeDecadeId)
    const newSrc = decade?.ambientAudioSrc

    const currentAudio = audioRef.current

    // If no new source, fade out current and stop
    if (!newSrc) {
      if (currentAudio) {
        fadeVolume(currentAudio, currentAudio.volume, 0, () => {
          currentAudio.pause()
          audioRef.current = null
        })
      }
      return
    }

    // If same source is already playing, do nothing
    if (currentAudio && currentAudio.src.endsWith(newSrc)) {
      return
    }

    // Cross-fade: fade out old, fade in new
    const newAudio = new Audio(newSrc)
    newAudio.loop = true
    newAudio.volume = 0

    const startNewAudio = () => {
      audioRef.current = newAudio
      const vol = isMuted ? 0 : isInlinePlaying ? DUCKED_VOLUME : BASE_VOLUME
      newAudio.play().then(() => {
        fadeVolume(newAudio, 0, vol)
      }).catch(() => {
        // Playback blocked — ignore
      })
    }

    if (currentAudio) {
      fadeVolume(currentAudio, currentAudio.volume, 0, () => {
        currentAudio.pause()
        startNewAudio()
      })
    } else {
      startNewAudio()
    }

    return () => {
      // Cleanup only on unmount is handled below
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDecadeId, decades, userHasInteracted])

  // Handle volume changes (mute / ducking)
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || typeof window === "undefined") return

    fadeVolume(audio, audio.volume, targetVolume)
  }, [targetVolume, fadeVolume])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearFadeTimer()
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [clearFadeTimer])
}
