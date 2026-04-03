"use client"

import type { Slide } from "@repo/utils"

export function AudioSlide({ slide }: { slide: Slide }) {
  return (
    <div className="snap-start min-h-dvh flex flex-col items-center justify-center relative overflow-hidden">
      {/* Base background */}
      <div className="absolute inset-0 bg-background" />

      {/* Canvas grain */}
      <div className="canvas-grain absolute inset-0" />

      {/* Content */}
      <div className="relative z-10 max-w-2xl flex flex-col items-center gap-8 px-6 py-12">
        {slide.text && (
          <blockquote className="font-serif text-2xl md:text-4xl text-foreground text-center leading-relaxed italic">
            {slide.text}
          </blockquote>
        )}

        <button
          type="button"
          className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-80"
          aria-label="Reproducir audio"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-7 h-7 ml-1"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>

        {slide.attribution && (
          <p className="text-sm text-muted-foreground text-center italic">
            {slide.attribution}
          </p>
        )}
      </div>
    </div>
  )
}
