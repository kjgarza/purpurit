# Approach Document: Content Generation from Data

**Date:** April 6, 2026  
**Project:** Tomasa Interactive Memorial  
**Related:** DOD.md

---

## Overview

This document outlines the **technical approach** for transforming the Tomasa memorial from placeholder content to real stories generated from interview transcripts, photos, and drawings in the `data/` directory.

---

## Phase 1: Data Analysis & Preparation

### 1.1 Transcript Processing

**Source audio files available:**
- `data/Tommy Sunday-5-PM/Tommy - Sunday at 17-04.m4a`
- `data/Tommy Wednesday-5-57/Tommy - Wednesday at 17-57.m4a`
- `data/tommy-01-Sunday/Sunday-at-21-32.m4a`
- `data/Tommy-02-Sunday-at-2208/Sunday-at-22-08.m4a`
- `data/tomasa-Nov-20-at-08-05/Copy of Nov 20 at 08-05.m4a`
- `data/tomasa-Nov-20-at-13-12/Nov 20 at 13-12.m4a`
- `data/tomasa-Nov-20-at-13-36/Nov 20 at 13-36.m4a`
- `data/Shimmer-tts.mp3` (likely TTS, not interview)

**Existing transcript files:**
- `data/Tommy Sunday-5-PM/whisper-transcript-sunday.txt`
- `data/Tommy Wednesday-5-57/whisper-transcript-wednesday.txt`
- `data/tommy-01-Sunday/whispert-transcript-sunday-21.txt`
- `data/Tommy-02-Sunday-at-2208/whisper-transcript-sunday-22.txt`

**Quality Assessment:**
- Existing transcripts may have errors or poor quality
- Spanish speaker transcription can be challenging
- **Recommendation:** Re-transcribe all audio using OpenAI Whisper API with `language='es'`
- Source audio available in .m4a format (compatible with Whisper API)

**Tasks:**
1. **Evaluate transcript quality** — Read existing files, assess accuracy
   - Check if transcript already appears to be Whisper-generated (good quality)
   - Look for indicators: proper punctuation, accurate Spanish, minimal errors
2. **Selective re-transcription** — Only re-transcribe poor quality files:
   ```typescript
   // Workflow for each audio file
   const audioFile = "data/Tommy Sunday-5-PM/Tommy - Sunday at 17-04.m4a"
   const existingTranscript = "data/Tommy Sunday-5-PM/whisper-transcript-sunday.txt"
   const outputPath = "data/processed-transcripts/sunday-17-04.json"
   
   if (existingTranscriptIsGoodQuality(existingTranscript)) {
     // Copy existing transcript to processed folder
     await copyTranscript(existingTranscript, outputPath)
   } else {
     // Re-transcribe with OpenAI Whisper API
     const transcription = await openai.audio.transcriptions.create({
       file: fs.createReadStream(audioFile),
       model: "whisper-1",
       language: "es",  // Spanish
       response_format: "verbose_json",  // Get timestamps
       timestamp_granularities: ["segment"]
     })
     await saveTranscript(transcription, outputPath)
   }
   ```
3. **Cache all transcripts** — Store in `data/processed-transcripts/` (both copied and new)
4. **Extract timeline markers** — Identify decade/year mentions in Spanish:
   - "en los años 50" → 1950s
   - "cuando tenía 15 años" (born ~1935) → 1950s
   - "hace como 50 años" → calculate backwards from interview date
5. **Segment by topic** — Split transcripts into logical story chunks:
   - Childhood memories (1930s-1940s)
   - Marriage and family (1950s-1960s)
   - Working years (1970s-1990s)
   - Later life (2000s-2010s)
6. **Identify key quotes** — Mark memorable/emotional passages for audio clips

**Output:**
```typescript
interface TranscriptSegment {
  id: string
  decade: string  // "1950s", "1960s", etc.
  text: string
  speaker: "Tomasa" | "Interviewer"
  timestamp?: string
  topic: string  // "infancia", "familia", "trabajo", etc.
  emotion?: "joy" | "sadness" | "reflection"
  audioCandidate: boolean  // true if good for audio clip
}
```

### 1.2 Media Verification (ALREADY COMPLETE)

**Current state:** 71 media files already processed and organized in `apps/tomasa/public/media/`

**Directory structure:**
```
public/media/
├── 1930s/  # cover.webp + drawings
├── 1940s/  # cover.webp + drawings
├── 1950s/  # cover.webp, photo1.webp, photo2.webp, drawing-13 to -18
├── 1960s/  # media files
├── 1970s/  # media files
├── 1980s/  # media files
├── 1990s/  # media files
├── 2000s/  # media files
└── 2010s/  # media files
```

**Tasks:**
1. ✓ **Photos already optimized** — WebP format, appropriate sizes
2. ✓ **Drawings already distributed** — Organized by decade
3. **Verify references** — Ensure `decades.ts` correctly references existing files
4. **Update alt text** — Improve descriptions in content data if needed

**NO NEW IMAGE PROCESSING REQUIRED** — Focus on transcript content and audio extraction

---

## Phase 2: Content Generation Pipeline

### 2.1 Build-Time Generation Script

**Location:** `tomasa/scripts/generate-content.ts`

**Responsibilities:**
1. Read all source data from `data/` directory (read-only, never modify originals)
2. Parse transcripts and extract segments organized by decade
3. Verify existing media references in `public/media/`
4. Generate `src/content/decades.ts` with real transcript quotes
5. Extract and process audio clips to `public/media/{decade}/*.mp3`

**Key principle:** Data/format separation
- Content data lives in `src/content/` (TypeScript files with typed exports)
- Components in `src/components/` consume but never hardcode content
- All paths use basePath helper for GitHub Pages static export

**Execution:** Runs during build process

```json
// package.json
{
  "scripts": {
    "prebuild": "bun scripts/generate-content.ts",
    "build": "next build",
    "generate": "bun scripts/generate-content.ts",
    "validate": "bun scripts/validate-content.ts"
  }
}
```

**Critical:** Use Bun runtime, not Node.js or tsx. All scripts must be TypeScript files run with `bun`.

### 2.2 Content Validation Script

**Location:** `tomasa/scripts/validate-content.ts`

**Checks:**
- [ ] All media files referenced in `decades.ts` exist in `public/media/`
- [ ] No placeholder text patterns detected
- [ ] All slides have required fields (id, type, etc.)
- [ ] Audio files are < 2MB
- [ ] Images are optimized (WebP format, appropriate sizes)
- [ ] Content score calculation (real vs. placeholder ratio)

**Exit code:** 0 if validation passes, 1 if failures

### 2.3 Decade Generation Logic

**Algorithm:**

```typescript
function generateDecadeContent(decade: string): Decade {
  // 1. Get transcript segments for this decade
  const segments = getSegmentsByDecade(decade)
  
  // 2. Get photos for this decade
  const photos = getPhotosByDecade(decade)
  
  // 3. Get artwork for this decade (distribute evenly)
  const artwork = getArtworkForDecade(decade)
  
  // 4. Create slides array
  const slides: Slide[] = []
  
  // 5. Add decade title slide
  slides.push(createTitleSlide(decade))
  
  // 6. Interleave content types
  // Pattern: narrative → photo → narrative → artwork → audio
  for (const segment of segments) {
    // Narrative slide from transcript
    slides.push({
      type: "narrative",
      text: segment.text,
      attribution: `Tomasa, ${segment.topic}`
    })
    
    // Add photo if available
    if (photos.length > 0) {
      const photo = photos.shift()
      slides.push({
        type: "photo",
        imageSrc: photo.path,
        imageAlt: photo.alt,
        caption: `Tomasa en ${photo.year}`
      })
    }
    
    // Add artwork periodically
    if (artwork.length > 0 && Math.random() > 0.5) {
      const art = artwork.shift()
      slides.push({
        type: "artwork",
        imageSrc: art.path,
        imageAlt: art.alt,
        caption: art.subject || "Dibujo de Tomasa"
      })
    }
    
    // Add audio clip if segment is marked as candidate
    if (segment.audioCandidate) {
      slides.push({
        type: "audio",
        text: segment.text,
        audioSrc: `${decade}/${segment.id}.mp3`,
        attribution: `Tomasa, ${formatDate(segment.timestamp)}`
      })
    }
  }
  
  return {
    id: decade,
    label: `Los años ${decade.slice(2, 4)}`,
    year: parseInt(decade.slice(0, 4)),
    coverImage: photos[0]?.path || artwork[0]?.path,
    slides
  }
}
```

---

## Phase 3: Audio Processing

### 3.1 Audio Clip Extraction

**Source files:** 7 interview recordings in .m4a format (see Section 1.1)

**Tools needed:**
- `ffmpeg` — for audio segmentation and format conversion (convert .m4a to .mp3)

**Process:**
1. **Convert format** — .m4a to .mp3 (if not already done during Whisper processing)
2. **Extract segments** — Use Whisper's timestamp data to extract specific quotes
3. **Optimize format** — Convert to MP3 @ 128kbps for inline clips, 96kbps for ambient
4. **Normalize volume** — Consistent playback levels across all clips
5. **Add fade in/out** — Prevent abrupt starts/stops (0.5s fades)

**Command template:**
```bash
# Convert m4a to mp3
ffmpeg -i input.m4a -b:a 128k output.mp3

# Extract clip with timestamps + fades
ffmpeg -i interview.m4a -ss 00:12:30 -t 15 \
  -af "afade=t=in:ss=0:d=0.5,afade=t=out:st=14.5:d=0.5" \
  -b:a 128k output-clip.mp3
```

### 3.2 Audio Types

**Inline clips (with play button):**
- Duration: 5-30 seconds
- Focus: Single quote or short story
- Quality: High (128kbps MP3)
- Usage: User-initiated playback

**Ambient narration (background):**
- Duration: 1-3 minutes
- Focus: General decade narrative
- Quality: Medium (96kbps MP3)
- Usage: Auto-play (if user consents), loop, soft volume

### 3.3 Audio Component Updates

**Required changes (minimal):**
- Extend `audio-slide.tsx` to handle inline play button
- Update `use-ambient-audio.ts` to load decade-specific tracks
- Ensure mobile compatibility (respect silent mode)

---

## Phase 4: Implementation Strategy

### 4.1 Iteration Plan

**Iteration 1: Foundation** (Experiments 1-5)
- Assess existing transcript quality (identify which are already good Whisper transcripts)
- Copy good transcripts to `data/processed-transcripts/`
- Re-transcribe only poor quality files with Whisper API (cache results)
- Build transcript parser (Spanish text processing)
- Parse timeline markers from transcripts
- Generate basic content structure in `decades.ts`
- Validate TypeScript types with `bun run type-check`

**Iteration 2: Content Quality** (Experiments 6-10)
- Improve transcript segmentation (topic-based)
- Refine decade matching logic (timeline inference)
- Replace placeholder text with real quotes
- Validate authentic voice (Spanish intact)

**Iteration 3: Media Verification** (Experiments 11-13)
- Verify all media references in `decades.ts` point to existing files
- Update alt text and captions
- Ensure basePath helper used correctly for GitHub Pages

**Iteration 4: Audio Integration** (Experiments 14-20)
- Extract and process audio clips with ffmpeg
- Implement inline audio player functionality
- Add ambient narration per decade
- Final validation with `bun scripts/validate-content.ts`

### 4.2 Git Workflow

**Branch:** `autoresearch/tomasa-content-generation`

**Commit pattern:**
```
experiment 1: parse transcript files into segments
experiment 2: map photos to decades by year
experiment 3: generate decades.ts from real data
...
```

**Revert policy:**
- Measure content_score after each experiment
- Keep only if score improves or maintains (no regression)
- Revert if build fails or score drops

### 4.3 Testing Strategy

**Unit tests:**
- Transcript parser correctness
- Photo metadata extraction
- Content validation logic

**Integration tests:**
- Full build succeeds
- All media files accessible
- TypeScript compilation passes

**Manual validation:**
- Content authenticity (spot-check quotes against transcripts)
- Media quality (images render correctly)
- Audio playback (clips are audible and clear)

---

## Phase 5: Tools & Dependencies

### 5.1 Required Packages

```json
{
  "devDependencies": {
    "glob": "^10.0.0",         // File pattern matching
    "zod": "^3.22.0",          // Schema validation (already in @repo/utils)
    "openai": "^4.0.0"         // OpenAI API (for Whisper transcription if needed)
  }
}
```

**Environment Variables:**
```bash
# .env.local (not committed)
OPENAI_API_KEY=sk-...
```

**Notes:**
- Bun has built-in TypeScript support (no tsx needed)
- No image processing needed (sharp not required)
- Zod already available via `@repo/utils`
- OpenAI Whisper API optional (only if transcript quality insufficient)

### 5.2 External Tools

- **ffmpeg** — Audio processing (install via Homebrew on macOS)
- **git** — Version control for experiment tracking

---

## Success Metrics Tracking

### results.tsv Example

```tsv
experiment	commit	content_score	audio_integration	media_integration	status	description
0	baseline	0	0	0	baseline	Initial placeholder content
1	abc123	25	0	0	keep	Parsed transcripts, generated 2 decades
2	def456	35	0	15	keep	Added photo integration for 1950s-1970s
3	ghi789	30	0	15	discard	Changed segmentation logic, score regressed
4	jkl012	40	20	20	keep	Audio clips for 1950s and 1960s
...
```

### Dashboard (optional)

Create a simple HTML report showing:
- Current content score vs. target
- Decades completed vs. remaining
- Media integration progress
- Audio coverage

---

## Rollback & Safety

### Data Protection
- **Never modify** original data files in `data/` directory
- All processing creates new files in `public/media/`
- Git-tracked source data remains clean

### Experiment Safety
- Each experiment is a discrete git commit
- Failed experiments are reverted immediately
- `results.tsv` tracks all attempts
- Can reconstruct any previous state

### Build Failures
If build breaks:
1. Revert last commit: `git reset --hard HEAD~1`
2. Check validation output for specific errors
3. Fix issue
4. Re-run experiment (amend commit if quick fix)

---

## Open Questions & Decisions Needed

1. **Transcript quality** — Existing transcripts may need improvement
   - ✓ Source audio files confirmed available (7 .m4a files)
   - **Strategy:** Check each transcript first before re-transcribing
   - If transcript already good quality (Whisper-generated): Copy to `data/processed-transcripts/`
   - If poor quality: Re-transcribe with OpenAI Whisper API (`language='es'`)
   - Whisper returns timestamps → use for audio clip extraction
   - Don't call API unnecessarily (saves cost and time)

2. **Decade boundaries** — Some stories span multiple decades
   - Option A: Duplicate content across decades
   - Option B: Choose primary decade based on first mention
   - Recommendation: Primary decade, note in attribution

3. **Placeholder text** — Current `decades.ts` has generic stories
   - Must be replaced with real quotes from transcripts
   - Keep Spanish language intact (no translation)
   - Maintain attribution to specific interviews

4. **Additional audio sources** — More recordings may exist
   - 3-4 additional Nov 20 recordings found
   - Check if these are interviews or other content
   - Integrate if suitable for memorial experience

---

## Next Steps

1. **User review** — Confirm approach aligns with vision
2. **Setup autoresearch** — Initialize working branch and baseline
3. **Data audit** — Verify all source files are accessible
4. **Assess transcripts** — Check quality, decide if Whisper API needed
5. **Run first experiment** — Transcript processing (improve if needed)
6. **Iterate** — Follow experiment loop until DOD criteria met

---

## References

- Definition of Done: `DOD.md`
- Product Spec: `new-spec.md`
- Content Source: `../data/` directory
- Autoresearch Skill: `~/.agents/skills/autoresearch/SKILL.md`
