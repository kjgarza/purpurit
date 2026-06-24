# Design: Speaker Labels for Tomasa Transcripts (Issue #4)

**Date:** 2026-06-24
**Issue:** https://github.com/kjgarza/purpurit/issues/4
**Status:** Approved

---

## Problem

Five processed transcript JSONs in `data/processed-transcripts/` have no speaker attribution. Three Nov-20 sessions don't exist as JSONs yet (only raw .m4a). Segments need a `speaker` field (`"Tomasa"` | `"Interviewer"`) inferred by Claude from text context.

Transcripts are too large to pass in full to an LLM context window — largest file has 526 segments. Raw segment JSON includes heavy metadata (`tokens[]`, `avg_logprob`, etc.) that inflates token count ~10×.

---

## Deliverables

### 1. Extend `tomasa/scripts/transcribe-with-timestamps.ts`

Add 3 Nov-20 audio sessions to the FILES array:

```
data/tomasa-Nov-20-at-08-05/Copy of Nov 20 at 08-05.m4a  → processed-transcripts/tomasa-nov20-0805.json
data/tomasa-Nov-20-at-13-12/Nov 20 at 13-12.m4a          → processed-transcripts/tomasa-nov20-1312.json
data/tomasa-Nov-20-at-13-36/Nov 20 at 13-36.m4a          → processed-transcripts/tomasa-nov20-1336.json
```

Same cache-first pattern: skip if output JSON already exists. Use `language: "es"`.

### 2. New `tomasa/scripts/add-speaker-labels.ts`

Reads all JSONs from `data/processed-transcripts/`, writes labeled copies to `data/labeled-transcripts/`.

---

## Architecture: `add-speaker-labels.ts`

### Token Reduction

Before any API call, strip each segment to `{id, text}` only. This removes:
- `tokens[]` (20–30 integers per segment)
- `seek`, `start`, `end`, `temperature`, `avg_logprob`, `compression_ratio`, `no_speech_prob`

Reduction: ~90% fewer tokens per segment.

### Chunking

- Chunk size: 60 segments
- Overlap: 10 segments on each side (preceding chunk's last 10 + next chunk's first 10 included in context)
- Purpose: preserves conversational context across boundaries; overlap resolves boundary ambiguity

Overlap deduplication rule: when two chunks return different labels for the same segment ID, the label from the chunk where the segment is in the **middle** (not the edge) wins.

### Concurrency

- All 5 files run via `Promise.all` (concurrent)
- Each file's chunks run serially (preserves dialogue ordering within a file)
- No rate-limit throttling needed at this scale (~45 API calls total)

### Claude API

- Model: `claude-haiku-4-5-20251001`
- System prompt: two-speaker context + linguistic signal rules (see below)
- User message: JSON array of `{id, text}` for the current chunk
- Response format: JSON array `{id: number, speaker: "Tomasa" | "Interviewer"}[]`
- Retries: 2 retries with exponential backoff (1s, 2s) on failure or malformed JSON

### Speaker Inference Signals (system prompt content)

```
Two speakers: Tomasa (grandmother, ~90 years old) and Interviewer (her grandson).

Signals that indicate the speaker:
- "usted" form address → Interviewer is talking TO Tomasa (so previous segment = Interviewer)
- "mijo" / "mi hijo" → Tomasa speaking
- Long narrative about childhood, family, the past → Tomasa
- Short questions about her life, prompts → Interviewer
- "¿Cómo la ves?" (rhetorical) → Tomasa
- "Oiga" (formal address) → Interviewer to Tomasa
- German text → Tomasa singing/reciting (label as Tomasa)
```

### Output Schema

Each segment in the output JSON gets a `speaker` field added:

```json
{
  "id": 0,
  "seek": 0,
  "start": 0,
  "end": 15,
  "text": " Ya tengo luz, aquí estamos.",
  "speaker": "Tomasa",
  "tokens": [...],
  ...
}
```

All other fields from the original segment are preserved unchanged.

### Error Handling

| Failure | Handling |
|---|---|
| Claude returns malformed JSON | Retry chunk up to 2×; on continued failure, mark all segments in chunk as `"unknown"` |
| Segment missing from Claude response | Fill with `"unknown"` |
| Overlap conflict | Mid-chunk label wins |
| File already labeled | Skip (detect `speaker` field on first segment) |
| HTTP 429 rate limit | Exponential backoff: 1s → 2s → 4s |

### Output Validation

Before writing each output file:
- Assert every segment has a `speaker` field
- Assert segment count matches input
- Print summary line: `sunday-17-04: 443 segs → 287 Tomasa / 156 Interviewer / 0 unknown`

### Output Location

`data/labeled-transcripts/<original-filename>.json`

Originals in `data/processed-transcripts/` are never modified.

---

## Estimated Cost

- ~526 segments (largest file) / 60 chunk ≈ 9 chunks
- 5 files × ~9 chunks × ~1K input tokens = ~45K tokens
- Haiku pricing: ~$0.02 total

---

## Non-Goals

- No test file (one-shot data transformation; manual review of output is sufficient)
- No streaming output
- No partial resume (if a file fails mid-way, re-run from scratch — cost is trivial)
