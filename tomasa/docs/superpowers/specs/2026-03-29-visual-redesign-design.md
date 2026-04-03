# Visual Redesign: Emerald & Dusty Rose Memorial Theme

## Context

The Tomasa memorial site currently uses a warm brown/cream palette that feels flat and lacks the visual richness appropriate for a personal memorial celebrating Mexican heritage. This redesign shifts the entire visual identity to an emerald/jade green palette with dusty rose accents, heavy canvas textures, ornamental elements, and a museum-quality lightbox — inspired by the Frida Kahlo Museum aesthetic.

## Design Decisions

| Decision | Choice |
|----------|--------|
| Green palette | Tropical Vibrancy — emerald/jade, saturated |
| Pink accent | Dusty Rose — muted, vintage `oklch(0.72 0.18 350)` |
| Texture level | Heavy Canvas — bold double-layer grain, ornamental dividers, corner brackets |
| Lightbox | Museum Frame — gallery frame + cream mat + caption |
| Scope | Full site overhaul |
| Implementation | Token-First — rewrite design tokens, let cascade do the work, then add texture/ornament per component |

## 1. Design Tokens

**Files**: `tooling/theme.css`, `apps/tomasa/src/app/globals.css`

Replace warm brown/cream palette with emerald/jade greens. Key mappings:

| Token | Old Value | New Value |
|-------|-----------|-----------|
| `--background` | `hsl(30 56% 96%)` | Jade cream `oklch(0.94 0.03 160)` |
| `--foreground` | `hsl(24 18% 20%)` | Deep forest `oklch(0.28 0.06 155)` |
| `--primary` | `hsl(30 29% 42%)` | Rich emerald `oklch(0.45 0.12 158)` |
| `--accent` | `hsl(32 40% 71%)` | Dusty rose `oklch(0.72 0.18 350)` |
| `--card` | `hsl(30 40% 94%)` | Light jade `oklch(0.92 0.04 160)` |
| `--secondary` | `hsl(30 20% 90%)` | Jade mist `oklch(0.90 0.03 160)` |
| `--muted` | `hsl(30 20% 90%)` | Jade mist `oklch(0.90 0.03 160)` |
| `--muted-foreground` | `hsl(30 16% 57%)` | Mid emerald `oklch(0.55 0.08 158)` |
| `--border` | `hsl(30 20% 85%)` | Jade border `oklch(0.85 0.04 160)` |
| `--ring` | `hsl(30 29% 42%)` | Emerald primary `oklch(0.45 0.12 158)` |

OKLCH neutral scale in `tooling/theme.css`: shift hue from `106.42` to `~158` (green axis).

Dark mode tokens follow the same hue shift to emerald/jade.

## 2. Canvas Texture System

**File**: `apps/tomasa/src/app/globals.css`

Reusable CSS classes using `::before`/`::after` pseudo-elements:

### `.canvas-grain`
- Double-layer SVG fractal noise via `::before`
- Fine layer: `baseFrequency: 0.45`, `numOctaves: 6`, opacity `0.40`, `mix-blend-mode: multiply`
- Coarse layer: `baseFrequency: 0.2`, `numOctaves: 3`, opacity `0.18`, `mix-blend-mode: soft-light`

### `.canvas-vignette`
- `::after` with `box-shadow: inset 0 0 160px 70px oklch(0.22 0.06 155 / 0.15)`

### `.canvas-gradient`
- `::after` with multi-stop radial gradient
- Green center glow + subtle dusty rose bleed from corners

Replaces the existing `.artwork-grain` class.

## 3. Lightbox — Museum Frame

**File**: `apps/tomasa/src/components/lightbox.tsx`

### Backdrop
- Dark emerald base: `oklch(0.22 0.05 158)`
- Canvas grain texture (same system as slides)
- Diagonal gradient: emerald → deep forest → hint of rose
- Strong vignette: `inset 0 0 180px 70px oklch(0.08 0.02 155 / 0.5)`

### Image Presentation
- **Outer frame**: Dark emerald gradient border (`oklch(0.40 0.06 158)` → `oklch(0.30 0.04 155)`), `padding: 6px`, `border-radius: 3px`
- **Inner mat**: Jade cream `oklch(0.92 0.02 160)`, `padding: 10-20px` (responsive)
- **Image**: Inside the mat, existing `object-contain` behavior
- **Shadow**: `0 12px 50px oklch(0.08 0.03 155 / 0.6)`

### Caption
- Serif italic (`font-serif`) below the frame
- Color: muted jade `oklch(0.70 0.06 160)`
- Sourced from the `imageSrc` alt text passed to the Lightbox component (may require extending `LightboxProps` to accept a `caption` string)

### Close Button
- Dusty rose border: `1.5px solid oklch(0.72 0.18 350 / 0.4)`
- Background: `oklch(0.72 0.18 350 / 0.15)`
- `backdrop-filter: blur(8px)`
- Icon color: `oklch(0.82 0.12 350)`

### Animation
- Keep existing framer-motion scale/opacity transitions

## 4. Slide Types

### Narrative Slides (`apps/tomasa/src/components/slides/narrative-slide.tsx`)
- Background: jade cream + `.canvas-grain` + `.canvas-vignette` + `.canvas-gradient`
- Ornamental diamond dividers in dusty rose (two gradient lines with rotated diamond center)
- Corner brackets on slide edges: `2px solid oklch(0.60 0.12 160 / 0.35)`
- Text colors follow new foreground tokens automatically

### Artwork Slides (`apps/tomasa/src/components/slides/artwork-slide.tsx`)
- Gallery frame colors → dark emerald; mat → jade cream
- Replace `.artwork-grain` with `.canvas-grain`
- Decorative divider → dusty rose ornamental diamond
- Vignette/gradient use new green palette

### Photo Slides (`apps/tomasa/src/components/slides/photo-slide.tsx`)
- Caption overlay: deep emerald with `backdrop-blur` (replaces `black/50%`)
- Caption text stays white

### Audio Slides (`apps/tomasa/src/components/slides/audio-slide.tsx`)
- Background: jade cream + `.canvas-grain`
- Play button: emerald primary (replaces `bg-stone-800`)
- Blockquote text follows new foreground token

### Decade Title Slides (`apps/tomasa/src/components/slides/decade-title-slide.tsx`)
- Gradient overlay: `from-emerald-dark/70` with hint of rose at top edge (replaces `from-black/70`)

## 5. UI Chrome

### Entrance Screen (`apps/tomasa/src/components/entrance.tsx`)
- Background cascades from new `--background` token
- Title/dates use new foreground/muted tokens
- Ken Burns effect unchanged

### Timeline Bar (`apps/tomasa/src/components/timeline-bar.tsx`)
- Background cascades from tokens (`bg-background/80`)
- Active dot → dusty rose accent color (explicit change)
- Backdrop blur unchanged

### Audio Toggle (`apps/tomasa/src/components/audio-toggle.tsx`)
- Cascades from tokens (`bg-foreground/60` → deep forest, `text-background` → jade cream)

### Focus Rings / Interactive States
- `--ring` token → emerald primary (cascades automatically)

## 6. Files Modified

| File | Change |
|------|--------|
| `tooling/theme.css` | OKLCH neutral scale hue shift to 158 |
| `apps/tomasa/src/app/globals.css` | HSL token rewrite + canvas texture utility classes |
| `apps/tomasa/src/components/lightbox.tsx` | Museum frame redesign |
| `apps/tomasa/src/components/slides/narrative-slide.tsx` | Canvas textures + ornamental elements |
| `apps/tomasa/src/components/slides/artwork-slide.tsx` | Updated frame colors + canvas grain |
| `apps/tomasa/src/components/slides/photo-slide.tsx` | Emerald caption overlay |
| `apps/tomasa/src/components/slides/audio-slide.tsx` | Canvas texture + emerald play button |
| `apps/tomasa/src/components/slides/decade-title-slide.tsx` | Emerald gradient overlay |
| `apps/tomasa/src/components/entrance.tsx` | Token cascade (minimal changes) |
| `apps/tomasa/src/components/timeline-bar.tsx` | Active dot accent color |
| `apps/tomasa/src/components/audio-toggle.tsx` | Token cascade (no changes expected) |

## 7. Verification

1. `bun run dev` — visual walkthrough on localhost:3000
2. Full scroll: entrance → each decade → all slide types
3. Open lightbox on artwork — verify frame, mat, caption, close button
4. Check dark mode
5. Mobile viewport — timeline bottom bar, touch interactions
6. `bun run build` — static export succeeds
7. `bun run lint && bun run type-check` — no regressions
