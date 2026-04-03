# Tomasa

**An Interactive Memorial Experience**

Product Specification — March 2026 · v1.0

---

## 1. Vision & Purpose

Tomasa is a public, interactive memorial website that celebrates the life of Tomasa through her own voice, photographs, artwork, and stories. It is designed as a gift to the world — a place where family, friends, and strangers can explore her life decade by decade through a cinematic, full-screen slide experience.

The site is built from a curated collection of approximately 5 audio interviews, 30–50 photographs, and a handful of her original drawings. The experience is designed mobile-first, entirely in Spanish, and intended to feel warm, intimate, and exploratory — like discovering a loved one's story at your own pace.

---

## 2. Target Audience

**Primary:** Family and close friends who knew Tomasa personally.

**Secondary:** Anyone who discovers the site — it is fully public and not gated.

The majority of visitors will access the site on mobile devices (phones), so the design must be phone-first with desktop as a graceful scale-up.

---

## 3. Experience Design

### 3.1 Landing / Entrance

The site opens with an animated slow reveal of a key image or drawing by Tomasa. This should feel cinematic and unhurried — a moment of pause before entering her story. The animation fades or zooms into the first slide of the experience. No navigation chrome is visible during the entrance; the timeline bar appears after the reveal completes.

### 3.2 Navigation Model

The core experience is a series of full-screen slides, one scene per screen, advanced by swiping (mobile) or scrolling (desktop). Each slide occupies the full viewport and contains one "moment" — a photo with a quote, an artwork, an audio clip with context, or a narrative text card.

A persistent sticky timeline bar is displayed after the entrance animation. It shows decade labels (e.g., "1940s", "1950s", ...) as tappable dots or labels. The current position is highlighted. Users can tap any decade to jump directly to that section. On mobile, this bar sits at the bottom of the screen; on desktop, it can be vertical on the side or horizontal at the top.

### 3.3 Content Structure

Content is organized chronologically by decade. Each decade is a chapter containing multiple slides. A decade chapter begins with a title slide showing the decade label and optionally a representative image, followed by content slides for that era.

Slide types:

- **Photo slide** — A full-bleed or centered photograph with an optional caption or interview excerpt overlay.
- **Artwork slide** — One of Tomasa's drawings displayed prominently, with optional context about when/why it was created.
- **Audio + text slide** — A key interview quote displayed as text, with an inline play button to hear her say it in her own voice.
- **Narrative slide** — A text-only card with a passage from the interviews or editorial context, styled typographically.

### 3.4 Audio Design

Audio operates in two modes that coexist:

**Ambient narration:** Selected audio clips from interviews play softly as background narration while the user scrolls through certain sections. These are tied to specific decade chapters and fade in/out with scroll position. They should feel like Tomasa is in the room, speaking quietly. Volume is low and the audio does not compete with reading.

**Inline clips:** Specific slides feature a visible play button. Tapping it plays a short, highlighted audio clip — a key quote, a laugh, a story. These are louder and more prominent than ambient audio. When an inline clip plays, any ambient audio should duck (lower volume) or pause.

On mobile, audio should respect the device's silent mode. A small, persistent mute/unmute toggle should be accessible (e.g., a speaker icon in the corner).

### 3.5 Reactions

Each decade section displays a small set of emoji reaction buttons: ❤️ (heart), 🕯️ (candle), 😊 (smile), and 👏 (clapping). Tapping a reaction increments an anonymous counter. There is no login, no identity, no commenting — just a simple tap to express feeling.

Reaction counts are stored per-section (per decade) and persist across all visitors. A small animation (e.g., the emoji briefly scales up or floats) provides satisfying feedback on tap. Counts are displayed next to each emoji (e.g., "24 ❤️").

### 3.6 Artwork Gallery

Tomasa's drawings and artwork appear woven into the timeline at the relevant decade. When a user taps on any artwork, it opens in a full-screen lightbox overlay with pinch-to-zoom support on mobile. A subtle caption or attribution can appear below the image. Swiping in the lightbox should not advance the main timeline.

### 3.7 Interview Excerpts

Written excerpts from the transcribed interviews appear alongside photos from the corresponding era. These are displayed as styled pull-quotes or narrative blocks, attributed to Tomasa. The typography should feel personal — consider a serif or handwriting-inspired font for her quotes, contrasting with the UI's sans-serif.

---

## 4. Visual Design

### 4.1 Color Palette

The palette is soft, muted, and warm — evoking old photographs and handmade paper.

| Role | Color | Usage |
|------|-------|-------|
| Background | `#FAF6F1` (warm cream) | Page and slide backgrounds |
| Primary text | `#3D3229` (deep brown) | Body text, captions |
| Accent | `#8B6F4E` (warm brown) | Headings, timeline dots, interactive elements |
| Secondary | `#A89279` (muted tan) | Subtitles, metadata, muted text |
| Highlight | `#D4B896` (soft gold) | Active timeline position, hover states |
| Overlay | `rgba(61,50,41,0.7)` | Lightbox backdrop, text overlays on photos |

### 4.2 Typography

- **UI / body text:** A clean sans-serif such as Inter, Source Sans, or similar. Warm and readable.
- **Tomasa's quotes:** A serif or soft display font (e.g., Lora, Merriweather, or EB Garamond) to create contrast and a sense of her personal voice.
- **Decade titles:** The accent font at large scale, possibly with subtle letter-spacing.

### 4.3 Motion & Transitions

- **Slide transitions:** Smooth fade or soft vertical slide (not harsh snapping). Each transition should feel gentle and intentional.
- **Entrance animation:** A slow opacity fade-in (2–3 seconds) combined with a gentle scale or Ken Burns effect on the key image.
- **Reactions:** A brief scale-up pulse on the tapped emoji, with the count incrementing smoothly.
- **Audio:** Volume fades (not hard cuts) for ambient narration when entering/leaving a section.

---

## 5. Technical Architecture

### 5.1 Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js (App Router) | Static export or SSG for all content pages |
| Styling | Tailwind CSS | With a custom warm theme config matching the palette |
| Hosting | Vercel | Free tier; `tomasa.vercel.app` subdomain |
| Reactions backend | Vercel KV (Upstash Redis) | Serverless API route for reaction counts |
| Audio | Native HTML5 `<audio>` | With Howler.js or use-sound for better mobile control |
| Animations | Framer Motion | Slide transitions, entrance animation, reaction feedback |
| Slide engine | Custom or fullPage.js-style | Full-viewport sections with snap scrolling |
| Image optimization | Next.js `<Image>` | Automatic WebP, lazy loading, responsive sizes |

### 5.2 Content Model

All content is stored as static data in the codebase (no CMS). The recommended structure is a `content/` directory with one JSON or MDX file per decade, referencing media assets in the `public/` folder.

Example content schema per decade:

```json
// content/1940s.json
{
  "decade": "1940s",
  "title": "Los primeros años",
  "coverImage": "/media/1940s/cover.jpg",
  "ambientAudio": "/media/1940s/ambient.mp3",
  "slides": [
    {
      "type": "photo | artwork | audio | narrative",
      "image": "/media/1940s/photo1.jpg",
      "caption": "Tomasa en su pueblo natal...",
      "quote": "Yo siempre fui curiosa...",
      "audioClip": "/media/1940s/clip1.mp3",
      "audioTimestamp": "02:34"
    }
  ]
}
```

### 5.3 Reactions API

A single serverless API route handles reactions:

- **GET** `/api/reactions?section=1940s` — Returns current counts: `{ heart: 24, candle: 8, smile: 15, clap: 3 }`
- **POST** `/api/reactions` — Body: `{ section: "1940s", type: "heart" }` — Increments the count and returns updated totals.
- **Storage:** Vercel KV (Upstash Redis). Keys follow the pattern `reactions:{decade}:{type}` (e.g., `reactions:1940s:heart`).
- **Rate limiting:** Optional simple throttle (e.g., max 1 reaction per type per section per IP per minute) to prevent abuse.

### 5.4 File Structure

```
tomasa/
├── app/
│   ├── page.tsx              # Main slide experience
│   ├── layout.tsx            # Root layout, fonts, meta
│   └── api/reactions/route.ts # Reactions endpoint
├── components/
│   ├── Entrance.tsx          # Animated reveal
│   ├── SlideEngine.tsx       # Full-screen slide container
│   ├── TimelineBar.tsx       # Sticky decade navigation
│   ├── PhotoSlide.tsx        # Photo + caption layout
│   ├── ArtworkSlide.tsx      # Artwork + lightbox trigger
│   ├── AudioSlide.tsx        # Quote + inline audio player
│   ├── NarrativeSlide.tsx    # Text-only card
│   ├── Reactions.tsx         # Emoji reaction bar
│   ├── Lightbox.tsx          # Fullscreen artwork viewer
│   └── AudioManager.tsx      # Ambient + inline audio logic
├── content/                  # JSON files per decade
├── public/media/             # Images, audio files
└── tailwind.config.ts        # Custom warm palette
```

---

## 6. Mobile-First Considerations

- All slides must work at 375px width minimum (iPhone SE). Content should not overflow or require horizontal scrolling.
- **Touch:** Swipe up/down to advance slides. The timeline bar tap-targets must be at least 44px.
- **Audio:** Respect iOS autoplay restrictions. Require a user interaction (e.g., tap on the entrance animation) before playing any audio. Show a clear mute/unmute toggle.
- **Images:** Use responsive `srcSet` with Next.js Image. Serve WebP with JPEG fallback. Lazy-load all images except the entrance and first two slides.
- **Performance:** Target Lighthouse score of 90+ on mobile. Preload the next slide's image while the current one is displayed.
- **Lightbox:** Support pinch-to-zoom on artwork. Prevent the lightbox from interfering with main slide navigation.

---

## 7. Accessibility & SEO

- **Language:** Set `<html lang="es">` throughout. All UI labels and meta content in Spanish.
- **Alt text:** Every image and artwork must have descriptive alt text in Spanish.
- **Audio:** Provide a visible transcript link or expandable transcript for each audio clip.
- **Keyboard:** Support arrow keys for slide navigation on desktop.
- **SEO:** Open Graph and Twitter Card meta tags with a representative image and description in Spanish. The site title should be "Tomasa" with a descriptive subtitle.
- **Contrast:** Ensure all text meets WCAG AA contrast ratios against the warm backgrounds.

---

## 8. Scope & Milestones

### 8.1 MVP (v1.0)

- Animated entrance with key image reveal
- Full-screen slide engine with swipe/scroll navigation
- Sticky timeline bar with decade jumping
- 4 slide types: photo, artwork, audio, narrative
- Inline audio playback on specific slides
- Ambient audio per decade section
- Artwork lightbox with pinch-to-zoom
- Emoji reactions (heart, candle, smile, clap) with per-section persistence via Vercel KV
- Mobile-first responsive design
- Content for all available decades loaded from static JSON
- Deployed to `tomasa.vercel.app`

### 8.2 Post-MVP (Nice to Have)

- Custom domain (e.g., `tomasa.familia` or similar)
- Social sharing: Generate a shareable card when someone shares a specific slide or decade
- Subtle background music or ambient sound design (wind, birds) under narration
- Print/export: A "download as PDF" option that compiles the experience into a printable keepsake
- Family contributions: A simple form where family members can submit photos or written memories for the creator to curate and add
- Analytics: A lightweight, privacy-respecting analytics tool (e.g., Plausible or Umami) to see how many people visit

---

## 9. Open Questions

| Question | Options | Impact |
|----------|---------|--------|
| How many decades to cover? | Depends on Tomasa's age and available content per era | Determines total number of sections and timeline length |
| How many slides per decade? | Recommend 3–8 per decade to keep pacing tight | Affects total scroll length and content curation effort |
| Audio file format? | MP3 for broad compatibility; consider Opus for smaller files | File size vs. quality tradeoff on mobile |
| Snap scrolling library? | CSS scroll-snap, fullPage.js, or custom Framer Motion | Each has different mobile behavior — prototype to decide |
| Reaction granularity? | Per-decade or per-individual-slide? | Per-slide gives richer data but more API calls |

---

*Built with love for Tomasa.*
