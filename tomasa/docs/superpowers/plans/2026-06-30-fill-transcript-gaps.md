# Fill Transcript Gaps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `tomasa/scripts/fill-transcript-gaps.ts` to repair low-confidence/inaudible segments in the three Nov-20 labeled transcripts using Claude, writing auditable non-destructive output.

**Architecture:** Pure exported helpers (`flagSegments`, `buildContext`) are TDD'd in a bun test; an integration layer (`fillSegment`, `fillFile`, main) calls `claude -p --model sonnet` per flagged segment, mirroring `add-speaker-labels.ts`. Output goes to a new gitignored `data/gap-filled-transcripts/` dir with `original_text` + `gap_filled` markers.

**Tech Stack:** Bun runtime, TypeScript (strict, no semicolons, double quotes), `bun:test`, `claude` CLI subprocess.

## Global Constraints

- Code style: 2-space indent, double quotes, **no semicolons**, `import type` for type-only imports, kebab-case filenames. (verbatim from tomasa/CLAUDE.md)
- Runtime: Bun 1.1+. Tests use `import { describe, it, expect } from "bun:test"`.
- Model for gap-fill: `sonnet`.
- Scope: exactly the three files `tomasa_2025-11-20_0805`, `tomasa_2025-11-20_1312`, `tomasa_2025-11-20_1336`.
- Data dir resolves from `process.env.TOMASA_DATA_DIR` else repo-relative `tomasa/../data`. `data/` is gitignored — never commit transcript JSON.
- Fail-safe: a failed Claude call returns the original text unchanged; never lose content.
- Flag thresholds (module constants): `avg_logprob < -0.5`, `no_speech_prob > 0.6`, `compression_ratio > 2.4`, `text` matches `/\[inaudible\]/i`.

---

## File Structure

- Create: `tomasa/scripts/fill-transcript-gaps.ts` — types, pure helpers, Claude integration, main.
- Create: `tomasa/scripts/fill-transcript-gaps.test.ts` — unit tests for pure helpers.

Run all commands from the `tomasa/` directory.

---

### Task 1: Pure helper `flagSegments` (TDD)

**Files:**
- Create: `tomasa/scripts/fill-transcript-gaps.ts`
- Test: `tomasa/scripts/fill-transcript-gaps.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `interface RawSegment { id: number; seek: number; start: number; end: number; text: string; tokens: number[]; temperature: number; avg_logprob: number; compression_ratio: number; no_speech_prob: number }`
  - `type Speaker = "Tomasa" | "Interviewer" | "unknown"`
  - `interface LabeledSegment extends RawSegment { speaker: Speaker }`
  - `flagSegments(segments: LabeledSegment[]): number[]` — array indices (not segment ids) of segments needing repair.

- [ ] **Step 1: Write the failing test**

Create `tomasa/scripts/fill-transcript-gaps.test.ts`:

```ts
import { describe, it, expect } from "bun:test"
import { flagSegments, type LabeledSegment } from "./fill-transcript-gaps"

const seg = (over: Partial<LabeledSegment> = {}): LabeledSegment => ({
  id: 0,
  seek: 0,
  start: 0,
  end: 1,
  text: "hola",
  tokens: [],
  temperature: 0,
  avg_logprob: -0.3,
  compression_ratio: 1.5,
  no_speech_prob: 0.1,
  speaker: "Tomasa",
  ...over,
})

describe("flagSegments", () => {
  it("does not flag a clean segment", () => {
    expect(flagSegments([seg()])).toEqual([])
  })

  it("flags low avg_logprob", () => {
    expect(flagSegments([seg({ avg_logprob: -0.6 })])).toEqual([0])
  })

  it("flags high no_speech_prob", () => {
    expect(flagSegments([seg({ no_speech_prob: 0.7 })])).toEqual([0])
  })

  it("flags high compression_ratio", () => {
    expect(flagSegments([seg({ compression_ratio: 2.5 })])).toEqual([0])
  })

  it("flags literal [inaudible] case-insensitively", () => {
    expect(flagSegments([seg({ text: "se fue a [INAUDIBLE] el rancho" })])).toEqual([0])
  })

  it("counts a multi-threshold segment once and returns indices", () => {
    const segs = [seg(), seg({ avg_logprob: -0.6, no_speech_prob: 0.9 }), seg()]
    expect(flagSegments(segs)).toEqual([1])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test scripts/fill-transcript-gaps.test.ts`
Expected: FAIL — cannot resolve `./fill-transcript-gaps` / `flagSegments` not exported.

- [ ] **Step 3: Write minimal implementation**

Create `tomasa/scripts/fill-transcript-gaps.ts`:

```ts
#!/usr/bin/env bun
/**
 * Fill low-confidence / inaudible gaps in labeled Tomasa transcripts using Claude.
 * Reads data/labeled-transcripts/, writes data/gap-filled-transcripts/.
 *
 * Usage: bun scripts/fill-transcript-gaps.ts
 *   TOMASA_DATA_DIR overrides the data dir (needed when run from a git worktree).
 */

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

const LOGPROB_MIN = -0.5
const NO_SPEECH_MAX = 0.6
const COMPRESSION_MAX = 2.4
const INAUDIBLE_RE = /\[inaudible\]/i

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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test scripts/fill-transcript-gaps.test.ts`
Expected: PASS — 6 tests in the `flagSegments` describe block.

- [ ] **Step 5: Commit**

```bash
git add tomasa/scripts/fill-transcript-gaps.ts tomasa/scripts/fill-transcript-gaps.test.ts
git commit -m "feat(tomasa): add flagSegments for transcript gap detection"
```

---

### Task 2: Pure helper `buildContext` (TDD)

**Files:**
- Modify: `tomasa/scripts/fill-transcript-gaps.ts`
- Test: `tomasa/scripts/fill-transcript-gaps.test.ts`

**Interfaces:**
- Consumes: `LabeledSegment` from Task 1.
- Produces: `buildContext(segments: LabeledSegment[], index: number, radius?: number): string` — a newline-joined block of `"<speaker>: <text>"` lines for the window `[index-radius, index+radius]` clamped to bounds, with the target line prefixed `>> `. Default `radius = 3`.

- [ ] **Step 1: Write the failing test**

Append to `tomasa/scripts/fill-transcript-gaps.test.ts`:

```ts
import { buildContext } from "./fill-transcript-gaps"

describe("buildContext", () => {
  const segs = Array.from({ length: 10 }, (_, i) =>
    seg({ id: i, text: `line ${i}`, speaker: i % 2 === 0 ? "Tomasa" : "Interviewer" })
  )

  it("includes radius neighbors on both sides and marks the target", () => {
    const out = buildContext(segs, 5, 2)
    const lines = out.split("\n")
    expect(lines).toHaveLength(5) // 3,4,5,6,7
    expect(lines[0]).toBe("Interviewer: line 3")
    expect(lines[2]).toBe(">> Tomasa: line 5")
    expect(lines[4]).toBe("Interviewer: line 7")
  })

  it("clamps at the start of the array", () => {
    const out = buildContext(segs, 0, 3)
    const lines = out.split("\n")
    expect(lines).toHaveLength(4) // 0,1,2,3
    expect(lines[0]).toBe(">> Tomasa: line 0")
  })

  it("clamps at the end of the array", () => {
    const out = buildContext(segs, 9, 3)
    const lines = out.split("\n")
    expect(lines).toHaveLength(4) // 6,7,8,9
    expect(lines[3]).toBe(">> Interviewer: line 9")
  })

  it("defaults radius to 3", () => {
    const out = buildContext(segs, 5)
    expect(out.split("\n")).toHaveLength(7) // 2..8
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test scripts/fill-transcript-gaps.test.ts`
Expected: FAIL — `buildContext` not exported.

- [ ] **Step 3: Write minimal implementation**

Append to `tomasa/scripts/fill-transcript-gaps.ts` (after `flagSegments`):

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test scripts/fill-transcript-gaps.test.ts`
Expected: PASS — all `flagSegments` and `buildContext` tests green.

- [ ] **Step 5: Commit**

```bash
git add tomasa/scripts/fill-transcript-gaps.ts tomasa/scripts/fill-transcript-gaps.test.ts
git commit -m "feat(tomasa): add buildContext window builder for gap-fill"
```

---

### Task 3: Claude integration `fillSegment` + prompt

**Files:**
- Modify: `tomasa/scripts/fill-transcript-gaps.ts`

**Interfaces:**
- Consumes: `LabeledSegment`, `buildContext` output (context string).
- Produces:
  - `const SYSTEM_PROMPT: string` — Tomasa roster + shesheo + return-only-text instruction.
  - `fillSegment(target: LabeledSegment, context: string, retries?: number): Promise<string>` — corrected text, or `target.text` unchanged on failure. Default `retries = 2`.

Not unit-tested (subprocess), consistent with `add-speaker-labels.ts`.

- [ ] **Step 1: Add SYSTEM_PROMPT and fillSegment**

Append to `tomasa/scripts/fill-transcript-gaps.ts`:

```ts
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
- Replace any [INAUDIBLE]/[inaudible] markers with the most plausible words from context.
- Fix obvious mis-hearings of the known names/places above.
- Keep Tomasa's natural voice; do not paraphrase or add content beyond the segment.
- Return ONLY the corrected segment text. No quotes, no commentary, no markdown fences.`

export async function fillSegment(
  target: LabeledSegment,
  context: string,
  retries = 2
): Promise<string> {
  const prompt = `${SYSTEM_PROMPT}\n\nContext:\n${context}\n\nCorrected text for the ">>" segment:`

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

      const cleaned = stdout
        .trim()
        .replace(/^```(?:\w+)?\n?/, "")
        .replace(/\n?```$/, "")
        .trim()

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
```

- [ ] **Step 2: Type-check**

Run: `bun run type-check`
Expected: PASS (no type errors).

- [ ] **Step 3: Commit**

```bash
git add tomasa/scripts/fill-transcript-gaps.ts
git commit -m "feat(tomasa): add fillSegment Claude call with roster prompt"
```

---

### Task 4: `fillFile` + main entrypoint

**Files:**
- Modify: `tomasa/scripts/fill-transcript-gaps.ts`

**Interfaces:**
- Consumes: `flagSegments`, `buildContext`, `fillSegment`, `GapSegment`.
- Produces: `fillFile(inputPath: string, outputPath: string): Promise<void>`; `import.meta.main` entrypoint over the three-file allowlist.

- [ ] **Step 1: Add imports at top of file**

Edit the top of `tomasa/scripts/fill-transcript-gaps.ts`, immediately after the header doc comment, insert:

```ts
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs"
import { join } from "path"
```

- [ ] **Step 2: Add fillFile and main at end of file**

Append to `tomasa/scripts/fill-transcript-gaps.ts`:

```ts
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
    if (corrected !== target.text) {
      target.original_text = target.text
      target.text = corrected
      target.gap_filled = true
      filledCount++
    }
  }

  writeFileSync(outputPath, JSON.stringify({ ...raw, segments }, null, 2))
  console.log(`✓ ${filename}: ${filledCount} filled / ${flagged.length} flagged`)
}

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
```

- [ ] **Step 3: Verify tests still pass and types are clean**

Run: `bun test scripts/fill-transcript-gaps.test.ts && bun run type-check`
Expected: PASS — pure-helper tests green, no type errors.

- [ ] **Step 4: Commit**

```bash
git add tomasa/scripts/fill-transcript-gaps.ts
git commit -m "feat(tomasa): add fillFile + main for Nov-20 gap-fill (closes #5)"
```

---

### Task 5: Run against real data + verify output

**Files:** none (execution + manual verification).

`data/` is gitignored and lives in the primary checkout, not the worktree. Point the
script at the real data dir. Replace `<REPO>` with the primary checkout path
(`/Volumes/Verbatim-Vi560-Media/Development/aves/purpurit`).

- [ ] **Step 1: Run the script against real data**

Run (from `tomasa/`):
```bash
TOMASA_DATA_DIR=<REPO>/data bun scripts/fill-transcript-gaps.ts
```
Expected: three files processed; 0805 reports a small number flagged (≈9) and ≥0 filled; 1312 and 1336 report 0 flagged.

- [ ] **Step 2: Verify output files exist**

Run:
```bash
ls -la <REPO>/data/gap-filled-transcripts/
```
Expected: `tomasa_2025-11-20_0805.json`, `_1312.json`, `_1336.json` present.

- [ ] **Step 3: Spot-check fills carry audit fields**

Run:
```bash
python3 -c "import json; d=json.load(open('<REPO>/data/gap-filled-transcripts/tomasa_2025-11-20_0805.json')); f=[s for s in d['segments'] if s.get('gap_filled')]; print('filled:', len(f)); [print(s['id'], repr(s.get('original_text')), '->', repr(s['text'])) for s in f[:5]]"
```
Expected: each filled segment shows `gap_filled: true`, an `original_text`, and a different `text`. Confirm 1312/1336 have zero `gap_filled` segments.

- [ ] **Step 4: No data committed**

Run: `git status --short`
Expected: no `data/` files staged or shown (they are gitignored). Only the script/test/plan/spec are tracked.

---

## Self-Review Notes

- **Spec coverage:** flagging (Task 1), context window (Task 2), Claude fill w/ roster prompt (Task 3), merge+write+resume+allowlist+env-override (Task 4), verification incl. passthrough check for 1312/1336 (Task 5). All spec sections covered.
- **Types:** `RawSegment`/`LabeledSegment`/`GapSegment`/`Speaker` defined Task 1, reused consistently. `flagSegments` returns array indices (used as such in Task 4). `buildContext(segments, index, radius=3)` signature matches Task 4 call.
- **No placeholders:** every code step shows full code.
