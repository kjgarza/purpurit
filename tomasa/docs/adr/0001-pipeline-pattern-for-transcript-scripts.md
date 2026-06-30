# ADR 0001 — Pipeline Pattern for Transcript Scripts

- Status: Proposed
- Date: 2026-06-30
- Deciders: Kristian Garza
- Scope: `tomasa/scripts/`

## Context

The scripts in `tomasa/scripts/` form an ad-hoc data pipeline that turns raw
audio recordings into validated memorial content. Today they run as independent
one-off Bun scripts with no shared contract.

The actual data flow is:

```
.m4a recordings
   │  transcribe-with-timestamps.ts   (Whisper API)
   ▼
data/processed-transcripts/*.json
   │  add-speaker-labels.ts           (Claude, chunked)
   ▼
data/labeled-transcripts/*.json
   │  normalize-filenames.ts          (rename all locations → tomasa_YYYY-MM-DD_HHMM)
   ▼
canonical-named transcripts
   │  (manual authoring of decades.ts)
   ▼
apps/tomasa/src/content/decades.ts
   │  validate-content.ts             (score content / audio / media)
   ▼
pass/fail score
```

Plus two read-only **query utilities** that are not pipeline stages:
`find-quote-timestamps.ts` and `search-segments.ts`.

### Problems with the current shape

1. **Duplicated state.** The list of recordings and their IDs is hardcoded in
   at least three places — `FILES` in `transcribe-with-timestamps.ts`,
   `RECORDINGS` in `normalize-filenames.ts`, and the inline ID arrays in
   `find-quote-timestamps.ts` / `search-segments.ts`. Adding a recording means
   editing several files and keeping them in sync by hand.
2. **Duplicated path resolution.** `DATA_DIR`, `CACHE_DIR`, `processed-transcripts`,
   and `labeled-transcripts` paths are recomputed in every script, sometimes with
   subtly different relative roots (`../data` vs `../../data`).
3. **No stage contract.** Each script invents its own input/output handling,
   logging, and error reporting. Resume/idempotency is implemented twice
   (transcribe checks cache, label checks output) with copy-pasted logic.
4. **No orchestration.** There is no single entry point to run the pipeline end
   to end; the run order lives only in people's heads and commit messages.
5. **Mixed concerns.** Transform stages and interactive query tools sit in the
   same directory with no distinction.

## Decision

Adopt an explicit **pipeline pattern**: a sequence of typed **stages**, each a
pure-ish unit with a declared input, output, and idempotency rule, driven by a
small shared core and one orchestrator.

### 1. Single source of truth for recordings

Introduce `scripts/lib/manifest.ts` exporting the canonical recording list
(canonical name, source path, dates, provenance notes). All stages and query
tools read from it instead of holding private copies.

### 2. Shared core (`scripts/lib/`)

- `paths.ts` — one place that resolves `DATA_DIR`, `PROCESSED_DIR`,
  `LABELED_DIR`, `MEDIA_DIR`, `CONTENT_DIR`.
- `types.ts` — shared `RawSegment` / `LabeledSegment` / `Transcript` types
  (currently only exported from `add-speaker-labels.ts`).
- `stage.ts` — a minimal `Stage` contract:

  ```ts
  interface Stage<In, Out> {
    name: string
    /** True when output already exists for this item — skip to resume. */
    isDone(item: In): boolean
    run(item: In): Promise<Out>
  }
  ```

  The core provides a runner that handles logging, the `isDone` skip, retries,
  and per-item error isolation once, so stages stop re-implementing them.

### 3. Stages

Refactor the three transform scripts into stages behind the contract, keeping
their existing logic:

- `transcribe` — manifest item → `processed-transcripts/<canon>.json`
- `label` — `processed-transcripts/*` → `labeled-transcripts/*`
- `normalize` — rename across all locations (stays dry-run by default)

`validate-content.ts` stays a terminal **gate** (emits a score, non-stage) and
`find-quote-timestamps.ts` / `search-segments.ts` move to `scripts/query/` to
mark them as out-of-pipeline utilities.

### 4. Orchestrator

`scripts/pipeline.ts` runs stages in order over the manifest, honouring
`isDone` so the whole thing is resumable, with a `--only <stage>` flag for
running a single stage.

## Consequences

### Positive

- Adding a recording = one manifest entry; every stage and query picks it up.
- Idempotency/resume, path resolution, and logging live in one place.
- The run order is encoded in `pipeline.ts`, not tribal knowledge.
- Clear separation: stages transform, gates score, query tools inspect.
- Existing per-stage logic (Whisper call, chunked Claude labeling, rename
  collision checks) is preserved — this is a re-organization, not a rewrite.

### Negative / costs

- Upfront refactor of working scripts; risk of regressions in code that
  currently does its job.
- A thin abstraction layer (`Stage`, runner) adds indirection for what is still
  a small script set — mild over-engineering risk for a personal project.
- The stages are heterogeneous (one calls an HTTP API, one shells out to
  `claude`, one renames files), so the shared contract must stay minimal or it
  will leak.

### Neutral

- No change to the on-disk data layout or output formats.
- `normalize` keeps its dry-run-by-default safety.

## Alternatives considered

- **Leave as independent scripts.** Lowest effort, but the duplication and
  sync-by-hand problems persist and grow with each new recording.
- **Adopt a full pipeline framework** (e.g. a task runner / DAG tool). Too heavy
  for a handful of Bun scripts; adds a dependency and learning cost out of
  proportion to the problem.
- **Makefile/justfile orchestration only** (no shared core). Solves run-order
  but not the duplicated manifest, paths, or resume logic — the larger pains.
