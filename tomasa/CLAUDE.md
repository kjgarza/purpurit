# Tomasa

Next.js 15 monorepo project using Bun workspaces.

## Structure

```
tomasa/
├── apps/tomasa/        # Next.js 15 app (App Router)
├── packages/utils/     # @repo/utils — cn(), types, Zod schemas
├── packages/ui/        # @repo/ui — shadcn/ui component library
├── packages/tsconfig/  # @repo/tsconfig — shared TS configs
├── packages/eslint-config/ # @repo/eslint-config
└── tooling/theme.css   # Shared OKLCH design tokens
```

## Tech Stack

- **Framework**: Next.js 15 (App Router only, no Pages Router)
- **React**: 19.x (Server Components by default)
- **Runtime**: Bun 1.1+ (package manager AND runtime)
- **Language**: TypeScript 5.6+ (strict mode)
- **CSS**: Tailwind CSS 4 (configured in CSS, NO tailwind.config.ts)
- **Components**: shadcn/ui (new-york style) + Radix UI
- **Icons**: lucide-react
- **Theming**: next-themes (class-based dark mode)
- **Forms**: React Hook Form + Zod + @hookform/resolvers
- **Toasts**: sonner
- **Charts**: recharts
- **Deployment**: GitHub Pages (static export)

## Commands

```bash
bun run dev          # Start dev server
bun run build        # Build all packages then apps
bun run lint         # Lint all workspaces
bun run type-check   # Type-check all workspaces
bun test             # Run tests
```

## Code Style

- 2-space indentation
- Double quotes
- No semicolons
- `import type` for type-only imports
- kebab-case for files
- PascalCase for components
- camelCase for functions and variables
- Design tokens over hardcoded values
- `"use client"` only where needed
- Path alias: `@/*` maps to `./src/*` in apps

## Component Architecture (Three Layers)

1. **Base UI** (`packages/ui/`) — shadcn/ui components, generic, no business logic
2. **App components** (`apps/tomasa/src/components/`) — business-specific compositions
3. **Pages** (`apps/tomasa/src/app/`) — App Router pages, minimal logic

## Data/Format Separation

- **Data**: `src/content/` (TypeScript or JSON)
- **Format**: `src/components/` + `src/app/` (React components)
- Never hardcode content in page.tsx or components

## Tailwind CSS v4 (CRITICAL)

- NO `tailwind.config.ts` — everything in `globals.css`
- `@import "tailwindcss"` replaces `@tailwind base/components/utilities`
- `@plugin` directives replace `plugins: []`
- `@theme inline` maps CSS vars to Tailwind utilities
- `@source` scans monorepo packages for class usage
- `@tailwindcss/postcss` is the PostCSS plugin (no autoprefixer needed)

## Anti-patterns (NEVER do these)

- Never use `pages/` directory — App Router only
- Never install Radix UI directly — use shadcn/ui
- Never use CSS Modules or styled-components
- Never hardcode colors — use CSS custom properties
- Never create `tailwind.config.ts`
- Never use `--webpack` flag in dev script
- Never use dynamic OG image routes with static export
- Never hardcode content in pages — extract to `src/content/`
- Never use Formik or Yup — use React Hook Form + Zod
- Never use Redux — use React Context or Zustand if needed

## Adding shadcn/ui Components

```bash
cd packages/ui && bunx shadcn@latest add <component-name>
```

Then export from `packages/ui/src/index.ts`.

## GitHub Pages Deployment

- `next.config.js` uses `NEXT_PUBLIC_REPO_NAME` for basePath/assetPrefix
- All image paths must use basePath helper pattern
- Static `public/opengraph.png` (1200x630) for OG images
- Enable in repo Settings > Pages > Source > "GitHub Actions"
