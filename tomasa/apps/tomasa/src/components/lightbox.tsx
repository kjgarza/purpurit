"use client"

import { useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

interface LightboxProps {
  imageSrc: string | null
  caption?: string
  onClose: () => void
}

export function Lightbox({ imageSrc, caption, onClose }: LightboxProps) {
  const isOpen = imageSrc !== null

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (!isOpen) return

    document.addEventListener("keydown", handleKeyDown)
    document.body.classList.add("overflow-hidden")

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.classList.remove("overflow-hidden")
    }
  }, [isOpen, handleKeyDown])

  return (
    <AnimatePresence>
      {isOpen && imageSrc && (
        <motion.div
          key="lightbox-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
          style={{
            backgroundColor: "oklch(0.22 0.05 158)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          onClick={onClose}
        >
          {/* Canvas grain texture layer */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.5' numOctaves='5' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23f)'/%3E%3C/svg%3E")`,
              backgroundSize: "512px 512px",
              opacity: 0.20,
              mixBlendMode: "soft-light" as const,
            }}
          />

          {/* Gradient overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(160deg, oklch(0.20 0.06 162 / 0.8) 0%, oklch(0.16 0.04 155 / 0.9) 50%, oklch(0.18 0.05 350 / 0.3) 100%)",
            }}
          />

          {/* Vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: "inset 0 0 180px 70px oklch(0.08 0.02 155 / 0.5)",
            }}
          />

          {/* Close button */}
          <button
            className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full transition-colors"
            style={{
              backgroundColor: "oklch(0.72 0.18 350 / 0.15)",
              border: "1.5px solid oklch(0.72 0.18 350 / 0.4)",
              backdropFilter: "blur(8px)",
            }}
            onClick={onClose}
            aria-label="Cerrar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="oklch(0.82 0.12 350)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Museum frame + image */}
          <motion.div
            className="relative z-10 flex flex-col items-center"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Outer frame */}
            <div
              className="rounded-[3px]"
              style={{
                padding: "6px",
                background: "linear-gradient(135deg, oklch(0.40 0.06 158), oklch(0.30 0.04 155))",
                boxShadow: "0 12px 50px oklch(0.08 0.03 155 / 0.6), 0 2px 8px oklch(0.08 0.03 155 / 0.3)",
              }}
            >
              {/* Inner mat */}
              <div
                className="p-3 md:p-5"
                style={{ backgroundColor: "oklch(0.92 0.02 160)" }}
              >
                {/* Image */}
                <div className="relative h-[70vh] w-[85vw] max-h-[70vh] max-w-4xl">
                  <Image
                    src={imageSrc}
                    alt={caption ?? ""}
                    fill
                    className="object-contain"
                    sizes="85vw"
                  />
                </div>
              </div>
            </div>

            {/* Caption below frame */}
            {caption && (
              <p
                className="mt-3 font-serif text-sm italic"
                style={{ color: "oklch(0.70 0.06 160)" }}
              >
                {caption}
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
