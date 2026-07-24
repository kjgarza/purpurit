import Image from "next/image"
import type { Slide } from "@repo/utils"
import { mediaPath } from "@/lib/base-path"

/** Deterministic tilt from slide id */
function pickRotation(id: string): number {
  let h = 5381
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(h, 31) + id.charCodeAt(i)) | 0
  }
  const options = [-5, -3, 3, 4, 5]
  return options[Math.abs(h) % options.length]
}

export function NarrativeSlide({ slide }: { slide: Slide }) {
  const hasImage = Boolean(slide.imageSrc)
  const rotate = pickRotation(slide.id)

  return (
    <div className="snap-start relative min-h-dvh flex flex-col overflow-hidden">
      {/* Aged-paper background */}
      <div className="absolute inset-0 bg-background" />

      {/* Cobalt running head with editorial furniture */}
      <div
        className="relative z-10 flex items-center gap-3 px-6 pb-3 pt-14 md:pl-24 md:pr-12 md:pt-6"
        style={{ backgroundColor: "var(--cobalt)" }}
      >
        <span className="slide-label" style={{ color: "var(--marigold)" }}>
          {slide.subtitle ?? "Recuerdo"}
        </span>
        <span className="h-px flex-1" style={{ backgroundColor: "oklch(0.92 0.05 85 / 0.3)" }} />
      </div>

      {/* ── Text block ── */}
      <div
        className="relative z-10 flex flex-col px-6 pt-8 pb-0 md:pl-24 md:pr-16 md:pt-12"
        style={{ maxWidth: "min(680px, 100%)" }}
      >
        {slide.title && (
          <h3 className="font-display font-black text-[2.6rem] leading-[0.98] tracking-tight text-foreground slide-animate md:text-[4rem] md:leading-[0.98]">
            {slide.title}
          </h3>
        )}

        <div className="editorial-rule mt-5 slide-animate-d1" />

        {slide.text && (
          <p className="font-serif mt-5 max-w-prose text-lg leading-[1.68] text-foreground/82 slide-animate-d2 md:text-xl">
            {slide.text}
          </p>
        )}

        {slide.attribution && (
          <p
            className="font-serif mt-4 text-[13px] italic slide-animate-d2"
            style={{ color: "var(--clay)" }}
          >
            — {slide.attribution}
          </p>
        )}
      </div>

      {/* ── Taped drawing crossing the right edge ── */}
      {hasImage && (
        <div
          className="absolute z-0"
          style={{ right: -34, bottom: 64 }}
        >
          <div
            className="relative slide-animate-shape"
            style={{
              backgroundColor: "#fff",
              padding: "9px 9px 26px",
              boxShadow: "0 18px 44px oklch(0.25 0.02 60 / 0.28)",
              ["--paper-rotate" as string]: `${rotate}deg`,
              transform: `rotate(${rotate}deg)`,
            }}
          >
            <div className="relative" style={{ width: 196, height: 196 }}>
              <Image
                src={mediaPath(slide.imageSrc!)}
                alt={slide.imageAlt ?? ""}
                fill
                sizes="(min-width: 768px) 260px, 196px"
                className="object-cover object-center"
              />
            </div>
            {/* Washi tape at top */}
            <div
              className="washi-tape"
              style={{ top: -10, left: "50%", transform: "translateX(-50%) rotate(3deg)" }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
