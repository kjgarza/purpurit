"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { mediaPath } from "@/lib/base-path"

interface EntranceProps {
  onEnter: () => void
  onInteract?: () => void
}

export function Entrance({ onEnter, onInteract }: EntranceProps) {
  const [visible, setVisible] = useState(true)

  function handleTap() {
    onInteract?.()
    setVisible(false)
  }

  return (
    <AnimatePresence
      onExitComplete={() => {
        onEnter()
      }}
    >
      {visible && (
        <motion.div
          key="entrance"
          className="fixed inset-0 z-50 flex flex-col cursor-pointer overflow-hidden bg-background canvas-grain"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          onClick={handleTap}
        >
          {/* Cobalt masthead */}
          <div
            className="flex items-center gap-3 px-6 pt-14 pb-4 md:px-12"
            style={{ backgroundColor: "var(--cobalt)" }}
          >
            <span className="slide-label" style={{ color: "var(--marigold)" }}>
              En memoria
            </span>
            <span className="h-px flex-1" style={{ backgroundColor: "oklch(0.92 0.05 85 / 0.35)" }} />
            <span
              className="text-xs font-semibold tracking-[0.18em]"
              style={{ color: "var(--paper)" }}
            >
              1932 — 2024
            </span>
          </div>

          {/* Giant cropped name */}
          <motion.h1
            className="font-display font-black whitespace-nowrap"
            style={{
              color: "var(--cochineal)",
              fontSize: "clamp(6rem, 24vw, 16rem)",
              lineHeight: 0.86,
              letterSpacing: "-0.03em",
              marginLeft: "-0.08em",
              marginTop: "0.18em",
            }}
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            TOMASA
          </motion.h1>

          {/* Portrait in Casa Azul window frame, cobalt block behind */}
          <motion.div
            className="relative mx-auto mt-6 w-[64vw] max-w-xs md:max-w-sm"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              className="absolute"
              style={{
                top: 18,
                left: "-14%",
                width: "128%",
                height: "106%",
                backgroundColor: "var(--cobalt)",
              }}
            />
            <div
              className="relative p-2"
              style={{
                border: "11px solid var(--cochineal)",
                backgroundColor: "var(--paper)",
                boxShadow: "0 26px 60px oklch(0.2 0.03 60 / 0.35)",
              }}
            >
              <div className="relative aspect-[4/5] w-full">
                <Image
                  src={mediaPath("entrance.jpg")}
                  alt="Tomasa"
                  fill
                  className="object-cover object-top"
                  priority
                />
              </div>
            </div>
            <p
              className="absolute -bottom-8 -right-4 font-hand text-2xl"
              style={{ color: "var(--ink)", transform: "rotate(-5deg)", fontFamily: "var(--font-hand)" }}
            >
              nuestra abuela
            </p>
          </motion.div>

          {/* Enter hint */}
          <motion.div
            className="absolute inset-x-0 bottom-11 flex flex-col items-center gap-2.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2, ease: "easeOut" }}
          >
            <div style={{ width: 46, height: 3, backgroundColor: "var(--marigold)" }} />
            <p className="slide-label" style={{ color: "var(--ink)" }}>
              Toca para entrar
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
