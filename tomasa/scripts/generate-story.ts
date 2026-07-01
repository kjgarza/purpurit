#!/usr/bin/env bun
/**
 * Generate a narrative story draft from labeled transcript beats using Claude.
 * Codifies the manual process used for the moon-landing draft (issue #10).
 *
 * Reads data/labeled-transcripts/, writes apps/tomasa/src/content/drafts/<story>.md
 * with frontmatter citing the source transcript(s) and segment range(s).
 *
 * Usage (explicit segment range):
 *   bun scripts/generate-story.ts \
 *     --transcript tomasa_2025-11-16_1704:395-428 \
 *     --story moon-landing --title "La llegada a la luna" --decade 1960s
 *
 * Usage (theme-based beat selection across transcripts):
 *   bun scripts/generate-story.ts \
 *     --transcript tomasa_2025-11-16_1704 --transcript tomasa_2025-11-20_0805 \
 *     --theme "infancia pobre en el rancho en los años 30" \
 *     --story poor-child --title "Una niña pobre" --decade 1930s
 *
 *   TOMASA_DATA_DIR overrides the data dir (needed when run from a git worktree).
 *
 * See docs/story-generation.md for the full workflow — including the mandatory
 * human voice-check (read aloud with a Spanish speaker) before a draft is
 * integrated into decades.ts.
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

export interface SegmentRange {
  start: number
  end: number
}

export interface TranscriptSpec {
  name: string
  range?: SegmentRange
}

export interface StoryArgs {
  transcripts: TranscriptSpec[]
  theme?: string
  story: string
  title: string
  decade: string
  force: boolean
}

export interface SourceCitation {
  transcript: string
  segments: string
}

export interface StoryDraft {
  body: string
  emotionalSpine: string
  openQuestions: string[]
}

// ─── Pure Helpers (exported for testing) ─────────────────────────────────────

// Both values end up in filesystem paths — reject separators, dots, "..".
const TRANSCRIPT_NAME_RE = /^[A-Za-z0-9_-]+$/
const STORY_ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/
// --decade lands unquoted in YAML frontmatter — restrict its shape to prevent injection.
const DECADE_RE = /^\d{4}s$/

/**
 * Parse a --transcript value: "<name>" or "<name>:<start>-<end>".
 * The range is a segment-id range within that transcript, inclusive.
 */
export function parseTranscriptSpec(spec: string): TranscriptSpec {
  const colon = spec.lastIndexOf(":")
  if (colon === -1) {
    if (!TRANSCRIPT_NAME_RE.test(spec)) {
      throw new Error(
        `Invalid transcript name "${spec}" — only letters, digits, "_" and "-" are allowed`
      )
    }
    return { name: spec }
  }

  const name = spec.slice(0, colon)
  const rangePart = spec.slice(colon + 1)
  const match = rangePart.match(/^(\d+)-(\d+)$/)
  if (!name || !match) {
    throw new Error(
      `Invalid --transcript spec "${spec}" — expected "<name>" or "<name>:<start>-<end>"`
    )
  }
  if (!TRANSCRIPT_NAME_RE.test(name)) {
    throw new Error(
      `Invalid transcript name "${name}" — only letters, digits, "_" and "-" are allowed`
    )
  }

  const start = Number(match[1])
  const end = Number(match[2])
  if (start > end) {
    throw new Error(`Invalid range in "${spec}" — start ${start} > end ${end}`)
  }
  return { name, range: { start, end } }
}

/**
 * Parse CLI args. Requires --story, --title, --decade, and at least one
 * --transcript. Every transcript must carry a range unless --theme is given.
 */
export function parseStoryArgs(argv: string[]): StoryArgs {
  const transcripts: TranscriptSpec[] = []
  let theme: string | undefined
  let story = ""
  let title = ""
  let decade = ""
  let force = false

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const next = () => {
      const v = argv[++i]
      if (v === undefined) throw new Error(`Missing value for ${arg}`)
      return v
    }
    switch (arg) {
      case "--transcript":
        transcripts.push(parseTranscriptSpec(next()))
        break
      case "--theme":
        theme = next()
        break
      case "--story":
        story = next()
        break
      case "--title":
        title = next()
        break
      case "--decade":
        decade = next()
        break
      case "--force":
        force = true
        break
      default:
        throw new Error(`Unknown argument: ${arg}`)
    }
  }

  if (transcripts.length === 0) throw new Error("At least one --transcript is required")
  if (!story) throw new Error("--story is required (kebab-case id, e.g. poor-child)")
  if (!STORY_ID_RE.test(story)) {
    throw new Error(
      `Invalid --story "${story}" — must be a kebab-case id (lowercase letters/digits/hyphens, e.g. poor-child)`
    )
  }
  if (!title) throw new Error("--title is required")
  if (!decade) throw new Error("--decade is required (e.g. 1930s)")
  if (!DECADE_RE.test(decade)) {
    throw new Error(`Invalid --decade "${decade}" — must match "<4 digits>s", e.g. 1930s`)
  }

  const missingRange = transcripts.filter((t) => !t.range)
  if (missingRange.length > 0 && !theme) {
    throw new Error(
      `No beat selection for ${missingRange.map((t) => t.name).join(", ")} — ` +
        "give each transcript a :<start>-<end> range or pass --theme"
    )
  }

  return { transcripts, theme, story, title, decade, force }
}

/** Segments whose id falls inside the inclusive range. */
export function selectByRange(
  segments: LabeledSegment[],
  range: SegmentRange
): LabeledSegment[] {
  return segments.filter((s) => s.id >= range.start && s.id <= range.end)
}

/**
 * Collapse a set of segment ids into sorted contiguous ranges. Gaps of up to
 * `gapTolerance` ids are bridged so short interviewer interjections between
 * selected beats do not split a run.
 */
export function groupIntoRuns(ids: number[], gapTolerance = 2): SegmentRange[] {
  if (ids.length === 0) return []

  const sorted = [...new Set(ids)].sort((a, b) => a - b)
  const runs: SegmentRange[] = []
  let start = sorted[0]
  let end = sorted[0]

  for (const id of sorted.slice(1)) {
    if (id - end <= gapTolerance + 1) {
      end = id
    } else {
      runs.push({ start, end })
      start = id
      end = id
    }
  }
  runs.push({ start, end })
  return runs
}

/** "12-40, 88-102" — single-segment runs collapse to one number. */
export function formatRuns(runs: SegmentRange[]): string {
  return runs
    .map((r) => (r.start === r.end ? `${r.start}` : `${r.start}-${r.end}`))
    .join(", ")
}

/** One beat per line: "<id> | <speaker> | <text>". */
export function formatBeats(beats: LabeledSegment[]): string {
  return beats.map((s) => `${s.id} | ${s.speaker} | ${s.text.trim()}`).join("\n")
}

/** Double-quoted YAML scalar with backslash, quote, and control-char escaping. */
export function yamlQuote(value: string): string {
  return `"${value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t")}"`
}

/**
 * Build the draft frontmatter. Shape matches the hand-written moon-landing.md
 * worked example described in issue #10: story, decade, sources (transcript +
 * segment range), emotional-spine, open-questions, status draft-v1.
 */
export function buildFrontmatter(
  meta: { story: string; title: string; decade: string; generated: string },
  sources: SourceCitation[],
  emotionalSpine: string,
  openQuestions: string[]
): string {
  const lines = [
    "---",
    `story: ${meta.story}`,
    `title: ${yamlQuote(meta.title)}`,
    `decade: ${meta.decade}`,
    "status: draft-v1",
    `generated: ${meta.generated}`,
    "sources:",
    ...sources.flatMap((s) => [
      `  - transcript: ${s.transcript}`,
      `    segments: ${yamlQuote(s.segments)}`,
    ]),
    `emotional-spine: ${yamlQuote(emotionalSpine)}`,
  ]

  if (openQuestions.length === 0) {
    lines.push("open-questions: []")
  } else {
    lines.push("open-questions:")
    for (const q of openQuestions) lines.push(`  - ${yamlQuote(q)}`)
  }

  lines.push("voice-check: pending", "---")
  return lines.join("\n")
}

/** Strip optional markdown fences (CRLF- and case-tolerant) and parse JSON. */
export function extractJson(raw: string): unknown {
  const stripped = raw
    .trim()
    .replace(/^```(?:json)?\r?\n?/i, "")
    .replace(/\r?\n?```$/, "")
    .trim()
  return JSON.parse(stripped)
}

/**
 * Parse Claude's draft response: {"body", "emotionalSpine", "openQuestions"}.
 * Throws if body or emotionalSpine is missing — the caller retries.
 */
export function extractDraft(raw: string): StoryDraft {
  const parsed = extractJson(raw) as Partial<StoryDraft>
  if (typeof parsed?.body !== "string" || parsed.body.trim().length === 0) {
    throw new Error("response missing non-empty string 'body' field")
  }
  if (typeof parsed?.emotionalSpine !== "string") {
    throw new Error("response missing string 'emotionalSpine' field")
  }
  const openQuestions = Array.isArray(parsed.openQuestions)
    ? parsed.openQuestions.filter((q): q is string => typeof q === "string")
    : []
  return {
    body: parsed.body.trim(),
    emotionalSpine: parsed.emotionalSpine.trim(),
    openQuestions,
  }
}

/** Parse Claude's beat-selection response: a JSON array of segment ids. */
export function extractSelectedIds(raw: string): number[] {
  const parsed = extractJson(raw)
  if (!Array.isArray(parsed)) throw new Error("response is not a JSON array")
  return parsed.filter((id): id is number => Number.isInteger(id))
}

// ─── Claude Subprocess ────────────────────────────────────────────────────────

const CLAUDE_MODEL = "sonnet"
const SELECT_CHUNK_SIZE = 120

/**
 * Run the claude subprocess and parse its output with `parse`. Retries on
 * both subprocess failure AND parse failure — a malformed/fenced response is
 * usually transient, same as fill-transcript-gaps.ts / add-speaker-labels.ts.
 */
async function runClaude<T>(
  prompt: string,
  parse: (raw: string) => T,
  retries = 2
): Promise<T> {
  let lastErr: unknown
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
      return parse(stdout)
    } catch (err) {
      lastErr = err
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)))
      }
    }
  }
  throw lastErr
}

// ─── Beat Selection (theme mode) ──────────────────────────────────────────────

const SELECT_SYSTEM_PROMPT = `You are selecting segments from a Spanish-language oral history
interview with Tomasa, an elderly Mexican grandmother from Chihuahua. Two speakers:
"Tomasa" (long narratives about her past) and "Interviewer" (her grandson, short questions).

Given a theme and a list of segments, return the ids of segments that belong to that theme —
Tomasa's tellings of it plus the interviewer questions that prompted them. Prefer complete
narrative passages over isolated mentions. If nothing matches, return [].

Respond with ONLY a JSON array of segment id numbers, e.g. [395, 396, 397].
No extra text, no markdown fences.`

async function selectBeatsByTheme(
  name: string,
  segments: LabeledSegment[],
  theme: string
): Promise<LabeledSegment[]> {
  const minSegs = segments.map((s) => ({ id: s.id, speaker: s.speaker, text: s.text }))
  const chunks: (typeof minSegs)[] = []
  for (let i = 0; i < minSegs.length; i += SELECT_CHUNK_SIZE) {
    chunks.push(minSegs.slice(i, i + SELECT_CHUNK_SIZE))
  }

  const selected: number[] = []
  for (let i = 0; i < chunks.length; i++) {
    process.stdout.write(`    ${name}: selecting beats, chunk ${i + 1}/${chunks.length}...`)
    const prompt = `${SELECT_SYSTEM_PROMPT}\n\nTheme: ${theme}\n\nSegments:\n${JSON.stringify(chunks[i])}`
    try {
      const ids = await runClaude(prompt, extractSelectedIds)
      selected.push(...ids)
      process.stdout.write(` ✓ (${ids.length})\n`)
    } catch (err) {
      process.stdout.write(" ✗ failed\n")
      throw new Error(
        `${name}: beat selection failed on chunk ${i + 1}/${chunks.length} after retries`,
        { cause: err }
      )
    }
  }

  const runs = groupIntoRuns(selected)
  const inRuns = new Set<number>()
  for (const seg of segments) {
    if (runs.some((r) => seg.id >= r.start && seg.id <= r.end)) inRuns.add(seg.id)
  }
  return segments.filter((s) => inRuns.has(s.id))
}

// ─── Story Drafting ───────────────────────────────────────────────────────────

const DRAFT_SYSTEM_PROMPT = `You are drafting a short narrative story for a memorial website about
Tomasa, a Mexican grandmother from rural Chihuahua, built ONLY from the interview beats
provided — her own words from oral history recordings, transcribed by ASR.

Rules:
- Write in Spanish, first person, in Tomasa's voice.
- Preserve her actual phrasing wherever possible. You may lightly smooth ASR noise and
  connect beats, but NEVER invent events, names, places, dates, or feelings that are not
  in the beats. Inventing content corrupts the family record.
- Keep her rural Chihuahua register when it appears in the beats ("mijo", "fíjate", "pos").
- Ignore beats that are clearly off-topic for the requested story.
- Structure: 3–6 short paragraphs with a clear emotional arc — the story must have one
  emotional spine, a single feeling or tension that holds it together.
- List open questions: facts that are unclear, contradictory, or missing from the beats
  that a family member should verify before publication.

Respond with ONLY a JSON object, no markdown fences, no commentary:
{
  "body": "<the story draft in markdown, paragraphs separated by blank lines>",
  "emotionalSpine": "<one sentence naming the feeling/tension that carries the story>",
  "openQuestions": ["<question a family member should verify>", ...]
}`

async function draftStory(
  beatsBlock: string,
  args: StoryArgs
): Promise<StoryDraft> {
  const themeLine = args.theme ? `\nTheme: ${args.theme}` : ""
  const prompt =
    `${DRAFT_SYSTEM_PROMPT}\n\nStory: ${args.title} (decade: ${args.decade})${themeLine}` +
    `\n\nInterview beats (id | speaker | text):\n${beatsBlock}\n\nJSON draft:`

  return runClaude(prompt, extractDraft)
}

// ─── Main ────────────────────────────────────────────────────────────────────

const USAGE = `Usage:
  bun scripts/generate-story.ts \\
    --transcript <name>[:<start>-<end>] [--transcript ...] \\
    [--theme "<beat selection theme>"] \\
    --story <kebab-id> --title "<title>" --decade <1930s> [--force]`

if (import.meta.main) {
  let args: StoryArgs
  try {
    args = parseStoryArgs(process.argv.slice(2))
  } catch (err) {
    console.error(`✗ ${err instanceof Error ? err.message : err}\n\n${USAGE}`)
    process.exit(1)
  }

  const TOMASA_DIR = join(import.meta.dir, "..")
  const DATA_DIR = process.env.TOMASA_DATA_DIR ?? join(TOMASA_DIR, "..", "data")
  const LABELED_DIR = join(DATA_DIR, "labeled-transcripts")
  const DRAFTS_DIR = join(TOMASA_DIR, "apps", "tomasa", "src", "content", "drafts")
  const outputPath = join(DRAFTS_DIR, `${args.story}.md`)

  if (existsSync(outputPath) && !args.force) {
    console.log(`✓ Draft already exists: ${outputPath}`)
    console.log("  Use --force to regenerate (overwrites the existing draft).")
    process.exit(0)
  }

  const sources: SourceCitation[] = []
  const beatBlocks: string[] = []
  let totalBeats = 0

  for (const spec of args.transcripts) {
    const inputPath = join(LABELED_DIR, `${spec.name}.json`)
    if (!existsSync(inputPath)) {
      console.error(`✗ Labeled transcript not found: ${inputPath}`)
      console.error("  Run scripts/add-speaker-labels.ts first, or check TOMASA_DATA_DIR.")
      process.exit(1)
    }

    const raw = JSON.parse(readFileSync(inputPath, "utf-8"))
    const segments: LabeledSegment[] = raw.segments ?? []

    const beats = spec.range
      ? selectByRange(segments, spec.range)
      : await selectBeatsByTheme(spec.name, segments, args.theme!)

    if (beats.length === 0) {
      console.warn(`  ⚠ ${spec.name}: no beats selected, skipping`)
      continue
    }

    const runs = groupIntoRuns(beats.map((s) => s.id))
    sources.push({ transcript: spec.name, segments: formatRuns(runs) })
    beatBlocks.push(`[${spec.name}]\n${formatBeats(beats)}`)
    totalBeats += beats.length
    console.log(`  ${spec.name}: ${beats.length} beats (segments ${formatRuns(runs)})`)
  }

  if (totalBeats === 0) {
    console.error("✗ No beats selected from any transcript — nothing to draft.")
    process.exit(1)
  }

  console.log(`\nDrafting "${args.title}" from ${totalBeats} beats...`)
  const draft = await draftStory(beatBlocks.join("\n\n"), args)

  const generated = new Date().toISOString().slice(0, 10)
  const frontmatter = buildFrontmatter(
    { story: args.story, title: args.title, decade: args.decade, generated },
    sources,
    draft.emotionalSpine,
    draft.openQuestions
  )

  if (!existsSync(DRAFTS_DIR)) mkdirSync(DRAFTS_DIR, { recursive: true })
  writeFileSync(outputPath, `${frontmatter}\n\n${draft.body}\n`)

  console.log(`\n✓ Draft written: ${outputPath}`)
  if (draft.openQuestions.length > 0) {
    console.log(`  Open questions to verify with family: ${draft.openQuestions.length}`)
  }
  console.log(
    "\nNext step (required before decades.ts integration): voice-check —\n" +
      "read the draft aloud with a Spanish speaker. See docs/story-generation.md."
  )
}
