import Image from "next/image"
import type { Slide } from "@repo/utils"
import { mediaPath } from "@/lib/base-path"

// ─── 5 organic shape variants via CSS border-radius ──────────────────
// Each entry: [borderRadius, widthPx, heightPx, rotationDeg]
// border-radius syntax: "topLeft topRight bottomRight bottomLeft / vertTopLeft vertTopRight vertBottomRight vertBottomLeft"
type ShapeVariant = {
  borderRadius: string
  width: number
  height: number
  rotate: number
}

const SHAPES: ShapeVariant[] = [
  // 0 — Classic oval (portrait ellipse)
  {
    borderRadius: "50%",
    width: 248,
    height: 308,
    rotate: 0,
  },
  // 1 — Arch / tombstone (flat bottom, arched top)
  {
    borderRadius: "100% 100% 0 0 / 58% 58% 0 0",
    width: 240,
    height: 310,
    rotate: 0,
  },
  // 2 — Organic blob (asymmetric rounded)
  {
    borderRadius: "62% 38% 46% 54% / 60% 44% 56% 40%",
    width: 268,
    height: 288,
    rotate: 6,
  },
  // 3 — Droplet / teardrop (wider at bottom, pinched at top)
  {
    borderRadius: "50% 50% 50% 50% / 68% 68% 32% 32%",
    width: 250,
    height: 304,
    rotate: -3,
  },
  // 4 — Leaf / petal (pointed sides, full height)
  {
    borderRadius: "76% 24% 76% 24% / 52% 52% 48% 48%",
    width: 236,
    height: 316,
    rotate: 4,
  },
]

/** Deterministic shape picker from slide id */
function pickShape(id: string): ShapeVariant {
  let h = 5381
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(h, 31) + id.charCodeAt(i)) | 0
  }
  return SHAPES[Math.abs(h) % SHAPES.length]
}

export function NarrativeSlide({ slide }: { slide: Slide }) {
  const hasImage = Boolean(slide.imageSrc)
  const shape = pickShape(slide.id)

  return (
    <div className="snap-start relative min-h-dvh flex flex-col overflow-hidden">
      {/* Cream background */}
      <div className="absolute inset-0 bg-background" />

      {/* Thin emerald top border */}
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ backgroundColor: "var(--primary)", opacity: 0.6 }} />

      {/* ── Text block ─────────────────────────────────────── */}
      <div
        className="relative z-10 flex flex-col px-6 pt-12 pb-0 md:pl-20 md:pr-16 md:pt-16"
        style={{ maxWidth: "min(680px, 100%)" }}
      >
        <p className="slide-label mb-4 slide-animate" style={{ color: "var(--primary)" }}>
          {slide.subtitle ?? "Recuerdo"}
        </p>

        {slide.title && (
          <h3 className="font-display font-black text-[2.6rem] leading-[1.0] md:text-[4rem] md:leading-[1.0] text-foreground tracking-tight slide-animate-d1">
            {slide.title}
          </h3>
        )}

        {slide.text && (
          <p className="font-serif text-lg md:text-xl text-foreground/72 leading-relaxed mt-5 max-w-prose slide-animate-d2">
            {slide.text}
          </p>
        )}

        {slide.attribution && (
          <p className="mt-4 text-xs italic slide-animate-d2" style={{ color: "oklch(0.58 0.07 158)" }}>
            — {slide.attribution}
          </p>
        )}
      </div>

      {/* ── Shaped drawing ─────────────────────────────────── */}
      {hasImage && (
        <div
          className="absolute z-0"
          style={{
            bottom: "-6%",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          {/* Outer decorative ring — subtle emerald halo */}
          <div
            style={{
              width: shape.width + 16,
              height: shape.height + 16,
              borderRadius: shape.borderRadius,
              transform: `rotate(${shape.rotate}deg)`,
              background: "oklch(0.72 0.08 158 / 0.12)",
              position: "absolute",
              top: -8,
              left: -8,
            }}
          />

          {/* Image in organic shape */}
          <div
            className="relative overflow-hidden slide-animate-shape"
            style={{
              width: shape.width,
              height: shape.height,
              borderRadius: shape.borderRadius,
              transform: `rotate(${shape.rotate}deg)`,
              boxShadow: "0 16px 60px oklch(0.28 0.06 155 / 0.18), 0 4px 16px oklch(0.28 0.06 155 / 0.10)",
              border: "2px solid oklch(0.72 0.06 158 / 0.22)",
            }}
          >
            <Image
              src={mediaPath(slide.imageSrc!)}
              alt={slide.imageAlt ?? ""}
              fill
              sizes="(min-width: 768px) 320px, 260px"
              className="object-cover object-center"
            />
          </div>
        </div>
      )}
    </div>
  )
}
