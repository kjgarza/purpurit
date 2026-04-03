"use client"

import { useState } from "react"
import type { Decade } from "@repo/utils"
import { AudioProvider, useAudioContext } from "@/context/audio-context"
import { Entrance } from "@/components/entrance"
import { SlideEngine } from "@/components/slide-engine"
import { AudioToggle } from "@/components/audio-toggle"

function MemorialInner({ decades }: { decades: Decade[] }) {
  const [preloading, setPreloading] = useState(false)
  const [entered, setEntered] = useState(false)
  const { setUserHasInteracted } = useAudioContext()

  function handleInteract() {
    setPreloading(true)
  }

  function handleEnter() {
    setUserHasInteracted(true)
    setEntered(true)
  }

  return (
    <>
      {!entered && <Entrance onEnter={handleEnter} onInteract={handleInteract} />}
      {preloading && <SlideEngine decades={decades} />}
      {entered && <AudioToggle />}
    </>
  )
}

export function MemorialExperience({ decades }: { decades: Decade[] }) {
  return (
    <AudioProvider>
      <MemorialInner decades={decades} />
    </AudioProvider>
  )
}
