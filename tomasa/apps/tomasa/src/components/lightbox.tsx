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
          style={{ backgroundColor: "oklch(0.24 0.07 265 / 0.97)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          onClick={onClose}
        >
          {/* Close button */}
          <button
            className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full transition-colors"
            style={{
              backgroundColor: "transparent",
              border: "1.5px solid oklch(0.82 0.17 85 / 0.6)",
            }}
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            aria-label="Cerrar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--marigold)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Casa Azul window frame + image */}
          <motion.div
            className="relative z-10 flex flex-col items-center"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                border: "10px solid var(--cochineal)",
                backgroundColor: "var(--paper)",
                padding: "10px",
                boxShadow: "0 30px 70px oklch(0 0 0 / 0.5)",
              }}
            >
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

            {caption && (
              <p
                className="mt-4 text-center text-sm font-bold uppercase tracking-[0.1em]"
                style={{ color: "var(--marigold)" }}
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
