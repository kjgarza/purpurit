import Image from "next/image"
import type { Slide } from "@repo/utils"
import { mediaPath } from "@/lib/base-path"

/** Deterministic small rotation from slide id */
function pickRotation(id: string): number {
  let h = 5381
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(h, 31) + id.charCodeAt(i)) | 0
  }
  const options = [-1.5, -1, 1, 1.5, 2]
  return options[Math.abs(h) % options.length]
}

export function ArtworkSlide({
  slide,
  onOpenLightbox,
}: {
  slide: Slide
  onOpenLightbox?: (imageSrc: string, caption?: string) => void
}) {
  const rotate = pickRotation(slide.id)

  return (
    <div
      className="artwork-slide snap-start min-h-dvh flex flex-col items-center justify-center relative overflow-hidden canvas-grain"
      style={{ backgroundColor: "var(--cobalt)" }}
    >
      <div className="relative z-10 flex flex-col items-center px-6 py-10 md:py-16 max-w-4xl md:pl-24 mx-auto">
        {slide.imageSrc && (
          <button
            type="button"
            className="group relative cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--marigold)] focus-visible:ring-offset-4 slide-animate"
            onClick={() => onOpenLightbox?.(mediaPath(slide.imageSrc!), slide.caption)}
            aria-label={slide.imageAlt ?? "Ver dibujo en tamaño completo"}
          >
            {/* Paper sheet taped to the cobalt wall */}
            <div
              className="relative p-3 transition-transform duration-500 group-hover:scale-[1.015]"
              style={{
                backgroundColor: "var(--paper)",
                transform: `rotate(${rotate}deg)`,
                boxShadow: "0 26px 60px oklch(0.18 0.06 265 / 0.5)",
              }}
            >
              <Image
                src={mediaPath(slide.imageSrc)}
                alt={slide.imageAlt ?? ""}
                width={800}
                height={800}
                className="max-h-[55vh] md:max-h-[60vh] w-auto h-auto object-contain"
                sizes="(max-width: 768px) 85vw, 700px"
              />
              {/* Washi tape corners */}
              <div className="washi-tape" style={{ top: -9, left: -14, transform: "rotate(-38deg)" }} />
              <div className="washi-tape" style={{ bottom: -8, right: -14, transform: "rotate(-38deg)" }} />
            </div>
          </button>
        )}

        {/* Caption area */}
        {(slide.caption || slide.attribution) && (
          <div className="mt-7 flex flex-col items-center text-center max-w-lg">
            <div className="editorial-rule slide-animate-d1" style={{ backgroundColor: "var(--marigold)" }} />
            {slide.caption && (
              <p
                className="mt-3 text-base font-bold uppercase tracking-[0.1em] slide-animate-d2 md:text-lg"
                style={{ color: "var(--paper)" }}
              >
                {slide.caption}
              </p>
            )}
            {slide.attribution && (
              <p
                className="mt-2 text-[10px] tracking-[0.22em] uppercase slide-animate-d2"
                style={{ color: "oklch(0.92 0.05 85 / 0.55)" }}
              >
                {slide.attribution}
              </p>
            )}
            {slide.imageSrc && (
              <p
                className="mt-2 text-[10px] tracking-[0.22em] uppercase slide-animate-d2"
                style={{ color: "oklch(0.92 0.05 85 / 0.55)" }}
              >
                Toca para ampliar
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
