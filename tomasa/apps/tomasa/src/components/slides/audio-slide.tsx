"use client"

import Image from "next/image"
import type { Slide } from "@repo/utils"
import { mediaPath } from "@/lib/base-path"

export function AudioSlide({ slide }: { slide: Slide }) {
  const hasImage = Boolean(slide.imageSrc)

  return (
    <div className="snap-start relative min-h-dvh flex flex-col overflow-hidden">
      {/* Background */}
      {hasImage ? (
        <>
          <Image
            src={mediaPath(slide.imageSrc!)}
            alt={slide.imageAlt ?? ""}
            fill
            sizes="100vw"
            className="object-cover object-center"
          />
          <div
            className="absolute inset-0 slide-scrim"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.2) 55%, transparent 70%)" }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-background" />
      )}

      {/* Content — bottom-left on image slides, centered on plain */}
      <div
        className={`relative z-10 flex flex-col h-full gap-6 px-6 md:pl-20 md:pr-12 ${
          hasImage
            ? "justify-end pb-24 md:pb-16"
            : "justify-center py-16"
        }`}
      >
        {slide.text && (
          <blockquote
            className={`font-display font-bold text-3xl md:text-5xl leading-tight max-w-2xl slide-animate-d1 ${
              hasImage ? "text-white" : "text-foreground italic"
            }`}
          >
            &ldquo;{slide.text}&rdquo;
          </blockquote>
        )}

        <div className="flex items-center gap-5 slide-animate-d2">
          <button
            type="button"
            className="flex items-center justify-center w-14 h-14 rounded-full transition-all hover:scale-105 active:scale-95 shrink-0"
            style={
              hasImage
                ? {
                    backgroundColor: "rgba(255,255,255,0.2)",
                    color: "white",
                    backdropFilter: "blur(6px)",
                    border: "1.5px solid rgba(255,255,255,0.35)",
                  }
                : {
                    backgroundColor: "var(--primary)",
                    color: "var(--primary-foreground)",
                  }
            }
            aria-label="Reproducir audio"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6 ml-0.5"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>

          {slide.attribution && (
            <p
              className={`text-sm leading-relaxed italic ${
                hasImage ? "text-white/75" : "text-muted-foreground"
              }`}
            >
              {slide.attribution}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
