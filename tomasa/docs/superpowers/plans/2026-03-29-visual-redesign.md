# Visual Redesign: Emerald & Dusty Rose Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the Tomasa memorial's visual identity from warm brown/cream to emerald/jade green with dusty rose accents, heavy canvas textures, and a museum-frame lightbox.

**Architecture:** Token-first approach — rewrite OKLCH and CSS custom property tokens so colors cascade automatically via Tailwind/shadcn, then add canvas texture utility classes in globals.css, then update individual components for textures, ornamental elements, and the lightbox museum frame.

**Tech Stack:** Tailwind CSS 4 (CSS-based config), OKLCH color space, Next.js 15, framer-motion, next/image

**Spec:** `docs/superpowers/specs/2026-03-29-visual-redesign-design.md`

---

## File Structure

| File | Responsibility |
|------|---------------|
| `tooling/theme.css` | OKLCH neutral + primary scale (shared tokens) |
| `apps/tomasa/src/app/globals.css` | CSS custom properties (:root), @theme inline mappings, canvas texture utilities |
| `apps/tomasa/src/components/lightbox.tsx` | Museum frame lightbox with caption |
| `apps/tomasa/src/components/slide-engine.tsx` | Pass caption to lightbox |
| `apps/tomasa/src/components/slides/narrative-slide.tsx` | Canvas textures + ornamental dividers + corner brackets |
| `apps/tomasa/src/components/slides/artwork-slide.tsx` | Emerald frame colors + canvas grain |
| `apps/tomasa/src/components/slides/photo-slide.tsx` | Emerald caption overlay |
| `apps/tomasa/src/components/slides/audio-slide.tsx` | Canvas texture + emerald play button |
| `apps/tomasa/src/components/slides/decade-title-slide.tsx` | Emerald gradient overlay |
| `apps/tomasa/src/components/timeline-bar.tsx` | Dusty rose active dot |
| `apps/tomasa/src/components/entrance.tsx` | No changes (cascades from tokens) |
| `apps/tomasa/src/components/audio-toggle.tsx` | No changes (cascades from tokens) |

---

### Task 1: Rewrite OKLCH Neutral & Primary Tokens

**Files:**
- Modify: `tooling/theme.css` (entire file)

- [ ] **Step 1: Replace neutral scale hue from 106.42 to 158 and primary from 250 to emerald/rose**

Replace the full contents of `tooling/theme.css` with:

```css
/* tooling/theme.css — shared OKLCH design tokens */

@theme {
  /* Neutral palette — emerald/jade axis (hue 158) */
  --color-neutral-50: oklch(0.985 0.005 158);
  --color-neutral-100: oklch(0.97 0.008 158);
  --color-neutral-200: oklch(0.922 0.015 158);
  --color-neutral-300: oklch(0.87 0.025 158);
  --color-neutral-400: oklch(0.708 0.04 158);
  --color-neutral-500: oklch(0.553 0.05 158);
  --color-neutral-600: oklch(0.442 0.045 158);
  --color-neutral-700: oklch(0.371 0.04 158);
  --color-neutral-800: oklch(0.269 0.03 158);
  --color-neutral-900: oklch(0.205 0.025 158);
  --color-neutral-950: oklch(0.145 0.02 158);

  /* Primary accent — emerald */
  --color-primary-400: oklch(0.62 0.14 160);
  --color-primary-500: oklch(0.45 0.12 158);
  --color-primary-600: oklch(0.35 0.10 155);

  /* Typography */
  --font-sans: system-ui, -apple-system, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;

  /* Spacing scale */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 2rem;
  --spacing-xl: 4rem;

  /* Border radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
}
```

- [ ] **Step 2: Verify no build errors**

Run: `cd /Volumes/Verbatim-Vi560-Media/Development/aves/purpurit/tomasa && bun run type-check`
Expected: PASS (no type errors — this is CSS only)

- [ ] **Step 3: Commit**

```bash
git add tooling/theme.css
git commit -m "feat: shift OKLCH neutral scale to emerald hue 158"
```

---

### Task 2: Rewrite CSS Custom Properties to OKLCH Emerald/Rose Palette

**Files:**
- Modify: `apps/tomasa/src/app/globals.css` (`:root` block and `@theme inline` block)

The current system uses `hsl(var(--token))` in `@theme inline` with bare HSL triplets in `:root`. We switch to storing full OKLCH values in `:root` and referencing them directly in `@theme inline`.

- [ ] **Step 1: Update `@theme inline` color mappings to use `var()` directly instead of `hsl()` wrapper**

Replace the first `@theme inline` block (lines 11-35) with:

```css
/* shadcn/ui theme variables mapped to Tailwind utilities via @theme inline */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}
```

- [ ] **Step 2: Replace `:root` tokens with OKLCH emerald/rose values**

Replace the `:root` block (lines 44-65) with:

```css
/* Base theme CSS custom properties — emerald & dusty rose palette */
:root {
  --background: oklch(0.94 0.03 160);
  --foreground: oklch(0.28 0.06 155);
  --card: oklch(0.92 0.04 160);
  --card-foreground: oklch(0.28 0.06 155);
  --popover: oklch(0.94 0.03 160);
  --popover-foreground: oklch(0.28 0.06 155);
  --primary: oklch(0.45 0.12 158);
  --primary-foreground: oklch(0.94 0.03 160);
  --secondary: oklch(0.90 0.03 160);
  --secondary-foreground: oklch(0.28 0.06 155);
  --muted: oklch(0.90 0.03 160);
  --muted-foreground: oklch(0.55 0.08 158);
  --accent: oklch(0.72 0.18 350);
  --accent-foreground: oklch(0.28 0.06 155);
  --destructive: oklch(0.55 0.2 25);
  --destructive-foreground: oklch(0.94 0.03 160);
  --border: oklch(0.85 0.04 160);
  --input: oklch(0.85 0.04 160);
  --ring: oklch(0.45 0.12 158);
  --radius: 0.5rem;
}
```

- [ ] **Step 3: Verify dev server renders with new colors**

Run: `cd /Volumes/Verbatim-Vi560-Media/Development/aves/purpurit/tomasa && bun run build`
Expected: Build succeeds. Open `bun run dev` and visually confirm green-tinted backgrounds.

- [ ] **Step 4: Commit**

```bash
git add apps/tomasa/src/app/globals.css
git commit -m "feat: rewrite CSS tokens to OKLCH emerald/jade palette with dusty rose accent"
```

---

### Task 3: Add Canvas Texture Utility Classes

**Files:**
- Modify: `apps/tomasa/src/app/globals.css` (add new classes, replace `.artwork-grain`)

- [ ] **Step 1: Replace `.artwork-grain` with canvas texture system**

Remove the `.artwork-grain` block (lines 76-81) and replace with the canvas texture system. Add this at the end of `globals.css`:

```css
/* Canvas texture system — opt-in via class names */

.canvas-grain {
  position: relative;
}

.canvas-grain::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.45' numOctaves='6' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23f)'/%3E%3C/svg%3E");
  background-size: 512px 512px;
  opacity: 0.40;
  mix-blend-mode: multiply;
}

.canvas-grain::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.2' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23f)'/%3E%3C/svg%3E");
  background-size: 512px 512px;
  opacity: 0.18;
  mix-blend-mode: soft-light;
}

.canvas-vignette {
  position: relative;
}

.canvas-vignette::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  box-shadow: inset 0 0 160px 70px oklch(0.22 0.06 155 / 0.15);
}

.canvas-gradient {
  position: relative;
}

.canvas-gradient::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    radial-gradient(ellipse at 20% 10%, oklch(0.82 0.10 162 / 0.5) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 90%, oklch(0.82 0.12 350 / 0.25) 0%, transparent 40%),
    linear-gradient(180deg, oklch(0.90 0.05 160 / 0.3) 0%, transparent 25%, oklch(0.86 0.06 155 / 0.25) 100%);
}
```

**Note:** `.canvas-grain` uses both `::before` and `::after`, so components that need grain + vignette should apply `canvas-grain` on a wrapper and `canvas-vignette` on the main element (or use a separate overlay div for the vignette). Alternatively, the vignette can be applied as an inline `box-shadow` style directly. Plan the component tasks accordingly.

- [ ] **Step 2: Verify no build errors**

Run: `cd /Volumes/Verbatim-Vi560-Media/Development/aves/purpurit/tomasa && bun run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add apps/tomasa/src/app/globals.css
git commit -m "feat: add canvas texture utility classes (grain, vignette, gradient)"
```

---

### Task 4: Redesign Lightbox as Museum Frame

**Files:**
- Modify: `apps/tomasa/src/components/lightbox.tsx` (full rewrite)
- Modify: `apps/tomasa/src/components/slide-engine.tsx:41-44,148-151` (pass caption to lightbox)

- [ ] **Step 1: Update LightboxProps and SlideEngine to support caption**

In `slide-engine.tsx`, change the lightbox state and handler to support caption. Replace lines 41-44:

```typescript
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [lightboxCaption, setLightboxCaption] = useState<string | undefined>(undefined)

  const handleOpenLightbox = useCallback((imageSrc: string, caption?: string) => {
    setLightboxImage(imageSrc)
    setLightboxCaption(caption)
  }, [])
```

Update the Lightbox usage at lines 148-151:

```tsx
      <Lightbox
        imageSrc={lightboxImage}
        caption={lightboxCaption}
        onClose={() => {
          setLightboxImage(null)
          setLightboxCaption(undefined)
        }}
      />
```

- [ ] **Step 2: Update ArtworkSlide to pass caption through onOpenLightbox**

In `artwork-slide.tsx`, update the `onOpenLightbox` prop type and call:

Change the prop type (line 9):
```typescript
  onOpenLightbox?: (imageSrc: string, caption?: string) => void
```

Change the onClick (line 26):
```typescript
            onClick={() => onOpenLightbox?.(mediaPath(slide.imageSrc!), slide.caption)}
```

Also update the `SlideByType` component in `slide-engine.tsx` to match:

Change `onOpenLightbox` type in `SlideByType` props (line 19):
```typescript
  onOpenLightbox: (imageSrc: string, caption?: string) => void
```

- [ ] **Step 3: Rewrite lightbox.tsx with museum frame design**

Replace the entire contents of `apps/tomasa/src/components/lightbox.tsx`:

```tsx
"use client"

import { useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

interface LightboxProps {
  imageSrc: string | null
  caption?: string
  onClose: () => void
}

export function Lightbox({ imageSrc, caption, onClose }: LightboxProps) {
  const isOpen = imageSrc !== null

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (!isOpen) return

    document.addEventListener("keydown", handleKeyDown)
    document.body.classList.add("overflow-hidden")

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.classList.remove("overflow-hidden")
    }
  }, [isOpen, handleKeyDown])

  return (
    <AnimatePresence>
      {isOpen && imageSrc && (
        <motion.div
          key="lightbox-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
          style={{
            backgroundColor: "oklch(0.22 0.05 158)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          onClick={onClose}
        >
          {/* Canvas grain texture layer */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.5' numOctaves='5' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23f)'/%3E%3C/svg%3E")`,
              backgroundSize: "512px 512px",
              opacity: 0.20,
              mixBlendMode: "soft-light" as const,
            }}
          />

          {/* Gradient overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(160deg, oklch(0.20 0.06 162 / 0.8) 0%, oklch(0.16 0.04 155 / 0.9) 50%, oklch(0.18 0.05 350 / 0.3) 100%)",
            }}
          />

          {/* Vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: "inset 0 0 180px 70px oklch(0.08 0.02 155 / 0.5)",
            }}
          />

          {/* Close button */}
          <button
            className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full transition-colors"
            style={{
              backgroundColor: "oklch(0.72 0.18 350 / 0.15)",
              border: "1.5px solid oklch(0.72 0.18 350 / 0.4)",
              backdropFilter: "blur(8px)",
            }}
            onClick={onClose}
            aria-label="Cerrar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="oklch(0.82 0.12 350)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Museum frame + image */}
          <motion.div
            className="relative z-10 flex flex-col items-center"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Outer frame */}
            <div
              className="rounded-[3px]"
              style={{
                padding: "6px",
                background: "linear-gradient(135deg, oklch(0.40 0.06 158), oklch(0.30 0.04 155))",
                boxShadow: "0 12px 50px oklch(0.08 0.03 155 / 0.6), 0 2px 8px oklch(0.08 0.03 155 / 0.3)",
              }}
            >
              {/* Inner mat */}
              <div
                className="p-3 md:p-5"
                style={{ backgroundColor: "oklch(0.92 0.02 160)" }}
              >
                {/* Image */}
                <div className="relative h-[70vh] w-[85vw] max-h-[70vh] max-w-4xl">
                  <Image
                    src={imageSrc}
                    alt={caption ?? ""}
                    fill
                    className="object-contain"
                    sizes="85vw"
                  />
                </div>
              </div>
            </div>

            {/* Caption below frame */}
            {caption && (
              <p
                className="mt-3 font-serif text-sm italic"
                style={{ color: "oklch(0.70 0.06 160)" }}
              >
                {caption}
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 4: Verify lightbox renders correctly**

Run: `cd /Volumes/Verbatim-Vi560-Media/Development/aves/purpurit/tomasa && bun run type-check`
Expected: No type errors.

Run: `bun run dev` — navigate to an artwork slide, click to open lightbox. Verify: dark emerald backdrop with grain texture, image in frame with cream mat, caption below, dusty rose close button.

- [ ] **Step 5: Commit**

```bash
git add apps/tomasa/src/components/lightbox.tsx apps/tomasa/src/components/slide-engine.tsx apps/tomasa/src/components/slides/artwork-slide.tsx
git commit -m "feat: redesign lightbox as museum frame with caption support"
```

---

### Task 5: Update Narrative Slides with Canvas Textures & Ornaments

**Files:**
- Modify: `apps/tomasa/src/components/slides/narrative-slide.tsx` (full rewrite)

- [ ] **Step 1: Rewrite narrative-slide.tsx**

Replace the entire contents:

```tsx
import type { Slide } from "@repo/utils"

export function NarrativeSlide({ slide }: { slide: Slide }) {
  return (
    <div className="snap-start min-h-dvh flex flex-col items-center justify-center relative overflow-hidden">
      {/* Base background */}
      <div className="absolute inset-0 bg-background" />

      {/* Canvas grain texture */}
      <div className="canvas-grain absolute inset-0" />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: "inset 0 0 160px 70px oklch(0.22 0.06 155 / 0.15)",
          zIndex: 2,
        }}
      />

      {/* Gradient with rose bleed */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 20% 10%, oklch(0.82 0.10 162 / 0.5) 0%, transparent 50%), radial-gradient(ellipse at 80% 90%, oklch(0.82 0.12 350 / 0.25) 0%, transparent 40%), linear-gradient(180deg, oklch(0.90 0.05 160 / 0.3) 0%, transparent 25%, oklch(0.86 0.06 155 / 0.25) 100%)",
          zIndex: 2,
        }}
      />

      {/* Corner brackets */}
      <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 pointer-events-none" style={{ borderColor: "oklch(0.60 0.12 160 / 0.35)", zIndex: 3 }} />
      <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 pointer-events-none" style={{ borderColor: "oklch(0.60 0.12 160 / 0.35)", zIndex: 3 }} />
      <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 pointer-events-none" style={{ borderColor: "oklch(0.60 0.12 160 / 0.35)", zIndex: 3 }} />
      <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 pointer-events-none" style={{ borderColor: "oklch(0.60 0.12 160 / 0.35)", zIndex: 3 }} />

      {/* Content */}
      <div className="relative z-10 max-w-xl flex flex-col items-center gap-6 text-center px-6 py-12">
        {slide.title && (
          <h3 className="font-serif text-3xl md:text-5xl text-foreground tracking-tight">
            {slide.title}
          </h3>
        )}

        {/* Ornamental diamond divider */}
        <div className="flex items-center justify-center gap-2 w-48">
          <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, oklch(0.72 0.18 350))" }} />
          <div className="w-2 h-2 rotate-45" style={{ border: "1.5px solid oklch(0.72 0.18 350)" }} />
          <div className="flex-1 h-px" style={{ background: "linear-gradient(270deg, transparent, oklch(0.72 0.18 350))" }} />
        </div>

        {slide.text && (
          <p className="font-serif text-lg md:text-xl text-foreground/80 leading-relaxed">
            {slide.text}
          </p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify renders correctly**

Run: `cd /Volumes/Verbatim-Vi560-Media/Development/aves/purpurit/tomasa && bun run type-check`
Expected: No type errors.

Run: `bun run dev` — scroll to a narrative slide. Verify: jade cream background, visible canvas grain, vignette edges, green/rose gradient, corner brackets, diamond divider in dusty rose.

- [ ] **Step 3: Commit**

```bash
git add apps/tomasa/src/components/slides/narrative-slide.tsx
git commit -m "feat: add canvas textures and ornamental elements to narrative slides"
```

---

### Task 6: Update Artwork Slides to Emerald Frame + Canvas Grain

**Files:**
- Modify: `apps/tomasa/src/components/slides/artwork-slide.tsx`

- [ ] **Step 1: Replace hardcoded HSL colors and artwork-grain with new palette**

Replace the entire contents of `artwork-slide.tsx`:

```tsx
import Image from "next/image"
import type { Slide } from "@repo/utils"
import { mediaPath } from "@/lib/base-path"

export function ArtworkSlide({
  slide,
  onOpenLightbox,
}: {
  slide: Slide
  onOpenLightbox?: (imageSrc: string, caption?: string) => void
}) {
  return (
    <div className="artwork-slide snap-start min-h-dvh flex flex-col items-center justify-center relative overflow-hidden">
      {/* Textured background — emerald */}
      <div className="absolute inset-0" style={{ backgroundColor: "oklch(0.92 0.04 160)" }} />
      <div className="canvas-grain absolute inset-0" />

      {/* Vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: "inset 0 0 200px 60px oklch(0.22 0.06 155 / 0.10)",
          zIndex: 2,
        }}
      />

      <div className="relative z-10 flex flex-col items-center px-6 py-10 md:py-16 max-w-4xl mx-auto">
        {slide.imageSrc && (
          <button
            type="button"
            className="group relative cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 rounded-sm"
            onClick={() => onOpenLightbox?.(mediaPath(slide.imageSrc!), slide.caption)}
            aria-label={slide.imageAlt ?? "Ver dibujo en tamano completo"}
          >
            {/* Outer frame — emerald */}
            <div
              className="relative p-2 md:p-3 transition-shadow duration-500"
              style={{
                backgroundColor: "oklch(0.38 0.06 158)",
                boxShadow: "0 4px 30px oklch(0.15 0.04 155 / 0.15), 0 1px 3px oklch(0.15 0.04 155 / 0.08)",
              }}
            >
              {/* Inner mat — jade cream */}
              <div
                className="p-3 md:p-5"
                style={{
                  backgroundColor: "oklch(0.94 0.02 160)",
                  border: "1px solid oklch(0.85 0.04 160)",
                }}
              >
                {/* The artwork itself */}
                <div className="relative overflow-hidden">
                  <Image
                    src={mediaPath(slide.imageSrc)}
                    alt={slide.imageAlt ?? ""}
                    width={800}
                    height={800}
                    className="max-h-[55vh] md:max-h-[60vh] w-auto h-auto object-contain transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                    sizes="(max-width: 768px) 85vw, 700px"
                  />
                </div>
              </div>
            </div>

            {/* Expand hint on hover */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="bg-black/40 backdrop-blur-sm rounded-full p-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              </div>
            </div>
          </button>
        )}

        {/* Caption area */}
        {(slide.caption || slide.attribution) && (
          <div className="mt-6 md:mt-8 text-center max-w-lg">
            {/* Ornamental diamond divider — dusty rose */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="h-px w-8" style={{ background: "linear-gradient(90deg, transparent, oklch(0.72 0.18 350))" }} />
              <div className="h-1.5 w-1.5 rotate-45" style={{ border: "1px solid oklch(0.72 0.18 350)" }} />
              <div className="h-px w-8" style={{ background: "linear-gradient(270deg, transparent, oklch(0.72 0.18 350))" }} />
            </div>

            {slide.caption && (
              <p className="font-serif text-base md:text-lg leading-relaxed tracking-wide" style={{ color: "oklch(0.35 0.06 155)" }}>
                {slide.caption}
              </p>
            )}
            {slide.attribution && (
              <p className="mt-2 text-xs md:text-sm italic tracking-wider uppercase" style={{ color: "oklch(0.50 0.06 158)" }}>
                {slide.attribution}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify renders correctly**

Run: `cd /Volumes/Verbatim-Vi560-Media/Development/aves/purpurit/tomasa && bun run type-check`
Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add apps/tomasa/src/components/slides/artwork-slide.tsx
git commit -m "feat: update artwork slides to emerald frame with canvas grain"
```

---

### Task 7: Update Photo Slides — Emerald Caption Overlay

**Files:**
- Modify: `apps/tomasa/src/components/slides/photo-slide.tsx`

- [ ] **Step 1: Replace black/50 caption overlay with deep emerald**

In `photo-slide.tsx`, replace `bg-black/50` on line 17 with emerald:

Change:
```tsx
        <div className="absolute bottom-0 inset-x-0 z-10 bg-black/50 backdrop-blur-sm px-6 py-4">
```

To:
```tsx
        <div className="absolute bottom-0 inset-x-0 z-10 backdrop-blur-sm px-6 py-4" style={{ backgroundColor: "oklch(0.22 0.05 158 / 0.6)" }}>
```

- [ ] **Step 2: Commit**

```bash
git add apps/tomasa/src/components/slides/photo-slide.tsx
git commit -m "feat: update photo slide caption to emerald overlay"
```

---

### Task 8: Update Audio Slides — Canvas Texture + Emerald Play Button

**Files:**
- Modify: `apps/tomasa/src/components/slides/audio-slide.tsx`

- [ ] **Step 1: Rewrite audio-slide.tsx with canvas texture and emerald styling**

Replace the entire contents:

```tsx
"use client"

import type { Slide } from "@repo/utils"

export function AudioSlide({ slide }: { slide: Slide }) {
  return (
    <div className="snap-start min-h-dvh flex flex-col items-center justify-center relative overflow-hidden">
      {/* Base background */}
      <div className="absolute inset-0 bg-background" />

      {/* Canvas grain */}
      <div className="canvas-grain absolute inset-0" />

      {/* Content */}
      <div className="relative z-10 max-w-2xl flex flex-col items-center gap-8 px-6 py-12">
        {slide.text && (
          <blockquote className="font-serif text-2xl md:text-4xl text-foreground text-center leading-relaxed italic">
            {slide.text}
          </blockquote>
        )}

        <button
          type="button"
          className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-80"
          aria-label="Reproducir audio"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-7 h-7 ml-1"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>

        {slide.attribution && (
          <p className="text-sm text-muted-foreground text-center italic">
            {slide.attribution}
          </p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/tomasa/src/components/slides/audio-slide.tsx
git commit -m "feat: update audio slides with canvas texture and emerald play button"
```

---

### Task 9: Update Decade Title Slides — Emerald Gradient Overlay

**Files:**
- Modify: `apps/tomasa/src/components/slides/decade-title-slide.tsx`

- [ ] **Step 1: Replace black gradient with emerald + rose hint**

In `decade-title-slide.tsx`, replace line 15:

Change:
```tsx
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
```

To:
```tsx
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, oklch(0.18 0.06 158 / 0.75) 0%, oklch(0.18 0.06 158 / 0.2) 50%, oklch(0.30 0.08 350 / 0.1) 100%)" }} />
```

- [ ] **Step 2: Commit**

```bash
git add apps/tomasa/src/components/slides/decade-title-slide.tsx
git commit -m "feat: update decade title gradient to emerald with rose hint"
```

---

### Task 10: Update Timeline Bar — Dusty Rose Active Dot

**Files:**
- Modify: `apps/tomasa/src/components/timeline-bar.tsx`

The timeline already uses `bg-accent` for active dots, which now maps to dusty rose via the token change in Task 2. **No code changes needed** — verify visually.

- [ ] **Step 1: Verify timeline active dot is dusty rose**

Run: `bun run dev` — scroll through decades and confirm the active dot in the timeline bar is now dusty rose (not warm tan).

- [ ] **Step 2: Commit (skip if no changes)**

No commit needed — this cascaded from Task 2.

---

### Task 11: Final Verification

- [ ] **Step 1: Full visual walkthrough**

Run: `cd /Volumes/Verbatim-Vi560-Media/Development/aves/purpurit/tomasa && bun run dev`

Walk through the complete experience:
1. Entrance screen — jade cream background, emerald text
2. Each decade title — emerald gradient overlay with rose hint at top
3. Narrative slides — canvas grain, vignette, gradient, corner brackets, diamond divider
4. Artwork slides — emerald frame, jade cream mat, canvas grain, rose divider
5. Photo slides — emerald caption overlay
6. Audio slides — canvas grain, emerald play button
7. Lightbox — dark emerald backdrop with grain, museum frame + mat, caption, rose close button
8. Timeline — dusty rose active dot
9. Audio toggle — deep forest green background

- [ ] **Step 2: Build check**

Run: `cd /Volumes/Verbatim-Vi560-Media/Development/aves/purpurit/tomasa && bun run build`
Expected: Static export succeeds with no errors.

- [ ] **Step 3: Lint and type check**

Run: `cd /Volumes/Verbatim-Vi560-Media/Development/aves/purpurit/tomasa && bun run lint && bun run type-check`
Expected: No errors.

- [ ] **Step 4: Mobile viewport check**

Open dev tools, switch to mobile viewport (375px width). Verify:
- Timeline bottom bar renders correctly
- Canvas textures don't cause performance issues
- Lightbox frame scales down gracefully
- Corner brackets don't overlap content on small screens
