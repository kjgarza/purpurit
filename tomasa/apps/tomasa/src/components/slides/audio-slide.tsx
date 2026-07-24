"use client"

import Image from "next/image"
import type { Slide } from "@repo/utils"
import { mediaPath } from "@/lib/base-path"

export function AudioSlide({ slide }: { slide: Slide }) {
  const hasImage = Boolean(slide.imageSrc)

  return (
    <div
      className="snap-start relative min-h-dvh flex flex-col overflow-hidden canvas-grain"
      style={{ backgroundColor: "var(--cactus)" }}
    >
      {/* Optional background photo, dimmed under cactus green */}
      {hasImage && (
        <>
          <Image
            src={mediaPath(slide.imageSrc!)}
            alt={slide.imageAlt ?? ""}
            fill
            sizes="100vw"
            className="object-cover object-center opacity-30"
          />
          <div
            className="absolute inset-0 slide-scrim"
            style={{ background: "linear-gradient(to top, oklch(0.32 0.06 155 / 0.9) 0%, oklch(0.32 0.06 155 / 0.5) 60%, transparent 100%)" }}
          />
        </>
      )}

      {/* Content — giant quotation mark, italic display quote, marigold play */}
      <div className="relative z-10 flex h-full flex-col justify-center gap-0 px-6 pb-28 pt-16 md:pl-24 md:pr-16 md:pb-16">
        <span
          className="font-display font-black slide-animate"
          style={{ color: "var(--marigold)", fontSize: "6rem", lineHeight: 0.5 }}
          aria-hidden="true"
        >
          &ldquo;
        </span>

        {slide.text && (
          <blockquote
            className="font-display font-semibold italic mt-4 mb-8 max-w-2xl text-[1.7rem] leading-[1.32] slide-animate-d1 md:text-4xl"
            style={{ color: "var(--paper)" }}
          >
            {slide.text}
          </blockquote>
        )}

        <div className="flex items-center gap-4 slide-animate-d2">
          <button
            type="button"
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95"
            style={{
              backgroundColor: "var(--marigold)",
              color: "var(--ink)",
              boxShadow: "0 10px 26px oklch(0.2 0.04 155 / 0.35)",
            }}
            aria-label="Reproducir audio"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="ml-0.5 h-6 w-6"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>

          {slide.attribution && (
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.22em]"
              style={{ color: "oklch(0.92 0.05 85 / 0.75)" }}
            >
              {slide.attribution}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
