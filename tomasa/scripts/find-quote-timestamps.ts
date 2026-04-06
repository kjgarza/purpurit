#!/usr/bin/env bun
/**
 * Search transcript segments for quotes and print timestamps.
 * Usage: bun scripts/find-quote-timestamps.ts
 */

import { readFileSync, existsSync } from "fs"
import { join } from "path"

const CACHE_DIR = join(import.meta.dir, "..", "..", "data", "processed-transcripts")

interface Segment {
  id: number
  start: number
  end: number
  text: string
}

interface Transcript {
  text: string
  segments: Segment[]
}

function loadTranscript(id: string): Transcript | null {
  const path = join(CACHE_DIR, `${id}.json`)
  if (!existsSync(path)) return null
  return JSON.parse(readFileSync(path, "utf-8"))
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

function searchSegments(transcript: Transcript, keywords: string[]): Segment[] {
  return transcript.segments.filter((seg) =>
    keywords.some((kw) =>
      seg.text.toLowerCase().includes(kw.toLowerCase())
    )
  )
}

// ─── Quotes to find ───────────────────────────────────────────────────────────

const sunday = loadTranscript("sunday-17-04")
const sunday22 = loadTranscript("sunday-22-08")
const wednesday = loadTranscript("wednesday-17-57")

if (!sunday || !sunday22 || !wednesday) {
  console.error("Missing transcript cache files")
  process.exit(1)
}

console.log("=== SUNDAY 17:04 (2245s) ===\n")

const queries: Array<{ label: string; keywords: string[]; source: Transcript }> = [
  {
    label: "Ranch childhood (1930s) — descalzos / felices",
    keywords: ["descalzos", "felices", "rancho"],
    source: sunday,
  },
  {
    label: "Working at 15 (1940s) — Chihuahua / Evaristo / cuidando",
    keywords: ["Evaristo", "centro de salud", "cuidando niños"],
    source: sunday,
  },
  {
    label: "Rich family kitchen (1940s) — ricos / cocina / comida",
    keywords: ["ricos", "cocina", "aprendí"],
    source: sunday,
  },
  {
    label: "Husband death (1950s) — balazo / espinazo",
    keywords: ["balazo", "espinazo", "se murió"],
    source: sunday,
  },
  {
    label: "Moving to Chihuahua (1950s) — cuñada / Chihuahua",
    keywords: ["cuñada", "Chihuahua"],
    source: sunday,
  },
  {
    label: "Moon landing (1970s) — luna / tele",
    keywords: ["luna", "tele", "Buchiniva"],
    source: sunday,
  },
  {
    label: "Enchiladas (1960s) — chile / enchiladas",
    keywords: ["enchiladas", "molíamos", "chile"],
    source: sunday,
  },
  {
    label: "Grandchildren (1970s/1980s) — nietos",
    keywords: ["nietos", "cuidan"],
    source: sunday,
  },
  {
    label: "Peaceful life — pacífico / tranquilo",
    keywords: ["pacífico", "tranquilo"],
    source: sunday,
  },
]

for (const q of queries) {
  const hits = searchSegments(q.source, q.keywords)
  if (hits.length === 0) {
    console.log(`[${q.label}]\n  ✗ not found\n`)
    continue
  }
  console.log(`[${q.label}]`)
  for (const h of hits.slice(0, 3)) {
    console.log(
      `  ${formatTime(h.start)} – ${formatTime(h.end)}  "${h.text.trim()}"`
    )
  }
  console.log()
}

console.log("=== SUNDAY 22:08 (370s) ===\n")
const q22: Array<{ label: string; keywords: string[] }> = [
  { label: "Working as nanny (1940s)", keywords: ["familia rica", "15 años", "cuidaba niños"] },
  { label: "Childhood poverty — sandía / comíamos", keywords: ["sandía", "comíamos"] },
]
for (const q of q22) {
  const hits = searchSegments(sunday22, q.keywords)
  if (hits.length === 0) {
    console.log(`[${q.label}]\n  ✗ not found\n`)
    continue
  }
  console.log(`[${q.label}]`)
  for (const h of hits.slice(0, 3)) {
    console.log(`  ${formatTime(h.start)} – ${formatTime(h.end)}  "${h.text.trim()}"`)
  }
  console.log()
}

console.log("=== WEDNESDAY 17:57 (2528s) ===\n")
const qWed: Array<{ label: string; keywords: string[] }> = [
  { label: "Arm therapy / estoy bien", keywords: ["terapia", "brazo", "estoy bien"] },
  { label: "Grandchildren at home", keywords: ["niños", "escuela", "pasan bien"] },
]
for (const q of qWed) {
  const hits = searchSegments(wednesday, q.keywords)
  if (hits.length === 0) {
    console.log(`[${q.label}]\n  ✗ not found\n`)
    continue
  }
  console.log(`[${q.label}]`)
  for (const h of hits.slice(0, 3)) {
    console.log(`  ${formatTime(h.start)} – ${formatTime(h.end)}  "${h.text.trim()}"`)
  }
  console.log()
}
