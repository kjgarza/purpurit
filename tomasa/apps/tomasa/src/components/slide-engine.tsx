"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { Decade, Slide } from "@repo/utils"
import { DecadeTitleSlide } from "@/components/slides/decade-title-slide"
import { PhotoSlide } from "@/components/slides/photo-slide"
import { ArtworkSlide } from "@/components/slides/artwork-slide"
import { AudioSlide } from "@/components/slides/audio-slide"
import { NarrativeSlide } from "@/components/slides/narrative-slide"
import { TimelineBar } from "@/components/timeline-bar"
import { Lightbox } from "@/components/lightbox"

interface SlideEngineProps {
  decades: Decade[]
}

function SlideByType({
  slide,
  onOpenLightbox,
}: {
  slide: Slide
  onOpenLightbox: (imageSrc: string, caption?: string) => void
}) {
  switch (slide.type) {
    case "photo":
      return <PhotoSlide slide={slide} />
    case "artwork":
      return <ArtworkSlide slide={slide} onOpenLightbox={onOpenLightbox} />
    case "audio":
      return <AudioSlide slide={slide} />
    case "narrative":
      return <NarrativeSlide slide={slide} />
    default:
      return null
  }
}

export function SlideEngine({ decades }: SlideEngineProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeDecadeId, setActiveDecadeId] = useState(decades[0]?.id ?? "")
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [lightboxCaption, setLightboxCaption] = useState<string | undefined>(undefined)

  const handleOpenLightbox = useCallback((imageSrc: string, caption?: string) => {
    setLightboxImage(imageSrc)
    setLightboxCaption(caption)
  }, [])

  const scrollToDecade = useCallback((decadeId: string) => {
    const el = document.getElementById(decadeId)
    if (el) {
      el.scrollIntoView({ behavior: "smooth" })
    }
  }, [])

  // IntersectionObserver to track active decade
  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    const sectionEls = decades.map((d) => document.getElementById(d.id)).filter(Boolean) as HTMLElement[]

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            setActiveDecadeId(entry.target.id)
          }
        }
      },
      {
        root: container,
        threshold: 0.5,
      },
    )

    for (const el of sectionEls) {
      observer.observe(el)
    }

    return () => observer.disconnect()
  }, [decades])

  // Keyboard navigation
  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    function handleKeyDown(e: KeyboardEvent) {
      const scrollContainer = scrollRef.current
      if (!scrollContainer) return

      const snapChildren = Array.from(
        scrollContainer.querySelectorAll<HTMLElement>(".snap-start"),
      )
      if (snapChildren.length === 0) return

      const containerTop = scrollContainer.scrollTop
      const currentIndex = snapChildren.findIndex(
        (child) => Math.abs(child.offsetTop - containerTop) < 10,
      )

      if (e.key === "ArrowDown" && currentIndex < snapChildren.length - 1) {
        e.preventDefault()
        snapChildren[currentIndex + 1]?.scrollIntoView({ behavior: "smooth" })
      } else if (e.key === "ArrowUp" && currentIndex > 0) {
        e.preventDefault()
        snapChildren[currentIndex - 1]?.scrollIntoView({ behavior: "smooth" })
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <>
      <div
        ref={scrollRef}
        className="snap-y-mandatory h-dvh overflow-y-auto"
      >
        {decades.map((decade) => (
          <section
            key={decade.id}
            id={decade.id}
            role="region"
            aria-label={decade.label}
          >
            <div className="snap-start min-h-dvh">
              <DecadeTitleSlide decade={decade} />
            </div>
            {decade.slides.map((slide) => (
              <div key={slide.id} className="snap-start min-h-dvh">
                <SlideByType
                  slide={slide}
                  onOpenLightbox={handleOpenLightbox}
                />
              </div>
            ))}
          </section>
        ))}
      </div>

      <TimelineBar
        decades={decades}
        activeDecadeId={activeDecadeId}
        onNavigate={scrollToDecade}
      />

      <Lightbox
        imageSrc={lightboxImage}
        caption={lightboxCaption}
        onClose={() => {
          setLightboxImage(null)
          setLightboxCaption(undefined)
        }}
      />
    </>
  )
}
