"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { mediaPath } from "@/lib/base-path"

interface EntranceProps {
  onEnter: () => void
}

export function Entrance({ onEnter }: EntranceProps) {
  const [visible, setVisible] = useState(true)

  function handleTap() {
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
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background cursor-pointer"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          onClick={handleTap}
        >
          {/* Key image with Ken Burns effect */}
          <motion.div
            className="relative h-[50vh] w-[80vw] max-w-lg overflow-hidden rounded-lg"
            initial={{ opacity: 0, scale: 1.0 }}
            animate={{ opacity: 1, scale: 1.05 }}
            transition={{ duration: 3, ease: "easeOut" }}
          >
            <Image
              src={mediaPath("entrance.jpg")}
              alt="Tomasa"
              fill
              className="object-cover"
              priority
            />
          </motion.div>

          {/* Text content — fades in after 1.5s */}
          <motion.div
            className="mt-8 flex flex-col items-center gap-2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.5, ease: "easeOut" }}
          >
            <h1 className="font-serif text-5xl tracking-tight text-foreground">
              Tomasa
            </h1>
            <p className="text-lg text-muted-foreground">1932 — 2024</p>
            <p className="mt-4 text-sm text-muted-foreground/70">
              Toca para entrar
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
