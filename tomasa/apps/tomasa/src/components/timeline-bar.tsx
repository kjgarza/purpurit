"use client"

import type { Decade } from "@repo/utils"

interface TimelineBarProps {
  decades: Decade[]
  activeDecadeId: string
  onNavigate: (decadeId: string) => void
}

function Marker({ isActive }: { isActive: boolean }) {
  return (
    <span
      className="block transition-all"
      style={{
        width: 16,
        height: 4,
        backgroundColor: isActive ? "var(--marigold)" : "transparent",
      }}
    />
  )
}

export function TimelineBar({ decades, activeDecadeId, onNavigate }: TimelineBarProps) {
  return (
    <>
      {/* Mobile: fixed bottom bar — aged paper with ink rule */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch px-2 pb-5 pt-2 md:hidden"
        style={{
          backgroundColor: "var(--paper)",
          borderTop: "2px solid var(--ink)",
        }}
        aria-label="Línea del tiempo"
      >
        {decades.map((decade) => {
          const isActive = decade.id === activeDecadeId
          return (
            <button
              key={decade.id}
              type="button"
              onClick={() => onNavigate(decade.id)}
              aria-current={isActive ? "step" : undefined}
              className="flex flex-1 flex-col items-center gap-1 transition-all"
            >
              <Marker isActive={isActive} />
              <span
                className="text-[11px] font-bold tracking-[0.08em] transition-colors"
                style={{ color: isActive ? "var(--cochineal)" : "oklch(0.45 0.03 60 / 0.6)" }}
              >
                {decade.year}
              </span>
            </button>
          )
        })}
      </nav>

      {/* Desktop: fixed left sidebar — aged paper with ink rule */}
      <nav
        className="fixed left-0 top-0 z-40 hidden h-dvh flex-col items-center justify-center gap-6 px-4 py-8 md:flex"
        style={{
          backgroundColor: "var(--paper)",
          borderRight: "2px solid var(--ink)",
        }}
        aria-label="Línea del tiempo"
      >
        {decades.map((decade) => {
          const isActive = decade.id === activeDecadeId
          return (
            <button
              key={decade.id}
              type="button"
              onClick={() => onNavigate(decade.id)}
              aria-current={isActive ? "step" : undefined}
              className="flex flex-col items-center gap-1.5 transition-all"
            >
              <Marker isActive={isActive} />
              <span
                className="text-[11px] font-bold tracking-[0.08em] transition-colors"
                style={{ color: isActive ? "var(--cochineal)" : "oklch(0.45 0.03 60 / 0.6)" }}
              >
                {decade.year}
              </span>
            </button>
          )
        })}
      </nav>
    </>
  )
}
