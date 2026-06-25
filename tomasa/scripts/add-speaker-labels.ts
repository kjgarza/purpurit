#!/usr/bin/env bun
/**
 * Add speaker labels to all processed transcript JSONs using Claude.
 * Writes labeled copies to data/labeled-transcripts/.
 *
 * Usage: bun scripts/add-speaker-labels.ts
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type Speaker = "Tomasa" | "Interviewer" | "unknown"

export interface MinSegment {
  id: number
  text: string
}

export interface RawSegment {
  id: number
  seek: number
  start: number
  end: number
  text: string
  tokens: number[]
  temperature: number
  avg_logprob: number
  compression_ratio: number
  no_speech_prob: number
}

export interface LabeledSegment extends RawSegment {
  speaker: Speaker
}

export interface ChunkResult {
  chunkStart: number
  chunkSize: number
  labels: Map<number, Speaker>
}

// ─── Pure Helpers (exported for testing) ─────────────────────────────────────

/**
 * Split segments into overlapping chunks.
 * Each chunk starts at: chunkIndex * (chunkSize - overlap)
 */
export function chunkSegments(
  segments: MinSegment[],
  chunkSize: number,
  overlap: number
): MinSegment[][] {
  if (segments.length <= chunkSize) return [segments]

  const step = chunkSize - overlap
  const chunks: MinSegment[][] = []

  for (let start = 0; start < segments.length; start += step) {
    const chunk = segments.slice(start, start + chunkSize)
    chunks.push(chunk)
    if (start + chunkSize >= segments.length) break
  }

  return chunks
}

/**
 * Merge per-chunk label maps into a single map.
 * When the same segment ID appears in multiple chunks, the chunk where
 * the segment is farthest from either edge wins.
 */
export function deduplicateOverlap(chunks: ChunkResult[]): Map<number, Speaker> {
  // Track: segId → { speaker, distanceFromEdge }
  const best = new Map<number, { speaker: Speaker; dist: number }>()

  for (const { chunkStart, chunkSize, labels } of chunks) {
    for (const [segId, speaker] of labels) {
      const posInChunk = segId - chunkStart
      const distFromEdge = Math.min(posInChunk, chunkSize - 1 - posInChunk)
      const current = best.get(segId)
      if (!current || distFromEdge > current.dist) {
        best.set(segId, { speaker, dist: distFromEdge })
      }
    }
  }

  return new Map([...best.entries()].map(([id, { speaker }]) => [id, speaker]))
}

/**
 * Merge speaker labels back into original full segments.
 * Segments missing from the label map get "unknown".
 */
export function mergeLabels(
  segments: RawSegment[],
  labels: Map<number, Speaker>
): LabeledSegment[] {
  return segments.map((seg) => ({
    ...seg,
    speaker: labels.get(seg.id) ?? "unknown",
  }))
}
