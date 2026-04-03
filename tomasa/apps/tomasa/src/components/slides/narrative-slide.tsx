import type { Slide } from "@repo/utils"

export function NarrativeSlide({ slide }: { slide: Slide }) {
  return (
    <div className="snap-start min-h-dvh flex flex-col items-center justify-center relative overflow-hidden">
      {/* Base background */}
      <div className="absolute inset-0 bg-background" />

      {/* Canvas grain texture */}
      <div className="canvas-grain absolute inset-0" />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: "inset 0 0 160px 70px oklch(0.22 0.06 155 / 0.15)",
          zIndex: 2,
        }}
      />

      {/* Gradient with rose bleed */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 20% 10%, oklch(0.82 0.10 162 / 0.5) 0%, transparent 50%), radial-gradient(ellipse at 80% 90%, oklch(0.82 0.12 350 / 0.25) 0%, transparent 40%), linear-gradient(180deg, oklch(0.90 0.05 160 / 0.3) 0%, transparent 25%, oklch(0.86 0.06 155 / 0.25) 100%)",
          zIndex: 2,
        }}
      />

      {/* Corner brackets */}
      <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 pointer-events-none" style={{ borderColor: "oklch(0.60 0.12 160 / 0.35)", zIndex: 3 }} />
      <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 pointer-events-none" style={{ borderColor: "oklch(0.60 0.12 160 / 0.35)", zIndex: 3 }} />
      <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 pointer-events-none" style={{ borderColor: "oklch(0.60 0.12 160 / 0.35)", zIndex: 3 }} />
      <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 pointer-events-none" style={{ borderColor: "oklch(0.60 0.12 160 / 0.35)", zIndex: 3 }} />

      {/* Content */}
      <div className="relative z-10 max-w-xl flex flex-col items-center gap-6 text-center px-6 py-12">
        {slide.title && (
          <h3 className="font-serif text-3xl md:text-5xl text-foreground tracking-tight">
            {slide.title}
          </h3>
        )}

        {/* Ornamental diamond divider */}
        <div className="flex items-center justify-center gap-2 w-48">
          <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, oklch(0.72 0.18 350))" }} />
          <div className="w-2 h-2 rotate-45" style={{ border: "1.5px solid oklch(0.72 0.18 350)" }} />
          <div className="flex-1 h-px" style={{ background: "linear-gradient(270deg, transparent, oklch(0.72 0.18 350))" }} />
        </div>

        {slide.text && (
          <p className="font-serif text-lg md:text-xl text-foreground/80 leading-relaxed">
            {slide.text}
          </p>
        )}
      </div>
    </div>
  )
}
