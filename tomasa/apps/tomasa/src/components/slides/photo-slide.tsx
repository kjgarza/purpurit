import Image from "next/image"
import type { Slide } from "@repo/utils"
import { mediaPath } from "@/lib/base-path"

export function PhotoSlide({ slide }: { slide: Slide }) {
  return (
    <div className="snap-start relative min-h-dvh flex flex-col items-center justify-center">
      {slide.imageSrc && (
        <Image
          src={mediaPath(slide.imageSrc)}
          alt={slide.imageAlt ?? ""}
          fill
          sizes="100vw"
          className="object-cover object-top"
        />
      )}
      {slide.caption && (
        <div className="absolute bottom-0 inset-x-0 z-10 backdrop-blur-sm px-6 py-4" style={{ backgroundColor: "oklch(0.22 0.05 158 / 0.6)" }}>
          <p className="text-sm md:text-base text-white/90 text-center">
            {slide.caption}
          </p>
        </div>
      )}
    </div>
  )
}
