#!/usr/bin/env bun
/**
 * Normalize transcript filenames to a canonical scheme: tomasa_YYYY-MM-DD_HHMM.
 *
 * Renames across all parallel locations (processed/labeled JSONs, source dirs,
 * zips) so they stay aligned. Dry-run by default; pass --apply to execute.
 *
 * Usage:
 *   bun scripts/normalize-filenames.ts          # dry-run (prints old → new)
 *   bun scripts/normalize-filenames.ts --apply  # perform renames
 *
 * Date provenance (confirmed with user):
 *   - 2024-10-06 Sundays: zip mtime = Sun Oct 6 2024 (reliable)
 *   - 2025-11-20 Tomasa:  day from zip name, year 2025 (zip mtime is re-zip date)
 *   - 2025-10-04 Tommy:   zip mtime 2025-10-04 used as approximate (recording
 *                         date unknown; note: that calendar day is a Saturday)
 */

import { existsSync, renameSync, statSync } from "fs"
import { join } from "path"

interface Recording {
  canon: string // canonical base name (no extension)
  json: string // base name in processed-/labeled-transcripts (no .json)
  zip: string // zip base name (no .zip)
  dir: string // extracted source dir name
}

const RECORDINGS: Recording[] = [
  { canon: "tomasa_2024-10-06_2132", json: "sunday-21-32", zip: "Sunday at 21:32", dir: "tommy-01-Sunday" },
  { canon: "tomasa_2024-10-06_2208", json: "sunday-22-08", zip: "Sunday at 22:08", dir: "Tommy-02-Sunday-at-2208" },
  { canon: "tomasa_2025-10-04_1704", json: "sunday-17-04", zip: "Tommy Sunday 5 PM", dir: "Tommy Sunday-5-PM" },
  { canon: "tomasa_2025-10-04_1757", json: "wednesday-17-57", zip: "Tommy Wednesday 5-57", dir: "Tommy Wednesday-5-57" },
  { canon: "tomasa_2025-11-20_0805", json: "tomasa-nov20-0805", zip: "tomasa-Nov-20-at-08-05", dir: "tomasa-Nov-20-at-08-05" },
  { canon: "tomasa_2025-11-20_1312", json: "tomasa-nov20-1312", zip: "tomasa-Nov-20-at-13-12", dir: "tomasa-Nov-20-at-13-12" },
  { canon: "tomasa_2025-11-20_1336", json: "tomasa-nov20-1336", zip: "tomasa-Nov-20-at-13-36", dir: "tomasa-Nov-20-at-13-36" },
]

interface RenameOp {
  from: string
  to: string
}

function buildOps(dataDir: string): RenameOp[] {
  const ops: RenameOp[] = []

  for (const rec of RECORDINGS) {
    // JSON transcripts (processed + labeled)
    for (const sub of ["processed-transcripts", "labeled-transcripts"]) {
      ops.push({
        from: join(dataDir, sub, `${rec.json}.json`),
        to: join(dataDir, sub, `${rec.canon}.json`),
      })
    }
    // zip archive
    ops.push({ from: join(dataDir, `${rec.zip}.zip`), to: join(dataDir, `${rec.canon}.zip`) })
    // extracted source dir
    ops.push({ from: join(dataDir, rec.dir), to: join(dataDir, rec.canon) })
  }

  return ops
}

if (import.meta.main) {
  const apply = process.argv.includes("--apply")
  const dataDir = join(import.meta.dir, "..", "..", "data")

  const ops = buildOps(dataDir)

  let renamable = 0
  let missing = 0
  let collisions = 0

  console.log(apply ? "Applying renames...\n" : "DRY RUN (pass --apply to execute)\n")

  for (const { from, to } of ops) {
    const rel = (p: string) => p.slice(dataDir.length + 1)

    if (!existsSync(from)) {
      missing++
      console.log(`  ⊘ skip   ${rel(from)}  (source missing)`)
      continue
    }
    if (existsSync(to)) {
      collisions++
      console.log(`  ✗ COLLIDE ${rel(from)} → ${rel(to)}  (dest exists)`)
      continue
    }

    renamable++
    const kind = statSync(from).isDirectory() ? "dir " : "file"
    console.log(`  → ${kind}   ${rel(from)} → ${rel(to)}`)
    if (apply) renameSync(from, to)
  }

  console.log(
    `\n${apply ? "Renamed" : "Would rename"}: ${renamable} | missing: ${missing} | collisions: ${collisions}`
  )
  if (collisions > 0) {
    console.error("\n⚠ Collisions detected — resolve before applying.")
    process.exit(1)
  }
}
