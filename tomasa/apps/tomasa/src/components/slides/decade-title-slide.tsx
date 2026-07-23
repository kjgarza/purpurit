import Image from "next/image"
import type { Decade } from "@repo/utils"
import { mediaPath } from "@/lib/base-path"

export function DecadeTitleSlide({ decade, priority = false }: { decade: Decade; priority?: boolean }) {
  // `chapter` is not part of the shared Decade type (style-only PR scope);
  // read it locally so content authors can opt in via content/decades.ts
  // without widening the shared contract.
  const chapter = (decade as Partial<{ chapter: string }>).chapter

  return (
    <div className="snap-start relative min-h-dvh flex flex-col" style={{ backgroundColor: "var(--cobalt)" }}>
      {/* Cover photo with cobalt duotone wash */}
      <div className="duotone-cobalt absolute inset-0">
        <Image
          src={mediaPath(decade.coverImage)}
          alt={decade.coverImageAlt}
          fill
          sizes="100vw"
          className="object-cover"
          priority={priority}
        />
      </div>

      {/* Top scrim for status bar legibility */}
      <div
        className="absolute inset-x-0 top-0 h-32 slide-scrim"
        style={{ background: "linear-gradient(to bottom, oklch(0.24 0.07 265 / 0.6), transparent)" }}
      />

      {/* Cobalt plinth with editorial furniture + giant cropped year */}
      <div
        className="absolute inset-x-0 bottom-0 z-10 overflow-hidden px-6 pb-14 pt-5 md:pl-24 md:pr-12"
        style={{
          backgroundColor: "var(--cobalt)",
          borderTop: "3px solid var(--marigold)",
        }}
      >
        <div className="mb-1.5 flex items-center gap-3 slide-animate">
          {chapter && (
            <span className="slide-label" style={{ color: "var(--marigold)" }}>
              Capítulo {chapter}
            </span>
          )}
          <span className="h-px flex-1" style={{ backgroundColor: "oklch(0.92 0.05 85 / 0.35)" }} />
        </div>
        <p
          className="mb-0.5 text-base font-bold uppercase tracking-[0.14em] slide-animate-d1 md:text-lg"
          style={{ color: "var(--paper)" }}
        >
          {decade.label}
        </p>
        <h2
          className="font-display font-black whitespace-nowrap slide-animate-d2"
          style={{
            color: "var(--paper)",
            fontSize: "clamp(7rem, 30vw, 20rem)",
            lineHeight: 0.78,
            letterSpacing: "-0.02em",
            margin: "0 0 -0.32em -0.04em",
          }}
        >
          {decade.year}
        </h2>
      </div>
    </div>
  )
}
