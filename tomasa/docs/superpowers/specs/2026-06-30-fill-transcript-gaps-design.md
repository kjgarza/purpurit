# Fill Transcript Gaps in Tomasa Sessions Using AI

**Issue:** [#5](https://github.com/kjgarza/purpurit/issues/5) — depends on #3 (re-transcription, closed) and #4 (speaker labels; labeled files already on disk).
**Date:** 2026-06-30

## Goal

Use Claude to repair low-confidence / inaudible segments in the three labeled Tomasa
Nov-20 transcripts, inferring correct text from surrounding context and a known roster
of family/place names. Output is non-destructive and auditable.

## Context

`data/labeled-transcripts/*.json` segments (from `add-speaker-labels.ts`) carry Whisper
confidence metrics plus a `speaker` label. Measured stats for the three Nov-20 files:

| File | segments | `avg_logprob < -0.5` | `no_speech_prob > 0.6` | `compression_ratio > 2.4` |
|------|---------:|---------------------:|-----------------------:|--------------------------:|
| tomasa_2025-11-20_0805 | 181 | 9 | 9 | 0 |
| tomasa_2025-11-20_1312 | 571 | 0 | 0 | 0 |
| tomasa_2025-11-20_1336 | 156 | 0 | 0 | 0 |

These are high-quality transcripts. Gap-fill is conservative: it touches only a handful
of segments, all in the 0805 file. The script must do nothing when no segment is flagged.

## Decisions

- **Output:** new `data/gap-filled-transcripts/<file>.json` (non-destructive; labeled files untouched).
- **Model:** `sonnet` (stronger Spanish/dialect reasoning than the haiku used for labeling; segment count is tiny so cost is negligible).
- **Scope:** the three Nov-20 files only, via a hardcoded allowlist (not a whole-dir scan).
- **Auditability:** filled segments keep `original_text`; replacement goes in `text`; add `gap_filled: true`.
- **Data location:** `data/` is gitignored and lives only in the primary checkout. The script
  resolves its data dir from `TOMASA_DATA_DIR` env var, falling back to the repo-relative
  `tomasa/../data`. This lets it run from a git worktree against the real data dir.

## Architecture

Mirrors `scripts/add-speaker-labels.ts`: pure exported helpers + a `claude -p` subprocess
call, with the helpers unit-tested and the subprocess left to integration.

### Types

```ts
interface GapSegment extends LabeledSegment {
  gap_filled?: boolean
  original_text?: string
}
```

(`LabeledSegment` = `RawSegment` + `speaker`, reused conceptually from the labeling script.)

### 1. `flagSegments(segments): number[]` — pure

Returns indices of segments needing repair. A segment is flagged if **any** holds:

- `avg_logprob < -0.5`
- `no_speech_prob > 0.6`
- `compression_ratio > 2.4`
- `text` matches `/\[inaudible\]/i`

Thresholds are module constants so they're easy to tune.

### 2. `buildContext(segments, index, radius = 3): string` — pure

Builds the context block passed to Claude: the `radius` segments before and after `index`,
each rendered as `"<speaker>: <text>"`, with the target segment marked. Clamps at array
bounds. Returns a plain string.

### 3. `fillSegment(target, contextBlock, retries = 2): Promise<string>`

One `claude -p --model sonnet <prompt>` subprocess (same spawn/retry/backoff pattern as
`labelChunk`). Prompt = system roster + context + instruction to return only the corrected
segment text. Strips markdown fences. On exhausted retries, returns the original text
unchanged (fail-safe: never lose content).

System prompt includes the issue's roster verbatim:

- Speakers: Tomasa (grandmother, ~88, from Chihuahua) and her grandson interviewer.
- Family: Epifanio (father), Francisca (mother), siblings Evaristo/Paulina/Estefana/Lala,
  husband Toño, children Miguel/Antonio/Arnulfo/Jesús/Tere, Marta,
  grandchildren Kristian/Ericka/Alan/Aby.
- Places: Rancho Los Olices, El Oro (mine), Parral, Santa Bárbara, Chihuahua,
  Estación Guichivo/Bahuichivo, Monterrey, Juárez.
- Chihuahua shesheo hints (use sparingly): muchacho→mushasho, chile→shile, ocho→osho,
  escúchame→escúshame.
- Instruction: fill `[INAUDIBLE]` / fix mishearings from context; return ONLY corrected
  segment text, no commentary, no fences.

### 4. `fillFile(inputPath, outputPath): Promise<void>`

1. Skip-if-exists resume guard (matches labeling script).
2. Read labeled JSON, flag segments.
3. If none flagged, still write the output (passthrough copy) so the file exists and runs
   are idempotent; log "0 gaps".
4. For each flagged index: build context, call `fillSegment`, and if the result differs
   from the original, set `text` = corrected, `original_text` = old, `gap_filled = true`.
   If unchanged, leave the segment untouched (no `gap_filled` flag).
5. Write `{ ...raw, segments }` to `outputPath`; log filled/flagged counts.

### Main

```
DATA_DIR  = process.env.TOMASA_DATA_DIR ?? join(import.meta.dir, "..", "..", "data")
INPUT_DIR = DATA_DIR/labeled-transcripts
OUTPUT_DIR= DATA_DIR/gap-filled-transcripts   (mkdir -p)
FILES     = ["tomasa_2025-11-20_0805", "1312", "1336"].json   // hardcoded allowlist
```

Process the three files (sequential is fine — few segments). Print a summary.

## Testing

`scripts/fill-transcript-gaps.test.ts` (bun test), pure helpers only:

- `flagSegments`: one case per threshold (low logprob, high no_speech, high compression,
  literal `[inaudible]`), a clean segment that is **not** flagged, and a segment tripping
  multiple thresholds counted once.
- `buildContext`: window contents + clamping at array start/end + target marking.

The `claude` subprocess is not unit-tested, consistent with `add-speaker-labels.ts`.

## Out of scope

- Re-running labeling or transcription.
- The other four (Oct) sessions.
- Wiring gap-filled transcripts into the Next.js app content.
- Human review UI for accepting/rejecting fills.

## Verification

- `bun test scripts/fill-transcript-gaps.test.ts` passes.
- `bun run type-check` clean.
- `TOMASA_DATA_DIR=<real>/data bun scripts/fill-transcript-gaps.ts` produces three files in
  `gap-filled-transcripts/`; spot-check the 0805 fills carry `original_text` + `gap_filled`,
  and the 1312/1336 outputs are passthrough copies with zero `gap_filled` segments.
