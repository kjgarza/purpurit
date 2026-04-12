import Image from "next/image"
import type { Slide } from "@repo/utils"
import { mediaPath } from "@/lib/base-path"

export function PhotoSlide({ slide }: { slide: Slide }) {
  const hasTitle = Boolean(slide.title)
  const hasCaption = Boolean(slide.caption)

  return (
    <div className="snap-start relative min-h-dvh flex flex-col">
      {slide.imageSrc && (
        <Image
          src={mediaPath(slide.imageSrc)}
          alt={slide.imageAlt ?? ""}
          fill
          sizes="100vw"
          className="object-cover object-top slide-animate-fade"
        />
      )}

      {/* Top gradient scrim for title overlay */}
      {hasTitle && (
        <div
          className="absolute inset-0 slide-scrim"
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 50%)" }}
        />
      )}

      {/* Bottom gradient scrim for caption */}
      {hasCaption && (
        <div
          className="absolute inset-0 slide-scrim"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.68) 0%, transparent 45%)" }}
        />
      )}

      {/* Title at top-left, clearing sidebar */}
      {hasTitle && (
        <div className="absolute top-0 left-0 right-0 z-10 pt-10 pl-6 pr-6 md:pl-20 md:pr-12">
          <h3 className="font-display font-black text-4xl md:text-6xl text-white leading-tight slide-animate-d1">
            {slide.title}
          </h3>
        </div>
      )}

      {/* Caption at bottom-left, clearing sidebar + mobile bottom nav */}
      {hasCaption && (
        <div className="absolute bottom-0 left-0 right-0 z-10 pb-24 pl-6 pr-6 md:pl-20 md:pr-12 md:pb-12">
          <p className="text-base md:text-lg text-white/90 leading-relaxed max-w-xl slide-animate-d2">
            {slide.caption}
          </p>
        </div>
      )}
    </div>
  )
}
