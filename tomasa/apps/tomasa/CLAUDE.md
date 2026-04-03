# Tomasa App

Next.js 15 application within the tomasa monorepo.

## Dev Server

```bash
bun run dev    # Starts on http://localhost:3000
```

## Key Directories

- `src/app/` — App Router pages and layouts
- `src/components/` — Application-specific components
- `src/content/` — Content data (separate from presentation)
- `public/` — Static assets (opengraph.png, icons)

## Environment Variables

- `NEXT_PUBLIC_REPO_NAME` — Set by GitHub Actions for Pages deployment (basePath/assetPrefix)

## Deployment

- Target: GitHub Pages via static export (`output: "export"`)
- Workflow: `.github/workflows/deploy-pages.yml`
- Build artifact: `apps/tomasa/out/`

## basePath Pattern

```tsx
const basePath = process.env.NEXT_PUBLIC_REPO_NAME
  ? `/${process.env.NEXT_PUBLIC_REPO_NAME}`
  : ""

<Image src={`${basePath}/image.png`} alt="..." width={100} height={100} />
```

## Imports

- `@/*` → `./src/*` (path alias)
- `@repo/ui` → `packages/ui` (workspace)
- `@repo/utils` → `packages/utils` (workspace)
