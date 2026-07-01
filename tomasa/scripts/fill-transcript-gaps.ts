#!/usr/bin/env bun
/**
 * Fill low-confidence / inaudible gaps in labeled Tomasa transcripts using Claude.
 * Reads data/labeled-transcripts/, writes data/gap-filled-transcripts/.
 *
 * Usage: bun scripts/fill-transcript-gaps.ts
 *   TOMASA_DATA_DIR overrides the data dir (needed when run from a git worktree).
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs"
import { join } from "path"

// ─── Types ────────────────────────────────────────────────────────────────────

export type Speaker = "Tomasa" | "Interviewer" | "unknown"

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

export interface GapSegment extends LabeledSegment {
  gap_filled?: boolean
  original_text?: string
}

// ─── Pure Helpers (exported for testing) ─────────────────────────────────────

const LOGPROB_MIN = -0.5
const NO_SPEECH_MAX = 0.6
const COMPRESSION_MAX = 2.4
const INAUDIBLE_RE = /\[inaudible\]/i

/**
 * Return the array indices of segments needing repair. A segment is flagged
 * when any confidence metric is out of range or it contains a literal
 * [inaudible] marker.
 */
export function flagSegments(segments: LabeledSegment[]): number[] {
  const flagged: number[] = []
  segments.forEach((s, i) => {
    if (
      s.avg_logprob < LOGPROB_MIN ||
      s.no_speech_prob > NO_SPEECH_MAX ||
      s.compression_ratio > COMPRESSION_MAX ||
      INAUDIBLE_RE.test(s.text)
    ) {
      flagged.push(i)
    }
  })
  return flagged
}

/**
 * Build the context block passed to Claude: the `radius` segments before and
 * after `index` (clamped to bounds), each as "<speaker>: <text>", with the
 * target line prefixed ">> ".
 */
export function buildContext(
  segments: LabeledSegment[],
  index: number,
  radius = 3
): string {
  const start = Math.max(0, index - radius)
  const end = Math.min(segments.length - 1, index + radius)
  const lines: string[] = []
  for (let i = start; i <= end; i++) {
    const s = segments[i]
    const line = `${s.speaker}: ${s.text}`
    lines.push(i === index ? `>> ${line}` : line)
  }
  return lines.join("\n")
}

/**
 * Extract the corrected segment text from Claude's JSON response.
 * Strips optional markdown fences, parses `{"text": "..."}`, and returns the
 * trimmed text. Throws if the response is not valid JSON with a string `text`
 * field — the caller treats that as a failed attempt (fail-safe to original).
 */
export function extractFilledText(raw: string): string {
  const stripped = raw
    .trim()
    .replace(/^```(?:json)?\r?\n?/i, "")
    .replace(/\r?\n?```$/, "")
    .trim()
  const parsed = JSON.parse(stripped)
  if (typeof parsed?.text !== "string") {
    throw new Error("response missing string 'text' field")
  }
  return parsed.text.trim()
}

// ─── Claude Fill ──────────────────────────────────────────────────────────────

const CLAUDE_MODEL = "sonnet"

const SYSTEM_PROMPT = `You are repairing a single segment of a Spanish-language oral history
interview transcribed by ASR. Two speakers: "Tomasa" (grandmother, ~88, from Chihuahua,
Mexico) and "Interviewer" (her grandson, Kristian).

Some words are inaudible, mis-heard, or low-confidence. Using the surrounding context,
return a corrected version of ONLY the marked segment (the line starting with ">>").

Known names — use these spellings when the audio is ambiguous:
- Family: Epifanio (father), Francisca (mother); siblings Evaristo, Paulina, Estefana, Lala;
  husband Toño; children Miguel, Antonio, Arnulfo, Jesús, Tere; Marta;
  grandchildren Kristian, Ericka, Alan, Aby.
- Places: Rancho Los Olices, El Oro (a mine), Parral, Santa Bárbara, Chihuahua,
  Estación Guichivo/Bahuichivo, Monterrey, Juárez.

Chihuahua accent (shesheo) — apply sparingly, only if already hinted phonetically:
muchacho→mushasho, chile→shile, ocho→osho, escúchame→escúshame.

Rules:
- Be conservative. If the marked segment is already coherent Spanish and the context gives
  no clear evidence of an ASR error, return it EXACTLY as-is. Do NOT paraphrase, "improve",
  or guess alternative words. Inventing words she did not say corrupts the record.
- Only change text when there is a [INAUDIBLE]/[inaudible] marker to fill, or a clear
  mis-hearing of one of the known names/places above.
- Keep Tomasa's natural voice; do not add content beyond the segment.

Respond with ONLY a JSON object: {"text": "<the corrected segment text, or the original
text unchanged if there is no clear error>"}. No speaker name, no commentary, no markdown
fences, no extra keys. The "text" value must never contain explanations — only the segment.`

/**
 * Ask Claude to correct a single flagged segment given its context.
 * Fail-safe: returns the original text unchanged if every attempt fails.
 */
export async function fillSegment(
  target: LabeledSegment,
  context: string,
  retries = 2
): Promise<string> {
  const prompt = `${SYSTEM_PROMPT}\n\nContext:\n${context}\n\nJSON for the ">>" segment:`

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const proc = Bun.spawn(["claude", "-p", "--model", CLAUDE_MODEL, prompt], {
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

      const cleaned = extractFilledText(stdout)

      if (cleaned.length > 0) return cleaned
      throw new Error("empty response")
    } catch (err) {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)))
        continue
      }
      console.warn(`  ⚠ fill failed for segment id=${target.id}, keeping original`)
      console.error("  Last error:", err)
      return target.text
    }
  }
  return target.text
}

// ─── File Processing ───────────────────────────────────────────────────────────

export async function fillFile(inputPath: string, outputPath: string): Promise<void> {
  const filename = inputPath.split("/").pop()!

  if (existsSync(outputPath)) {
    console.log(`✓ Already gap-filled: ${filename}`)
    return
  }

  const raw = JSON.parse(readFileSync(inputPath, "utf-8"))
  const segments: GapSegment[] = raw.segments ?? []
  const flagged = flagSegments(segments)

  console.log(`  ${filename}: ${segments.length} segments, ${flagged.length} flagged`)

  let filledCount = 0
  for (const idx of flagged) {
    const target = segments[idx]
    const context = buildContext(segments, idx)
    const corrected = await fillSegment(target, context)
    // Only count meaningful changes — ignore whitespace-only diffs (Whisper
    // segments carry a leading space the model tends to drop).
    if (corrected.trim() !== target.text.trim()) {
      const leadingSpace = /^\s/.test(target.text) ? " " : ""
      target.original_text = target.text
      target.text = leadingSpace + corrected
      target.gap_filled = true
      filledCount++
    }
  }

  writeFileSync(outputPath, JSON.stringify({ ...raw, segments }, null, 2))
  console.log(`✓ ${filename}: ${filledCount} filled / ${flagged.length} flagged`)
}

// ─── Main ────────────────────────────────────────────────────────────────────

if (import.meta.main) {
  const DATA_DIR =
    process.env.TOMASA_DATA_DIR ?? join(import.meta.dir, "..", "..", "data")
  const INPUT_DIR = join(DATA_DIR, "labeled-transcripts")
  const OUTPUT_DIR = join(DATA_DIR, "gap-filled-transcripts")

  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true })

  const FILES = [
    "tomasa_2025-11-20_0805.json",
    "tomasa_2025-11-20_1312.json",
    "tomasa_2025-11-20_1336.json",
  ]

  console.log(`Gap-filling ${FILES.length} transcript(s)...\n`)

  for (const f of FILES) {
    await fillFile(join(INPUT_DIR, f), join(OUTPUT_DIR, f))
  }

  console.log("\nDone. Gap-filled files in:", OUTPUT_DIR)
}
