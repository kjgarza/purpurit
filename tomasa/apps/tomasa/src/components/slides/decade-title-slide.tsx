import Image from "next/image"
import type { Decade } from "@repo/utils"
import { mediaPath } from "@/lib/base-path"

export function DecadeTitleSlide({ decade, priority = false }: { decade: Decade; priority?: boolean }) {
  return (
    <div className="snap-start relative min-h-dvh flex flex-col">
      <Image
        src={mediaPath(decade.coverImage)}
        alt={decade.coverImageAlt}
        fill
        sizes="100vw"
        className="object-cover"
        priority={priority}
      />
      {/* Gradient scrim — animates in */}
      <div
        className="absolute inset-0 slide-scrim"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.15) 55%, transparent 75%)" }}
      />
      {/* Content: label + headline pushed to bottom-left, clearing sidebar on desktop */}
      <div className="relative z-10 flex flex-col justify-end h-full pb-24 pl-6 pr-6 md:pl-20 md:pr-12 md:pb-20">
        <p className="slide-label text-white/60 mb-4 slide-animate">
          {decade.year}s
        </p>
        <h2 className="font-display font-black text-6xl md:text-8xl text-white leading-[0.95] tracking-tight slide-animate-d1">
          {decade.label}
        </h2>
      </div>
    </div>
  )
}
