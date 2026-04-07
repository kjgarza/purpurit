#!/usr/bin/env bun
/**
 * Search all transcript segments for keywords and show surrounding context.
 * Usage: bun scripts/search-segments.ts <keyword>
 */

import { readFileSync, existsSync } from "fs"
import { join } from "path"

const CACHE_DIR = join(import.meta.dir, "..", "..", "data", "processed-transcripts")
const KEYWORD = process.argv[2] || "nietos"

interface Segment { id: number; start: number; end: number; text: string }
interface Transcript { segments: Segment[] }

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`
}

for (const id of ["sunday-17-04", "sunday-22-08", "wednesday-17-57"]) {
  const path = join(CACHE_DIR, `${id}.json`)
  if (!existsSync(path)) continue
  const t: Transcript = JSON.parse(readFileSync(path, "utf-8"))
  const hits = t.segments.filter(s => s.text.toLowerCase().includes(KEYWORD.toLowerCase()))
  if (hits.length === 0) continue
  console.log(`\n=== ${id} ===`)
  for (const h of hits.slice(0, 5)) {
    // Show context: segment before and after
    const prev = t.segments[h.id - 1]
    const next = t.segments[h.id + 1]
    if (prev) console.log(`  ${fmt(prev.start)} – ${fmt(prev.end)}  ${prev.text.trim()}`)
    console.log(`→ ${fmt(h.start)} – ${fmt(h.end)}  ${h.text.trim()}`)
    if (next) console.log(`  ${fmt(next.start)} – ${fmt(next.end)}  ${next.text.trim()}`)
    console.log()
  }
}
