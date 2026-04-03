"use client"

import type { Decade } from "@repo/utils"

interface TimelineBarProps {
  decades: Decade[]
  activeDecadeId: string
  onNavigate: (decadeId: string) => void
}

export function TimelineBar({ decades, activeDecadeId, onNavigate }: TimelineBarProps) {
  return (
    <>
      {/* Mobile: fixed bottom bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-center gap-4 bg-background/80 px-4 py-3 backdrop-blur-md md:hidden"
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
              className={`flex flex-col items-center gap-1 transition-all ${
                isActive
                  ? "text-accent-foreground scale-110"
                  : "text-muted-foreground"
              }`}
            >
              <span
                className={`block rounded-full transition-all ${
                  isActive
                    ? "h-3 w-3 bg-accent"
                    : "h-2 w-2 bg-muted-foreground/40"
                }`}
              />
              <span className="text-xs font-medium">{decade.year}</span>
            </button>
          )
        })}
      </nav>

      {/* Desktop: fixed left sidebar */}
      <nav
        className="fixed left-0 top-0 z-40 hidden h-dvh flex-col items-center justify-center gap-6 bg-background/80 px-3 py-8 backdrop-blur-md md:flex"
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
              className={`flex flex-col items-center gap-1.5 transition-all ${
                isActive
                  ? "text-accent-foreground scale-110"
                  : "text-muted-foreground"
              }`}
            >
              <span
                className={`block rounded-full transition-all ${
                  isActive
                    ? "h-3 w-3 bg-accent"
                    : "h-2 w-2 bg-muted-foreground/40"
                }`}
              />
              <span className="text-xs font-medium">{decade.year}</span>
            </button>
          )
        })}
      </nav>
    </>
  )
}
