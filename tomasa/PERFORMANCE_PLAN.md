# Plan: Optimize Tomasa Webapp Performance

## Context

The `tomasa/` memorial webapp loads 71 WebP images (~13 MB) organized across 9 decades. The current implementation has several performance problems: all slides are rendered into the DOM during the entrance splash screen (before the user has interacted), all 9 decade cover images are marked as `priority` (triggering simultaneous preloads), and fill-mode images lack `sizes` hints. The goal is faster initial load, fewer wasted network requests, and better rendering performance for offscreen slides.

---

## Architectural Options Analysis

These are broader architectural alternatives considered before the concrete code changes below. Each is evaluated for its actual benefit given the app's current constraints (static export, GitHub Pages, ~13MB image payload).

### SSR (Server-Side Rendering) — Low value here

Moving from static export to SSR (e.g. Vercel) would enable streaming HTML and remove the hydration delay. However, the bottleneck of this app is **images**, not JavaScript execution or server response time. The `SlideEngine` is a client component regardless of SSR mode — it still hydrates and still triggers image fetches. SSR would not meaningfully reduce the image payload problem.

**Verdict: Skip for now.** The code changes in this plan (deferred SlideEngine mount, priority fixes) eliminate the main JS-related issues without requiring a hosting change.

### Vercel + Next.js Image Optimization — HIGH impact, requires hosting change

Currently `next.config.js` sets `unoptimized: true` because GitHub Pages cannot run Next.js's image optimization server. This means the browser always fetches the full-size WebP file, even if it's displayed at 400px on mobile. Moving to Vercel would:
- Re-enable `next/image` optimization (remove `unoptimized: true`)
- Automatically generate responsive `srcset` entries per breakpoint
- Serve AVIF (20-30% smaller than WebP) where supported
- Add a proper global CDN with edge caching

**Estimated impact**: ~13MB total → ~3–5MB for a typical mobile session (correct image size + AVIF).

**Verdict: The single highest-impact architectural change available.** Free tier covers this site's traffic. Requires updating the GitHub Actions deploy workflow.

### Cloudflare Pages — Medium impact, easier migration than Vercel

Cloudflare Pages serves static files from a global edge network (better CDN than GitHub Pages). It would not enable Next.js image optimization, but it would improve global latency, especially for users far from GitHub's CDN nodes. Migration is straightforward (connect repo, set build command, done).

**Verdict: A cheap win if Vercel is not desired.** Does not fix the image-sizing problem but reduces TTFB globally.

### localStorage for Return Visitor Optimization — Medium impact, zero infra change

`localStorage` can persist state across sessions. Two specific improvements are valuable here:

1. **Skip entrance for returning visitors**: On first visit, write `visited: true` to localStorage. On subsequent visits, auto-call `handleEnter()` immediately — skipping the splash screen entirely. This saves ~1-2s for anyone revisiting the memorial.

2. **Remember last decade**: Persist the `activeDecadeId` to localStorage. On return, scroll directly to that decade instead of starting at the 1930s. Meaningful for users who explore in multiple sessions.

3. **Persist audio mute preference**: Already managed in React context; could be persisted so returning visitors don't have to toggle it again.

Implementation is simple — `useEffect` + `localStorage.getItem/setItem` in `memorial-experience.tsx` and `slide-engine.tsx`. No dependencies required.

**Verdict: Recommended addition to the code changes below.** High perceived-performance win for return visitors.

### Predictive Preloading — Medium impact, no infra change

As the user scrolls to slide N, preload the images for slides N+1 and N+2. Currently Next.js lazy-loads all non-priority images, which means each new slide has a brief loading gap as the user arrives. An `IntersectionObserver` callback in `slide-engine.tsx` could set an `isPreloading` flag on adjacent slides, triggering their images to load slightly before they're needed.

Implementation: Add a second `IntersectionObserver` (threshold: 0.3 instead of 0.5) that fires earlier, and pass a `preload` prop to slide components to set `loading="eager"` on images before they scroll fully into view.

**Verdict: Recommended for smooth scroll UX.** Complexity is low — one extra observer, one prop.

### AVIF Images — High impact, offline work

Re-encoding the 71 WebP files as AVIF would reduce sizes by 20-30% with equal visual quality. AVIF has 95%+ browser support (all modern browsers). This is a one-time offline operation:

```bash
for f in public/media/**/*.webp; do cwebp -q 85 "$f" -o "${f%.webp}.avif"; done
# or use sharp/squoosh
```

Then update all `imageSrc` references in `decades.ts` and HTML to point to `.avif` files. The service worker cache already handles `.webp` — updating it to include `.avif` is trivial.

**Verdict: High impact, but it's content/asset work, not code work.** Worth doing separately as a dedicated task after the code changes are in.

### Virtual Slide Rendering (windowing) — Medium impact, high complexity

Only render slides ±2 from the current slide in the DOM, replacing others with fixed-height placeholders. This reduces DOM size from ~70 nodes to ~5 at any time, reducing memory use and paint cost. However, it conflicts with CSS `scroll-snap`, which needs all snap points present in the DOM. Implementing virtual rendering correctly requires replacing CSS scroll-snap with JS-controlled scroll positioning, which is a large rewrite.

**Verdict: `content-visibility: auto` (Change 4 below) achieves the rendering skip benefit without the complexity or scroll-snap risk. Skip virtual rendering.**

### Web Workers for Audio — Low impact

Offloading audio processing to a Web Worker would free the main thread during audio decode. For this app, audio is simple HTML `<audio>` element playback — no custom DSP. The browser already handles audio decoding off the main thread natively. No benefit here.

**Verdict: Skip.**

---

### Summary Table

| Change | Impact | Effort | Requires infra change? |
|--------|--------|--------|----------------------|
| Move to Vercel (image optimization) | Very high | Low | Yes (hosting) |
| AVIF image re-encoding | High | Low (offline) | No |
| localStorage (skip entrance, remember position) | Medium | Low | No |
| Cloudflare Pages (better CDN) | Medium | Very low | Yes (hosting) |
| Predictive preloading | Medium | Low | No |
| Virtual slide rendering | Medium | Very high | No |
| SSR | Low | High | Yes (hosting) |
| Web Workers for audio | None | High | No |

**Recommended architecture**: Keep GitHub Pages for now and apply all 5 code changes below. When audio files are added, evaluate moving to Vercel to unlock image optimization — that alone would cut mobile image payload by ~60%.

---

## Changes (in implementation order)

---

### 1. Add `sizes="100vw"` to fill images (zero-risk)

**`apps/tomasa/src/components/slides/photo-slide.tsx`** — add `sizes="100vw"`:
```tsx
// before
<Image src={mediaPath(slide.imageSrc)} alt={slide.imageAlt ?? ""} fill className="object-cover object-top" />
// after
<Image src={mediaPath(slide.imageSrc)} alt={slide.imageAlt ?? ""} fill sizes="100vw" className="object-cover object-top" />
```

---

### 2. Fix `priority` — only first decade cover (not all 9)

**`apps/tomasa/src/components/slides/decade-title-slide.tsx`** — accept `priority` prop:
```tsx
// before
export function DecadeTitleSlide({ decade }: { decade: Decade }) {
  ...
  <Image ... fill className="object-cover" priority />

// after
export function DecadeTitleSlide({ decade, priority = false }: { decade: Decade; priority?: boolean }) {
  ...
  <Image ... fill sizes="100vw" className="object-cover" priority={priority} />
```

**`apps/tomasa/src/components/slide-engine.tsx`** — pass `priority={index === 0}`:
```tsx
// before
decades.map((decade) => (
  ...
  <DecadeTitleSlide decade={decade} />

// after
decades.map((decade, index) => (
  ...
  <DecadeTitleSlide decade={decade} priority={index === 0} />
```

---

### 3. Defer SlideEngine mount — load images during entrance animation, not before

**`apps/tomasa/src/components/entrance.tsx`** — add `onInteract?` prop, call it on tap:
```tsx
// before
interface EntranceProps { onEnter: () => void }
export function Entrance({ onEnter }: EntranceProps) {
  function handleTap() { setVisible(false) }

// after
interface EntranceProps { onEnter: () => void; onInteract?: () => void }
export function Entrance({ onEnter, onInteract }: EntranceProps) {
  function handleTap() {
    onInteract?.()   // fires before animation starts — SlideEngine mounts during fade
    setVisible(false)
  }
```

**`apps/tomasa/src/components/memorial-experience.tsx`** — two states: `preloading` (on tap) + `entered` (after animation):
```tsx
// before
const [entered, setEntered] = useState(false)
function handleEnter() { setUserHasInteracted(true); setEntered(true) }
return (
  <>
    {!entered && <Entrance onEnter={handleEnter} />}
    <SlideEngine decades={decades} />   // always rendered — BAD
    {entered && <AudioToggle />}
  </>
)

// after
const [preloading, setPreloading] = useState(false)
const [entered, setEntered] = useState(false)
function handleInteract() { setPreloading(true) }
function handleEnter() { setUserHasInteracted(true); setEntered(true) }
return (
  <>
    {!entered && <Entrance onEnter={handleEnter} onInteract={handleInteract} />}
    {preloading && <SlideEngine decades={decades} />}   // mounts on tap, 0.8s before user sees slides
    {entered && <AudioToggle />}
  </>
)
```

Timing: `onInteract` fires inside `handleTap` before `setVisible(false)`, so React mounts `SlideEngine` at the start of the 0.8s exit animation — the first decade cover (now with `priority={true}`) has a full 800ms head start before the user sees the slides.

---

### 4. `content-visibility: auto` on slide wrapper divs

Tells browser to skip rendering/painting offscreen slides. Safe with `scroll-snap` when paired with `contain-intrinsic-size` to preserve snap positions.

**`apps/tomasa/src/app/globals.css`** — add utility class (after existing scroll-snap utilities):
```css
.slide-offscreen {
  content-visibility: auto;
  contain-intrinsic-size: 0 100dvh;
}
```

**`apps/tomasa/src/components/slide-engine.tsx`** — add class to all slide wrappers:
```tsx
// before
<div className="snap-start min-h-dvh">
// after
<div className="snap-start min-h-dvh slide-offscreen">
```
(Both the decade cover wrapper and each slide wrapper.)

> **Note:** Test on iOS Safari 17+ after this change. If scroll-snap breaks, remove `slide-offscreen` from the `DecadeTitleSlide` wrapper only (the first element in each `<section>`), keeping the optimization on non-anchor slides.

Browser support: Chrome 85+, Edge 85+, Safari 17+. Degrades gracefully.

---

### 5. PWA cache improvements

**`apps/tomasa/next.config.js`**:
- Image cache: 1 day → 30 days (memorial images never change); entries: 64 → 100 (71 images + entrance)
- Add audio rule for `.mp3|.ogg|.wav` (referenced in content data)

```js
// before
{ urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/, handler: "CacheFirst", options: { cacheName: "images", expiration: { maxEntries: 64, maxAgeSeconds: 86400 } } },

// after
{ urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/, handler: "CacheFirst", options: { cacheName: "images", expiration: { maxEntries: 100, maxAgeSeconds: 2592000 } } },
{ urlPattern: /\.(?:mp3|ogg|wav)$/, handler: "CacheFirst", options: { cacheName: "audio", expiration: { maxEntries: 20, maxAgeSeconds: 2592000 } } },
```

---

## Critical Files

- `apps/tomasa/src/components/memorial-experience.tsx`
- `apps/tomasa/src/components/entrance.tsx`
- `apps/tomasa/src/components/slide-engine.tsx`
- `apps/tomasa/src/components/slides/decade-title-slide.tsx`
- `apps/tomasa/src/components/slides/photo-slide.tsx`
- `apps/tomasa/src/app/globals.css`
- `apps/tomasa/next.config.js`

## Verification

1. `bun run dev` in `tomasa/` — confirm entrance screen shows, tap starts the experience
2. DevTools Network tab (disable cache): verify only 1 image loads during entrance animation (first decade cover), not 9+
3. DevTools Performance tab: confirm fewer layout/paint operations on initial load
4. Scroll through all decades — confirm CSS scroll-snap still works (each swipe snaps to a full slide)
5. Test on iOS Safari — check scroll-snap doesn't break with `content-visibility`
6. `bun run build` — confirm no TypeScript errors
