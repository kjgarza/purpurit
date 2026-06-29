#!/usr/bin/env bun
/**
 * Add speaker labels to all processed transcript JSONs using Claude.
 * Writes labeled copies to data/labeled-transcripts/.
 *
 * Usage: bun scripts/add-speaker-labels.ts
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "fs"
import { join } from "path"

// ─── Types ────────────────────────────────────────────────────────────────────

export type Speaker = "Tomasa" | "Interviewer" | "unknown"

export interface MinSegment {
  id: number
  text: string
}

export interface RawSegment {
  id: number
  seek: number
  start: number
  end: number
  text: string
  tokens: number[]
  temperature: number
  avg_logprob: number
  compression_ratio: number
  no_speech_prob: number
}

export interface LabeledSegment extends RawSegment {
  speaker: Speaker
}

export interface ChunkResult {
  chunkStart: number
  chunkSize: number
  labels: Map<number, Speaker>
}

// ─── Pure Helpers (exported for testing) ─────────────────────────────────────

/**
 * Split segments into overlapping chunks.
 * Each chunk starts at: chunkIndex * (chunkSize - overlap)
 */
export function chunkSegments(
  segments: MinSegment[],
  chunkSize: number,
  overlap: number
): MinSegment[][] {
  if (segments.length <= chunkSize) return [segments]

  const step = chunkSize - overlap
  const chunks: MinSegment[][] = []

  for (let start = 0; start < segments.length; start += step) {
    const chunk = segments.slice(start, start + chunkSize)
    chunks.push(chunk)
    if (start + chunkSize >= segments.length) break
  }

  return chunks
}

/**
 * Merge per-chunk label maps into a single map.
 * When the same segment ID appears in multiple chunks, the chunk where
 * the segment is farthest from either edge wins.
 */
export function deduplicateOverlap(chunks: ChunkResult[]): Map<number, Speaker> {
  // Track: segId → { speaker, distanceFromEdge }
  const best = new Map<number, { speaker: Speaker; dist: number }>()

  for (const { chunkStart, chunkSize, labels } of chunks) {
    for (const [segId, speaker] of labels) {
      const posInChunk = segId - chunkStart
      const distFromEdge = Math.min(posInChunk, chunkSize - 1 - posInChunk)
      const current = best.get(segId)
      if (!current || distFromEdge > current.dist) {
        best.set(segId, { speaker, dist: distFromEdge })
      }
    }
  }

  return new Map([...best.entries()].map(([id, { speaker }]) => [id, speaker]))
}

/**
 * Merge speaker labels back into original full segments.
 * Segments missing from the label map get "unknown".
 */
export function mergeLabels(
  segments: RawSegment[],
  labels: Map<number, Speaker>
): LabeledSegment[] {
  return segments.map((seg) => ({
    ...seg,
    speaker: labels.get(seg.id) ?? "unknown",
  }))
}

// ─── Claude Labeling ──────────────────────────────────────────────────────────

const CHUNK_SIZE = 60
const OVERLAP = 10

const SYSTEM_PROMPT = `You are labeling segments from a Spanish-language oral history interview.
There are exactly two speakers:
- "Tomasa": elderly Mexican grandmother (~90 years old), speaks in long narratives about her past
- "Interviewer": her grandson, asks short questions about her life

Speaker signals:
- "mijo" / "mi hijo" in text → Tomasa speaking
- "Oiga" (formal address) → Interviewer addressing Tomasa
- Long narrative about childhood, family, historical events → Tomasa
- Short questions (¿Cómo...? ¿Cuándo...? ¿Y usted...?) → Interviewer
- German text (Tomasa spent time in Germany) → Tomasa
- Rhetorical questions like "¿Cómo la ves?" → Tomasa

Return ONLY a JSON array. Each element: {"id": <number>, "speaker": "Tomasa" | "Interviewer"}.
One object per input segment. No extra text, no markdown fences.`

async function labelChunk(
  chunk: MinSegment[],
  retries = 2
): Promise<Map<number, Speaker>> {
  const userContent = JSON.stringify(chunk.map((s) => ({ id: s.id, text: s.text })))
  const fullPrompt = `${SYSTEM_PROMPT}\n\nSegments to label:\n${userContent}`

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const proc = Bun.spawn(["claude", "-p", fullPrompt], {
        stdout: "pipe",
        stderr: "pipe",
      })

      const [stdout, exitCode] = await Promise.all([
        new Response(proc.stdout).text(),
        proc.exited,
      ])

      if (exitCode !== 0) {
        const stderr = await new Response(proc.stderr).text()
        throw new Error(`claude exited ${exitCode}: ${stderr}`)
      }

      const raw = stdout.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")
      const parsed: Array<{ id: number; speaker: string }> = JSON.parse(raw)

      const map = new Map<number, Speaker>()
      for (const { id, speaker } of parsed) {
        if (speaker === "Tomasa" || speaker === "Interviewer") {
          map.set(id, speaker)
        }
      }
      return map
    } catch (err) {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)))
        continue
      }
      console.warn(`  ⚠ chunk starting at id=${chunk[0]?.id} failed after ${retries + 1} attempts, marking as unknown`)
      console.error("  Last error:", err)
      return new Map()
    }
  }
  return new Map()
}

async function labelFile(
  inputPath: string,
  outputPath: string
): Promise<void> {
  const raw = JSON.parse(readFileSync(inputPath, "utf-8"))
  const segments: RawSegment[] = raw.segments ?? []
  const filename = inputPath.split("/").pop()!

  // Skip if already labeled
  if (segments[0] && "speaker" in segments[0]) {
    console.log(`✓ Already labeled: ${filename}`)
    return
  }

  const minSegs: MinSegment[] = segments.map((s) => ({ id: s.id, text: s.text }))
  const chunks = chunkSegments(minSegs, CHUNK_SIZE, OVERLAP)
  console.log(`  ${filename}: ${segments.length} segments → ${chunks.length} chunks`)

  const chunkResults: ChunkResult[] = []

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    const chunkStart = chunk[0].id
    process.stdout.write(`    chunk ${i + 1}/${chunks.length}...`)
    const labels = await labelChunk(chunk)
    chunkResults.push({ chunkStart, chunkSize: chunk.length, labels })
    process.stdout.write(" ✓\n")
  }

  const merged = deduplicateOverlap(chunkResults)
  const labeled = mergeLabels(segments, merged)

  // Validate
  const unknownCount = labeled.filter((s) => s.speaker === "unknown").length
  const tomasaCount = labeled.filter((s) => s.speaker === "Tomasa").length
  const interviewerCount = labeled.filter((s) => s.speaker === "Interviewer").length

  writeFileSync(outputPath, JSON.stringify({ ...raw, segments: labeled }, null, 2))
  console.log(
    `✓ ${filename}: ${tomasaCount} Tomasa / ${interviewerCount} Interviewer / ${unknownCount} unknown`
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────

if (import.meta.main) {
  const TOMASA_DIR = join(import.meta.dir, "..")
  const DATA_DIR = join(TOMASA_DIR, "..", "data")
  const INPUT_DIR = join(DATA_DIR, "processed-transcripts")
  const OUTPUT_DIR = join(DATA_DIR, "labeled-transcripts")

  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true })

  const inputFiles = readdirSync(INPUT_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => ({ input: join(INPUT_DIR, f), output: join(OUTPUT_DIR, f) }))

  console.log(`Labeling ${inputFiles.length} transcript(s)...\n`)

  await Promise.all(
    inputFiles.map(({ input, output }) => labelFile(input, output))
  )

  console.log("\nDone. Labeled files in:", OUTPUT_DIR)
}
