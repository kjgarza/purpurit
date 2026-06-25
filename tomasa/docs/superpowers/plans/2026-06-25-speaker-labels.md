# Speaker Labels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `speaker` fields ("Tomasa" | "Interviewer") to all transcript JSONs in `data/processed-transcripts/` using Claude with sliding-window chunking.

**Architecture:** Strip heavy segment metadata before calling Claude (90% token reduction), split segments into 60-segment chunks with 10-segment overlap, run all 5 files concurrently with chunks processed serially per file. Output goes to `data/labeled-transcripts/`.

**Tech Stack:** Bun 1.1+, TypeScript 5.6+, `@anthropic-ai/sdk`, existing `openai` SDK pattern for reference.

## Global Constraints

- Bun runtime only — no Node.js `require()`, use `import`
- `#!/usr/bin/env bun` shebang on every script
- No semicolons, double quotes, 2-space indent (matches project style)
- `ANTHROPIC_API_KEY` env var — never hardcode
- Output dir: `data/labeled-transcripts/` (relative to `data/`, sibling of `processed-transcripts/`)
- Speaker values are exactly `"Tomasa"` or `"Interviewer"` or `"unknown"` — no other strings
- Chunk size: 60, overlap: 10
- Model: `claude-haiku-4-5-20251001`
- Transcription script already has Nov-20 entries — do NOT modify it

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `tomasa/scripts/add-speaker-labels.ts` | Main script — loads files, calls Claude, writes output |
| Create | `tomasa/scripts/add-speaker-labels.test.ts` | Unit tests for pure helper functions |
| Modify | `tomasa/package.json` | Add `@anthropic-ai/sdk` to devDependencies |

---

## Task 1: Install Anthropic SDK

**Files:**
- Modify: `tomasa/package.json`

**Interfaces:**
- Produces: `import Anthropic from "@anthropic-ai/sdk"` works in scripts

- [ ] **Step 1: Add SDK to devDependencies**

Run from the `tomasa/` directory:

```bash
cd tomasa && bun add -d @anthropic-ai/sdk
```

Expected output: `bun add v1.x — done` and `@anthropic-ai/sdk` appears in `package.json` devDependencies.

- [ ] **Step 2: Verify import resolves**

```bash
cd tomasa && bun -e "import Anthropic from '@anthropic-ai/sdk'; console.log('ok')"
```

Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add tomasa/package.json tomasa/bun.lock
git commit -m "chore(scripts): add @anthropic-ai/sdk for speaker labeling"
```

---

## Task 2: Write failing tests for pure helper functions

**Files:**
- Create: `tomosa/scripts/add-speaker-labels.test.ts`

**Interfaces:**
- Consumes: `chunkSegments`, `deduplicateOverlap`, `mergeLabels` exported from `tomosa/scripts/add-speaker-labels.ts` (not yet written)
- Produces: failing test suite that drives Task 3 implementation

- [ ] **Step 1: Create test file**

Create `tomasa/scripts/add-speaker-labels.test.ts`:

```typescript
import { describe, it, expect } from "bun:test"
import { chunkSegments, deduplicateOverlap, mergeLabels } from "./add-speaker-labels"

const seg = (id: number, text = `seg ${id}`) => ({ id, text })

describe("chunkSegments", () => {
  it("returns single chunk when segments fit", () => {
    const segs = Array.from({ length: 5 }, (_, i) => seg(i))
    const chunks = chunkSegments(segs, 60, 10)
    expect(chunks).toHaveLength(1)
    expect(chunks[0]).toHaveLength(5)
  })

  it("produces overlapping chunks for large input", () => {
    const segs = Array.from({ length: 80 }, (_, i) => seg(i))
    const chunks = chunkSegments(segs, 60, 10)
    // First chunk: segs 0-59 (60 items)
    // Second chunk: segs 50-79 (30 items, starts at 60-overlap=50)
    expect(chunks).toHaveLength(2)
    expect(chunks[0]).toHaveLength(60)
    expect(chunks[0][0].id).toBe(0)
    expect(chunks[0][59].id).toBe(59)
    // Second chunk starts 10 before next boundary
    expect(chunks[1][0].id).toBe(50)
    expect(chunks[1][chunks[1].length - 1].id).toBe(79)
  })

  it("handles exactly chunk-size segments", () => {
    const segs = Array.from({ length: 60 }, (_, i) => seg(i))
    const chunks = chunkSegments(segs, 60, 10)
    expect(chunks).toHaveLength(1)
  })

  it("handles three chunks with overlap", () => {
    const segs = Array.from({ length: 140 }, (_, i) => seg(i))
    const chunks = chunkSegments(segs, 60, 10)
    expect(chunks).toHaveLength(3)
    // Each interior chunk starts at (60-10) * chunkIndex = 50 * chunkIndex
    expect(chunks[1][0].id).toBe(50)
    expect(chunks[2][0].id).toBe(100)
  })
})

describe("deduplicateOverlap", () => {
  it("uses mid-chunk result when two chunks overlap on a segment", () => {
    // Chunk 0 covers segs 0-59, chunk 1 covers segs 50-79
    // segs 50-59 appear in both chunks
    // seg 55 is at position 55 in chunk0 (edge) and position 5 in chunk1 (mid-ish)
    // For chunk0 of size 60, distanceFromEdge = min(55, 4) = 4
    // For chunk1 of size 30, distanceFromEdge = min(5, 24) = 5
    // chunk1 wins (higher distance from edge)
    const chunkResults: Array<{ chunkStart: number; chunkSize: number; labels: Map<number, string> }> = [
      {
        chunkStart: 0,
        chunkSize: 60,
        labels: new Map(Array.from({ length: 60 }, (_, i) => [i, "Tomasa"])),
      },
      {
        chunkStart: 50,
        chunkSize: 30,
        labels: new Map(Array.from({ length: 30 }, (_, i) => [50 + i, "Interviewer"])),
      },
    ]

    const result = deduplicateOverlap(chunkResults)
    // segs 0-49: only in chunk0 → Tomasa
    expect(result.get(0)).toBe("Tomasa")
    expect(result.get(49)).toBe("Tomasa")
    // segs 50-59: conflict — chunk1 wins (seg is closer to chunk1's center)
    expect(result.get(55)).toBe("Interviewer")
    // segs 60-79: only in chunk1 → Interviewer
    expect(result.get(60)).toBe("Interviewer")
  })

  it("handles no overlap (single chunk)", () => {
    const chunkResults = [
      {
        chunkStart: 0,
        chunkSize: 5,
        labels: new Map<number, string>([[0, "Tomasa"], [1, "Interviewer"], [2, "Tomasa"]]),
      },
    ]
    const result = deduplicateOverlap(chunkResults)
    expect(result.get(0)).toBe("Tomasa")
    expect(result.get(1)).toBe("Interviewer")
  })
})

describe("mergeLabels", () => {
  it("adds speaker field to each segment", () => {
    const segments = [
      { id: 0, seek: 0, start: 0, end: 5, text: "Hola", tokens: [1, 2], temperature: 0, avg_logprob: -0.5, compression_ratio: 1.1, no_speech_prob: 0.1 },
      { id: 1, seek: 0, start: 5, end: 10, text: "Buenas", tokens: [3, 4], temperature: 0, avg_logprob: -0.4, compression_ratio: 1.0, no_speech_prob: 0.05 },
    ]
    const labels = new Map<number, string>([[0, "Interviewer"], [1, "Tomasa"]])
    const result = mergeLabels(segments, labels)
    expect(result[0].speaker).toBe("Interviewer")
    expect(result[1].speaker).toBe("Tomasa")
    // Original fields preserved
    expect(result[0].tokens).toEqual([1, 2])
    expect(result[1].start).toBe(5)
  })

  it("fills missing labels with 'unknown'", () => {
    const segments = [{ id: 0, seek: 0, start: 0, end: 5, text: "test", tokens: [], temperature: 0, avg_logprob: 0, compression_ratio: 1, no_speech_prob: 0 }]
    const labels = new Map<number, string>() // empty — no label for seg 0
    const result = mergeLabels(segments, labels)
    expect(result[0].speaker).toBe("unknown")
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd tomasa && bun test scripts/add-speaker-labels.test.ts
```

Expected: `error: Cannot find module './add-speaker-labels'` or similar import failure. This is correct — the module doesn't exist yet.

- [ ] **Step 3: Commit failing tests**

```bash
git add tomasa/scripts/add-speaker-labels.test.ts
git commit -m "test(scripts): add failing tests for speaker label helpers"
```

---

## Task 3: Implement helper functions (make tests pass)

**Files:**
- Create: `tomasa/scripts/add-speaker-labels.ts` (helpers + exports only, no main logic yet)

**Interfaces:**
- Consumes: nothing external
- Produces:
  - `chunkSegments(segments: MinSegment[], chunkSize: number, overlap: number): MinSegment[][]`
  - `deduplicateOverlap(chunks: ChunkResult[]): Map<number, string>`
  - `mergeLabels(segments: RawSegment[], labels: Map<number, string>): LabeledSegment[]`
  - Types: `MinSegment`, `RawSegment`, `LabeledSegment`, `ChunkResult`

- [ ] **Step 1: Create script with helpers**

Create `tomasa/scripts/add-speaker-labels.ts`:

```typescript
#!/usr/bin/env bun
/**
 * Add speaker labels to all processed transcript JSONs using Claude.
 * Writes labeled copies to data/labeled-transcripts/.
 *
 * Usage: bun scripts/add-speaker-labels.ts
 */

import Anthropic from "@anthropic-ai/sdk"
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
```

- [ ] **Step 2: Run tests — should pass**

```bash
cd tomasa && bun test scripts/add-speaker-labels.test.ts
```

Expected: all tests PASS, 0 failures.

- [ ] **Step 3: Commit**

```bash
git add tomasa/scripts/add-speaker-labels.ts
git commit -m "feat(scripts): implement speaker label helper functions"
```

---

## Task 4: Implement main Claude labeling script

**Files:**
- Modify: `tomasa/scripts/add-speaker-labels.ts` (append main logic after helpers)

**Interfaces:**
- Consumes: `chunkSegments`, `deduplicateOverlap`, `mergeLabels` from Task 3; `@anthropic-ai/sdk`
- Produces: `data/labeled-transcripts/*.json` files with `speaker` field on every segment

- [ ] **Step 1: Append main logic to `add-speaker-labels.ts`**

Append the following after the `mergeLabels` function (after the `// ─── Pure Helpers` block ends):

```typescript
// ─── Claude Labeling ──────────────────────────────────────────────────────────

const CHUNK_SIZE = 60
const OVERLAP = 10
const MODEL = "claude-haiku-4-5-20251001"

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
  client: Anthropic,
  chunk: MinSegment[],
  retries = 2
): Promise<Map<number, Speaker>> {
  const userContent = JSON.stringify(chunk.map((s) => ({ id: s.id, text: s.text })))

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }],
      })

      const raw = response.content[0].type === "text" ? response.content[0].text : ""
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
      return new Map()
    }
  }
  return new Map()
}

async function labelFile(
  client: Anthropic,
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
    const labels = await labelChunk(client, chunk)
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

const TOMASA_DIR = join(import.meta.dir, "..")
const DATA_DIR = join(TOMASA_DIR, "..", "data")
const INPUT_DIR = join(DATA_DIR, "processed-transcripts")
const OUTPUT_DIR = join(DATA_DIR, "labeled-transcripts")

if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true })

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const inputFiles = readdirSync(INPUT_DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => ({ input: join(INPUT_DIR, f), output: join(OUTPUT_DIR, f) }))

console.log(`Labeling ${inputFiles.length} transcript(s)...\n`)

await Promise.all(
  inputFiles.map(({ input, output }) => labelFile(client, input, output))
)

console.log("\nDone. Labeled files in:", OUTPUT_DIR)
```

- [ ] **Step 2: Verify tests still pass**

```bash
cd tomasa && bun test scripts/add-speaker-labels.test.ts
```

Expected: all tests PASS (main logic appended after exports doesn't affect tests).

- [ ] **Step 3: Type-check**

```bash
cd tomasa && bun run type-check 2>&1 | head -30
```

Expected: 0 errors (or only pre-existing errors unrelated to this file).

- [ ] **Step 4: Commit**

```bash
git add tomasa/scripts/add-speaker-labels.ts
git commit -m "feat(scripts): add speaker labeling script with Claude and chunked inference"
```

---

## Task 5: End-to-end run

**Files:**
- Creates: `data/labeled-transcripts/*.json` (runtime output, not committed)

**Interfaces:**
- Consumes: `data/processed-transcripts/*.json`, `ANTHROPIC_API_KEY` env var
- Produces: labeled JSON files for manual review

- [ ] **Step 1: Confirm processed transcripts exist**

```bash
ls -la data/processed-transcripts/*.json
```

Expected: at least `sunday-17-04.json`, `sunday-22-08.json`, `wednesday-17-57.json` present. If Nov-20 files missing, run transcription first:

```bash
cd tomasa && OPENAI_API_KEY=<your-key> bun scripts/transcribe-with-timestamps.ts
```

- [ ] **Step 2: Run the labeling script**

```bash
cd tomasa && ANTHROPIC_API_KEY=<your-key> bun scripts/add-speaker-labels.ts
```

Expected output (example):

```
Labeling 5 transcript(s)...

  sunday-22-08.json: 62 segments → 1 chunks
    chunk 1/1... ✓
✓ sunday-22-08.json: 38 Tomasa / 24 Interviewer / 0 unknown

  sunday-17-04.json: 443 segments → 8 chunks
    chunk 1/8... ✓
    ...
✓ sunday-17-04.json: 287 Tomasa / 156 Interviewer / 0 unknown

Done. Labeled files in: /path/to/data/labeled-transcripts
```

- [ ] **Step 3: Spot-check output**

```bash
cd tomasa && bun -e "
import { readFileSync } from 'fs'
import { join } from 'path'
const d = JSON.parse(readFileSync(join(import.meta.dir, '../data/labeled-transcripts/sunday-22-08.json'), 'utf-8'))
console.log('First 5 segments:')
for (const s of d.segments.slice(0, 5)) {
  console.log(\`  [\${s.speaker}] \${s.text.trim().slice(0, 60)}\`)
}
"
```

Expected: each segment shows a speaker label before its text. Verify labels make contextual sense (short questions → Interviewer, long narratives → Tomasa).

- [ ] **Step 4: Commit labeled transcripts (optional)**

If output looks correct and you want to commit the labeled files:

```bash
git add data/labeled-transcripts/
git commit -m "data: add speaker-labeled transcripts for all 5 sessions"
```

If `data/labeled-transcripts/` is gitignored, skip this step.

- [ ] **Step 5: Close issue**

```bash
gh issue close 4 --comment "Speaker labels added to all 5 sessions via add-speaker-labels.ts. Output in data/labeled-transcripts/."
```

---

## Self-Review

**Spec coverage:**
- ✅ Strip to `{id, text}` before API call (in `labelChunk` — builds `userContent` from minimal fields)
- ✅ 60-segment chunks, 10-segment overlap (`CHUNK_SIZE`, `OVERLAP` constants; `chunkSegments`)
- ✅ All 5 files concurrent (`Promise.all`)
- ✅ Chunks serial per file (sequential `for` loop in `labelFile`)
- ✅ Mid-chunk wins on overlap conflict (`deduplicateOverlap` — `distFromEdge` calculation)
- ✅ Retry on failure (2 retries, exponential backoff in `labelChunk`)
- ✅ Unknown fallback for failed chunks
- ✅ Skip already-labeled files
- ✅ Output to `data/labeled-transcripts/`
- ✅ Summary line per file (Tomasa / Interviewer / unknown counts)
- ✅ Haiku model
- ✅ Linguistic signals in system prompt

**No placeholders found.**

**Type consistency:** `ChunkResult.labels` is `Map<number, Speaker>` in both Task 3 types and Task 4 usage. `mergeLabels` returns `LabeledSegment[]` and Task 4 spreads into the output JSON correctly.
