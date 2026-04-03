import Image from "next/image"
import type { Decade } from "@repo/utils"
import { mediaPath } from "@/lib/base-path"

export function DecadeTitleSlide({ decade }: { decade: Decade }) {
  return (
    <div className="snap-start relative min-h-dvh flex flex-col items-center justify-center">
      <Image
        src={mediaPath(decade.coverImage)}
        alt={decade.coverImageAlt}
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, oklch(0.18 0.06 158 / 0.75) 0%, oklch(0.18 0.06 158 / 0.2) 50%, oklch(0.30 0.08 350 / 0.1) 100%)" }} />
      <div className="relative z-10 flex flex-col items-center justify-end pb-24 h-full w-full">
        <h2 className="font-serif text-6xl md:text-8xl text-white tracking-tight">
          {decade.label}
        </h2>
        <p className="mt-4 text-lg text-white/70 tracking-widest uppercase">
          {decade.year}
        </p>
      </div>
    </div>
  )
}
