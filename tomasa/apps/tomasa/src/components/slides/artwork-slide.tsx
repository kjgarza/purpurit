import Image from "next/image"
import type { Slide } from "@repo/utils"
import { mediaPath } from "@/lib/base-path"

export function ArtworkSlide({
  slide,
  onOpenLightbox,
}: {
  slide: Slide
  onOpenLightbox?: (imageSrc: string, caption?: string) => void
}) {
  return (
    <div className="artwork-slide snap-start min-h-dvh flex flex-col items-center justify-center relative overflow-hidden">
      {/* Textured background — emerald */}
      <div className="absolute inset-0" style={{ backgroundColor: "oklch(0.92 0.04 160)" }} />
      <div className="canvas-grain absolute inset-0" />

      {/* Vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: "inset 0 0 200px 60px oklch(0.22 0.06 155 / 0.10)",
          zIndex: 2,
        }}
      />

      <div className="relative z-10 flex flex-col items-center px-6 py-10 md:py-16 max-w-4xl md:pl-20 mx-auto">
        {slide.imageSrc && (
          <button
            type="button"
            className="group relative cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 rounded-sm"
            onClick={() => onOpenLightbox?.(mediaPath(slide.imageSrc!), slide.caption)}
            aria-label={slide.imageAlt ?? "Ver dibujo en tamano completo"}
          >
            {/* Outer frame — emerald */}
            <div
              className="relative p-2 md:p-3 transition-shadow duration-500"
              style={{
                backgroundColor: "oklch(0.38 0.06 158)",
                boxShadow: "0 4px 30px oklch(0.15 0.04 155 / 0.15), 0 1px 3px oklch(0.15 0.04 155 / 0.08)",
              }}
            >
              {/* Inner mat — jade cream */}
              <div
                className="p-3 md:p-5"
                style={{
                  backgroundColor: "oklch(0.94 0.02 160)",
                  border: "1px solid oklch(0.85 0.04 160)",
                }}
              >
                {/* The artwork itself */}
                <div className="relative overflow-hidden">
                  <Image
                    src={mediaPath(slide.imageSrc)}
                    alt={slide.imageAlt ?? ""}
                    width={800}
                    height={800}
                    className="max-h-[55vh] md:max-h-[60vh] w-auto h-auto object-contain transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                    sizes="(max-width: 768px) 85vw, 700px"
                  />
                </div>
              </div>
            </div>

            {/* Expand hint on hover */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="bg-black/40 backdrop-blur-sm rounded-full p-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              </div>
            </div>
          </button>
        )}

        {/* Caption area */}
        {(slide.caption || slide.attribution) && (
          <div className="mt-6 md:mt-8 text-center max-w-lg">
            {/* Ornamental diamond divider — dusty rose */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="h-px w-8" style={{ background: "linear-gradient(90deg, transparent, oklch(0.72 0.18 350))" }} />
              <div className="h-1.5 w-1.5 rotate-45" style={{ border: "1px solid oklch(0.72 0.18 350)" }} />
              <div className="h-px w-8" style={{ background: "linear-gradient(270deg, transparent, oklch(0.72 0.18 350))" }} />
            </div>

            {slide.caption && (
              <p className="font-serif text-base md:text-lg leading-relaxed tracking-wide" style={{ color: "oklch(0.35 0.06 155)" }}>
                {slide.caption}
              </p>
            )}
            {slide.attribution && (
              <p className="mt-2 text-xs md:text-sm italic tracking-wider uppercase" style={{ color: "oklch(0.50 0.06 158)" }}>
                {slide.attribution}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
