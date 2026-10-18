# Definition of Done: Tomasa Content Generation from Data

**Date:** April 6, 2026  
**Project:** Tomasa Interactive Memorial  
**Task:** Generate stories and content from data/ directory with audio snippets

---

## Autoresearch Parameters

### 1. Goal

Transform the Tomasa memorial experience from placeholder content to **real stories generated from the data/ directory**, including:
- Interview transcripts (Spanish audio interviews)
- Historical photographs (1951-2013, organized by year)
- Tomasa's original drawings (51+ artwork images)
- Audio snippets extracted from interview recordings

### 2. Success Metric

**Metric Command:**
```bash
bun run test:content && bun run build && bun scripts/validate-content.ts
```

**Metric Extraction:**
- Count of slides using real transcript data vs. placeholder text
- Percentage of decades with audio clips from actual interviews
- Number of photos/drawings successfully integrated from data/ directory
- Build success (no TypeScript errors)

**Metric Formula:**
```
content_score = (real_slides / total_slides) * 100
audio_integration = (decades_with_audio / total_decades) * 100
media_integration = (integrated_media / available_media) * 100

overall_score = (content_score * 0.5) + (audio_integration * 0.3) + (media_integration * 0.2)
```

**Direction:** Higher is better (target: 100% complete integration)

### 3. In-Scope Files

**Allowed to modify:**
- `tomasa/apps/tomasa/src/content/decades.ts` — story content generation (PRIMARY FOCUS)
- `tomasa/apps/tomasa/src/content/*.ts` — new content modules
- `tomasa/apps/tomasa/src/lib/*` — content processing utilities
- `tomasa/scripts/*` — build scripts, content generators (TypeScript only, use Bun runtime)
- `tomasa/apps/tomasa/public/media/{decade}/*.mp3` — audio files only (images already in place)
- `tomasa/package.json` — add generation dependencies if needed (use Bun)

**Out of scope (DO NOT MODIFY):**
- Core UI components (`src/components/*`) unless necessary for new content types
- Configuration files (`next.config.js`, `tsconfig.json`) unless required for build
- The source data files in `data/` directory (read-only)

### 4. Content Requirements

#### 4.1 Story Generation
- **Extract real quotes** from Spanish interview transcripts in `data/Tommy*/whisper-transcript-*.txt`
  - **Note:** Some existing transcripts may already be good quality Whisper output
  - **Strategy:** Assess quality first, only re-transcribe poor ones
  - Copy good transcripts to `data/processed-transcripts/` for consistency
  - Re-transcribe poor quality files with OpenAI Whisper API
- **Maintain authentic voice** — use Tomasa's actual words, not AI-generated placeholder text
- **Organize chronologically** by decade (1930s-2010s) based on timeline mentions in interviews
- **Preserve Spanish language** — all content must remain in Spanish as spoken

#### 4.2 Media Integration (ALREADY COMPLETE)
- **Photos & Drawings:** ✓ 71 media files already processed and organized in `apps/tomasa/public/media/{decade}/`
  - All decades have cover images, photos, and drawings as WebP files
  - No additional image processing needed
- **Audio clips:** Extract segments from interview recordings (PRIMARY FOCUS)
  - Generate audio snippets for key quotes from `data/Tommy*/` transcripts
  - Create ambient background narration for decade chapters
  - Support audio types: narrative quotes, stories, songs/canción de cuna
  - Place in `apps/tomasa/public/media/{decade}/*.mp3`

#### 4.3 Audio Implementation
Two audio modes required:
- **Inline clips:** Play-button audio for specific quotes (3-30 seconds)
- **Ambient narration:** Soft background audio per decade chapter (optional, can be disabled)

### 5. Constraints

- **No breaking changes** to existing UI components
- **Preserve mobile-first** responsive design
- **Maintain Spanish language** throughout (no translation)
- **Accessibility:** All media must have alt text/captions
- **Performance:** Lazy-load media, optimize images before integration
- **File size:** Max 500KB per photo, max 2MB per audio clip
- **Build time:** Content generation should complete in < 2 minutes
- **Type safety:** All generated content must pass TypeScript checks with `bun run type-check`
- **Static export:** Must work with GitHub Pages deployment (basePath helper for images)
- **Bun runtime:** Use Bun commands, not npm/node/tsx
- **API usage:** OpenAI Whisper API allowed for transcript improvement (if existing quality insufficient)
  - Use for Spanish speaker transcription with high accuracy
  - Store improved transcripts locally (don't call API on every build)
  - Set OPENAI_API_KEY as environment variable

### 6. Max Experiments

**10 experiments** — this is sufficient to:
- Build transcript parsing pipeline
- Integrate photo/drawing media
- Generate audio snippets for 3-5 decades
- Optimize content quality and distribution

### 7. Simplicity Policy

**Default applies:** Simpler is better.
- Prefer file-system based content over databases
- Use build-time generation over runtime processing
- Keep the data schema simple and obvious
- Avoid premature abstraction — start concrete, refactor if needed

---

## Definition of Done Checklist

The project will be considered **DONE** when:

### Content
- [ ] At least **50% of narrative slides** use real quotes from transcripts (not placeholder text)
- [ ] At least **5 decades** have authentic content from interview data
- [ ] Photos & drawings verified as correct references in `decades.ts` (media already in place)
- [ ] Each decade has **at least 1 audio clip** extracted from interviews

### Audio
- [ ] **3+ inline audio clips** are implemented with play buttons
- [ ] Audio clips are properly extracted and optimized (< 2MB each)
- [ ] Audio player UI works on mobile and desktop
- [ ] Ambient audio system is functional (can be enabled/disabled)

### Technical
- [ ] TypeScript build completes with **zero errors**
- [ ] All media files have **proper alt text** and captions
- [ ] Content validation script passes with **>80% score**
- [ ] No placeholder text contains phrases like "Lorem ipsum" or generic AI text
- [ ] Mobile responsive design is preserved

### Data Integrity
- [ ] Original data files in `data/` directory are **unmodified** (read-only)
- [ ] Transcript attribution is clear (which interview, which date)
- [ ] Photo/drawing sources are traceable to original files
- [ ] Content respects chronological timeline from interviews

---

## Success Criteria

**Minimum viable:**
- 50% real content integration (authentic quotes from transcripts)
- 5 decades with authentic stories
- 3 audio clips playable
- Build succeeds with `bun run build`

**Target goal:**
- 80%+ real content integration (narrative slides from transcripts)
- All decades (1930s-2010s) populated with real stories
- 3-5 audio clips per decade
- Media references validated (71 files already in place)

**Stretch goal:**
- 100% content from real transcripts (zero placeholder text)
- Full ambient audio experience per decade
- Audio timestamps linked to transcript sources
- Canción de cuna audio for 1950s+ decades
