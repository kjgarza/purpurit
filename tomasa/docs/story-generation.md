# Story Generation Workflow

How a labeled transcript becomes a narrative story draft, repeatably. This
codifies the manual process used for the moon-landing draft (issue #10) so the
remaining stories follow the same path.

## Where this sits in the pipeline

```
data/labeled-transcripts/*.json        (transcribe-with-timestamps.ts + add-speaker-labels.ts)
   │  generate-story.ts                (beat selection + Claude draft)
   ▼
apps/tomasa/src/content/drafts/<story>.md   (status: draft-v1)
   │  human voice-check                (MANDATORY — see below)
   ▼
apps/tomasa/src/content/decades.ts     (manual integration as slides)
   │  validate-content.ts
   ▼
pass/fail score
```

## Generating a draft

Run these commands from the `tomasa/` subdirectory (e.g. `cd tomasa &&`).

Two ways to select beats:

**Explicit segment range** — when you already know where the story lives
(segment ids in the labeled transcript JSON):

```bash
bun scripts/generate-story.ts \
  --transcript tomasa_2025-11-16_1704:395-428 \
  --story moon-landing --title "La llegada a la luna" --decade 1960s
```

**Theme** — when the beats are scattered or unlocated; Claude scans the
transcript(s) and selects matching passages:

```bash
bun scripts/generate-story.ts \
  --transcript tomasa_2025-11-16_1704 --transcript tomasa_2025-11-20_0805 \
  --theme "infancia pobre en el rancho en los años 30" \
  --story poor-child --title "Una niña pobre" --decade 1930s
```

Multiple `--transcript` flags are allowed; each may carry its own
`:<start>-<end>` range. Rangeless transcripts require `--theme`. Existing
drafts are never overwritten without `--force`. `TOMASA_DATA_DIR` overrides
the data directory (needed when running from a git worktree).

## Output shape

`apps/tomasa/src/content/drafts/<story>.md` with frontmatter citing exactly
where the draft came from:

```yaml
---
story: poor-child
title: "Una niña pobre"
decade: 1930s
status: draft-v1
generated: 2026-07-01
sources:
  - transcript: tomasa_2025-11-16_1704
    segments: "395-428"
emotional-spine: "Éramos tan felices que no sentíamos nada — dignidad en la pobreza"
open-questions:
  - "¿Qué edad tenía cuando volvieron al rancho El Oro?"
voice-check: pending
---
```

The body is the narrative draft: Spanish, first person, Tomasa's voice, built
only from the cited beats. The drafting prompt forbids inventing events,
names, places, dates, or feelings not present in the transcript.

## Voice-check (required before decades.ts integration)

A draft with `status: draft-v1` is **not publishable**. Before any content
from it enters `decades.ts`:

1. **Read the draft aloud with a Spanish speaker** — ideally a family member
   who knew Tomasa's speech (Chihuahua register, shesheo). Listen for words or
   constructions she would never use.
2. **Check the emotional spine.** Does the `emotional-spine` line in the
   frontmatter ring true to the person who was in the room for the interview?
3. **Resolve every `open-questions` entry** with family before publication —
   they mark facts the model found unclear or missing in the beats.
4. **Spot-check against the source.** Use the `sources` citation to reread the
   segments in `data/labeled-transcripts/` and confirm key phrases are hers.
5. When it passes, set `voice-check: done` and `status: voice-checked` in the
   frontmatter, then adapt the draft into `decades.ts` slides by hand
   (data/format separation still applies — the draft file is source material,
   not app content).

## Remaining stories

| Story | Decade | Status |
| --- | --- | --- |
| Moon landing | 1960s | draft-v1 (hand-written worked example) |
| Poor child | 1930s | pending |
| River accident | TBD | pending |
| Moving to Chihuahua | 1940s | pending |
| 5th story | TBD | pending |
