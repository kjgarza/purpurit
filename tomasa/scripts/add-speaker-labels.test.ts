import { describe, it, expect } from "bun:test"
import { chunkSegments, deduplicateOverlap, mergeLabels } from "./add-speaker-labels"

const seg = (id: number, text = `seg ${id}`) => ({ id, text })

describe("chunkSegments", () => {
  it("returns single chunk when segments fit", () => {
    const segs = Array.from({ length: 5 }, (_, i) => seg(i))
    const chunks = chunkSegments(segs, 60, 10)
    expect(chunks).toHaveLength(1)
    expect(chunks[0]).toHaveLength(5)
  })

  it("produces overlapping chunks for large input", () => {
    const segs = Array.from({ length: 80 }, (_, i) => seg(i))
    const chunks = chunkSegments(segs, 60, 10)
    // First chunk: segs 0-59 (60 items)
    // Second chunk: segs 50-79 (30 items, starts at 60-overlap=50)
    expect(chunks).toHaveLength(2)
    expect(chunks[0]).toHaveLength(60)
    expect(chunks[0][0].id).toBe(0)
    expect(chunks[0][59].id).toBe(59)
    // Second chunk starts 10 before next boundary
    expect(chunks[1][0].id).toBe(50)
    expect(chunks[1][chunks[1].length - 1].id).toBe(79)
  })

  it("handles exactly chunk-size segments", () => {
    const segs = Array.from({ length: 60 }, (_, i) => seg(i))
    const chunks = chunkSegments(segs, 60, 10)
    expect(chunks).toHaveLength(1)
  })

  it("handles three chunks with overlap", () => {
    const segs = Array.from({ length: 140 }, (_, i) => seg(i))
    const chunks = chunkSegments(segs, 60, 10)
    expect(chunks).toHaveLength(3)
    // Each interior chunk starts at (60-10) * chunkIndex = 50 * chunkIndex
    expect(chunks[1][0].id).toBe(50)
    expect(chunks[2][0].id).toBe(100)
  })
})

describe("deduplicateOverlap", () => {
  it("uses mid-chunk result when two chunks overlap on a segment", () => {
    // Chunk 0 covers segs 0-59, chunk 1 covers segs 50-79
    // segs 50-59 appear in both chunks
    // seg 55 is at position 55 in chunk0 (edge) and position 5 in chunk1 (mid-ish)
    // For chunk0 of size 60, distanceFromEdge = min(55, 4) = 4
    // For chunk1 of size 30, distanceFromEdge = min(5, 24) = 5
    // chunk1 wins (higher distance from edge)
    const chunkResults: Array<{ chunkStart: number; chunkSize: number; labels: Map<number, string> }> = [
      {
        chunkStart: 0,
        chunkSize: 60,
        labels: new Map(Array.from({ length: 60 }, (_, i) => [i, "Tomasa"])),
      },
      {
        chunkStart: 50,
        chunkSize: 30,
        labels: new Map(Array.from({ length: 30 }, (_, i) => [50 + i, "Interviewer"])),
      },
    ]

    const result = deduplicateOverlap(chunkResults)
    // segs 0-49: only in chunk0 → Tomasa
    expect(result.get(0)).toBe("Tomasa")
    expect(result.get(49)).toBe("Tomasa")
    // segs 50-59: conflict — chunk1 wins (seg is closer to chunk1's center)
    expect(result.get(55)).toBe("Interviewer")
    // segs 60-79: only in chunk1 → Interviewer
    expect(result.get(60)).toBe("Interviewer")
  })

  it("handles no overlap (single chunk)", () => {
    const chunkResults = [
      {
        chunkStart: 0,
        chunkSize: 5,
        labels: new Map<number, string>([[0, "Tomasa"], [1, "Interviewer"], [2, "Tomasa"]]),
      },
    ]
    const result = deduplicateOverlap(chunkResults)
    expect(result.get(0)).toBe("Tomasa")
    expect(result.get(1)).toBe("Interviewer")
  })
})

describe("mergeLabels", () => {
  it("adds speaker field to each segment", () => {
    const segments = [
      { id: 0, seek: 0, start: 0, end: 5, text: "Hola", tokens: [1, 2], temperature: 0, avg_logprob: -0.5, compression_ratio: 1.1, no_speech_prob: 0.1 },
      { id: 1, seek: 0, start: 5, end: 10, text: "Buenas", tokens: [3, 4], temperature: 0, avg_logprob: -0.4, compression_ratio: 1.0, no_speech_prob: 0.05 },
    ]
    const labels = new Map<number, string>([[0, "Interviewer"], [1, "Tomasa"]])
    const result = mergeLabels(segments, labels)
    expect(result[0].speaker).toBe("Interviewer")
    expect(result[1].speaker).toBe("Tomasa")
    // Original fields preserved
    expect(result[0].tokens).toEqual([1, 2])
    expect(result[1].start).toBe(5)
  })

  it("fills missing labels with 'unknown'", () => {
    const segments = [{ id: 0, seek: 0, start: 0, end: 5, text: "test", tokens: [], temperature: 0, avg_logprob: 0, compression_ratio: 1, no_speech_prob: 0 }]
    const labels = new Map<number, string>() // empty — no label for seg 0
    const result = mergeLabels(segments, labels)
    expect(result[0].speaker).toBe("unknown")
  })
})
