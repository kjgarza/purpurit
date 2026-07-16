import Image from "next/image"
import type { Slide } from "@repo/utils"
import { mediaPath } from "@/lib/base-path"

export function PhotoSlide({ slide }: { slide: Slide }) {
  const hasTitle = Boolean(slide.title)
  const hasCaption = Boolean(slide.caption)

  return (
    <div className="snap-start relative min-h-dvh flex flex-col" style={{ backgroundColor: "var(--ink)" }}>
      {slide.imageSrc && (
        <Image
          src={mediaPath(slide.imageSrc)}
          alt={slide.imageAlt ?? ""}
          fill
          sizes="100vw"
          className="object-cover object-top slide-animate-fade"
        />
      )}

      {/* Top scrim for title */}
      {hasTitle && (
        <div
          className="absolute inset-x-0 top-0 h-40 slide-scrim"
          style={{ background: "linear-gradient(to bottom, oklch(0.2 0.02 60 / 0.55), transparent)" }}
        />
      )}

      {/* Title at top-left */}
      {hasTitle && (
        <div className="absolute inset-x-0 top-0 z-10 pt-12 px-6 md:pl-24 md:pr-12">
          <h3
            className="font-display font-black text-4xl md:text-6xl leading-tight slide-animate-d1"
            style={{ color: "var(--paper)" }}
          >
            {slide.title}
          </h3>
        </div>
      )}

      {/* Caption plinth: aged paper strip with marigold marker */}
      {hasCaption && (
        <div
          className="absolute inset-x-0 bottom-0 z-10 flex items-center gap-3 px-6 pb-20 pt-4 md:pl-24 md:pr-12 md:pb-5"
          style={{
            backgroundColor: "var(--paper)",
            borderTop: "3px solid var(--ink)",
          }}
        >
          <span className="block shrink-0 slide-animate" style={{ width: 10, height: 10, backgroundColor: "var(--marigold)" }} />
          <p
            className="font-serif text-base italic leading-relaxed slide-animate"
            style={{ color: "var(--ink)" }}
          >
            {slide.caption}
          </p>
        </div>
      )}
    </div>
  )
}
