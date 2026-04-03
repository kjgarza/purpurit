"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useAudioContext } from "@/context/audio-context"

interface UseAudioReturn {
  play: () => void
  pause: () => void
  toggle: () => void
  isPlaying: boolean
  currentTime: number
  duration: number
}

export function useAudio(src: string | undefined): UseAudioReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const { isMuted, setInlinePlaying } = useAudioContext()

  useEffect(() => {
    if (typeof window === "undefined" || !src) return

    const audio = new Audio(src)
    audioRef.current = audio

    const onPlay = () => {
      setIsPlaying(true)
      setInlinePlaying(true)
    }
    const onPause = () => {
      setIsPlaying(false)
      setInlinePlaying(false)
    }
    const onEnded = () => {
      setIsPlaying(false)
      setInlinePlaying(false)
    }
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }
    const onLoadedMetadata = () => {
      setDuration(audio.duration)
    }

    audio.addEventListener("play", onPlay)
    audio.addEventListener("pause", onPause)
    audio.addEventListener("ended", onEnded)
    audio.addEventListener("timeupdate", onTimeUpdate)
    audio.addEventListener("loadedmetadata", onLoadedMetadata)

    return () => {
      audio.pause()
      audio.removeEventListener("play", onPlay)
      audio.removeEventListener("pause", onPause)
      audio.removeEventListener("ended", onEnded)
      audio.removeEventListener("timeupdate", onTimeUpdate)
      audio.removeEventListener("loadedmetadata", onLoadedMetadata)
      audioRef.current = null
    }
  }, [src, setInlinePlaying])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted
    }
  }, [isMuted])

  const play = useCallback(() => {
    audioRef.current?.play()
  }, [])

  const pause = useCallback(() => {
    audioRef.current?.pause()
  }, [])

  const toggle = useCallback(() => {
    if (!audioRef.current) return
    if (audioRef.current.paused) {
      audioRef.current.play()
    } else {
      audioRef.current.pause()
    }
  }, [])

  return { play, pause, toggle, isPlaying, currentTime, duration }
}
