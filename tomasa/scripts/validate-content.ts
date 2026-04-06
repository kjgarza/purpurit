#!/usr/bin/env bun
/**
 * Content validation script for Tomasa memorial.
 * Measures real vs placeholder content, audio integration, and media integration.
 *
 * Usage: cd tomasa && bun scripts/validate-content.ts
 */

import { readFileSync, existsSync } from "fs"
import { join } from "path"

const SCRIPTS_DIR = import.meta.dir
const TOMASA_DIR = join(SCRIPTS_DIR, "..")
const MEDIA_DIR = join(TOMASA_DIR, "apps/tomasa/public/media")
const DECADES_FILE = join(TOMASA_DIR, "apps/tomasa/src/content/decades.ts")

// Known placeholder text patterns from the original AI-generated content
const PLACEHOLDER_PATTERNS = [
  "pequeño pueblo de México",
  "paredes de adobe y un patio lleno de macetas",
  "Los años cuarenta trajeron cambios",
  "Mi abuela decía que cocinar es como rezar",
  "Lo conoció en la fiesta del pueblo",
  "Duérmete mi niño, duérmete mi sol",
  "Con mucho esfuerzo, Tomasa y su esposo construyeron",
  "Para los años sesenta, la familia había crecido",
  "El secreto del mole no está en los ingredientes",
  "Los hijos empezaron a irse. Uno a la ciudad",
  "nació el primer nieto, Tomasa dijo que entendió",
  "En los ochenta, la casa de Tomasa se convirtió",
  "Mijo, en esta vida lo único que te llevas",
  "Tomasa nunca buscó ser recordada",
  "Los noventa encontraron a Tomasa más serena",
  "Su jardín se convirtió en su orgullo",
  "El mundo cambió, pero Tomasa seguía igual",
  "Tomasa vivió para ver cuatro generaciones",
  "En sus últimos años, Tomasa seguía levantándose",
  "Tomasa nos enseñó que el amor se demuestra con hechos pequeños",
]

// Read decades.ts
const content = readFileSync(DECADES_FILE, "utf-8")

// ─── 1. Content Score ──────────────────────────────────────────────────────────

// Extract all text fields from narrative and audio slides
// Match: type: "narrative" or type: "audio" blocks, then find their text field
let totalNarrativeAudio = 0
let placeholderCount = 0

// Find all slide objects and check type + text
const slideBlocks = content.split(/\{(?=\s*id:)/)
for (const block of slideBlocks) {
  const typeMatch = block.match(/type:\s*["'](narrative|audio)["']/)
  if (!typeMatch) continue

  totalNarrativeAudio++

  // Extract the text value — handles escaped quotes like \"...\"
  const textMatch = block.match(/\btext:\s*["']((?:[^"'\\]|\\.)+)["']/)
  if (!textMatch) continue

  // Unescape inner escaped quotes for pattern matching
  const text = textMatch[1].replace(/\\"/g, '"').replace(/\\'/g, "'")
  const isPlaceholder = PLACEHOLDER_PATTERNS.some((p) => text.includes(p))
  if (isPlaceholder) placeholderCount++
}

const realSlides = totalNarrativeAudio - placeholderCount
const contentScore =
  totalNarrativeAudio > 0 ? (realSlides / totalNarrativeAudio) * 100 : 0

// ─── 2. Audio Integration ──────────────────────────────────────────────────────

const audioMatches = [...content.matchAll(/audioSrc:\s*["']([^"']+)["']/g)]
const decadesWithAudio = new Set<string>()

for (const match of audioMatches) {
  const audioPath = match[1]
  const fullPath = join(MEDIA_DIR, audioPath)
  const decade = audioPath.split("/")[0]
  if (existsSync(fullPath)) {
    decadesWithAudio.add(decade)
  }
}

const TOTAL_DECADES = 9
const audioIntegration = (decadesWithAudio.size / TOTAL_DECADES) * 100

// ─── 3. Media Integration ─────────────────────────────────────────────────────

const imageMatches = [...content.matchAll(/imageSrc:\s*["']([^"']+)["']/g)]
let existingMedia = 0
const totalReferencedMedia = imageMatches.length

for (const match of imageMatches) {
  const mediaPath = match[1]
  const fullPath = join(MEDIA_DIR, mediaPath)
  if (existsSync(fullPath)) existingMedia++
}

const mediaIntegration =
  totalReferencedMedia > 0
    ? (existingMedia / totalReferencedMedia) * 100
    : 0

// ─── 4. Overall Score ─────────────────────────────────────────────────────────

const overallScore =
  contentScore * 0.5 + audioIntegration * 0.3 + mediaIntegration * 0.2

// ─── 5. Output ────────────────────────────────────────────────────────────────

console.log("─".repeat(50))
console.log("Tomasa Content Validation")
console.log("─".repeat(50))
console.log(
  `content_score        = ${contentScore.toFixed(1)}%  (${realSlides}/${totalNarrativeAudio} real slides)`
)
console.log(
  `audio_integration    = ${audioIntegration.toFixed(1)}%  (${decadesWithAudio.size}/${TOTAL_DECADES} decades with audio)`
)
console.log(
  `media_integration    = ${mediaIntegration.toFixed(1)}%  (${existingMedia}/${totalReferencedMedia} media files found)`
)
console.log("─".repeat(50))
console.log(`overall_score        = ${overallScore.toFixed(1)}`)
console.log("─".repeat(50))

if (overallScore >= 80) {
  console.log("✓ Target reached!")
} else {
  console.log(`△ Target not yet reached (need ≥ 80, have ${overallScore.toFixed(1)})`)
}

// Print overall_score on its own line for easy extraction
process.stdout.write(`\nSCORE:${overallScore.toFixed(2)}\n`)
process.exit(0)
