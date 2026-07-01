import { describe, it, expect } from "bun:test"
import {
  flagSegments,
  buildContext,
  extractFilledText,
  type LabeledSegment,
} from "./fill-transcript-gaps"

const seg = (over: Partial<LabeledSegment> = {}): LabeledSegment => ({
  id: 0,
  seek: 0,
  start: 0,
  end: 1,
  text: "hola",
  tokens: [],
  temperature: 0,
  avg_logprob: -0.3,
  compression_ratio: 1.5,
  no_speech_prob: 0.1,
  speaker: "Tomasa",
  ...over,
})

describe("flagSegments", () => {
  it("does not flag a clean segment", () => {
    expect(flagSegments([seg()])).toEqual([])
  })

  it("flags low avg_logprob", () => {
    expect(flagSegments([seg({ avg_logprob: -0.6 })])).toEqual([0])
  })

  it("flags high no_speech_prob", () => {
    expect(flagSegments([seg({ no_speech_prob: 0.7 })])).toEqual([0])
  })

  it("flags high compression_ratio", () => {
    expect(flagSegments([seg({ compression_ratio: 2.5 })])).toEqual([0])
  })

  it("flags literal [inaudible] case-insensitively", () => {
    expect(flagSegments([seg({ text: "se fue a [INAUDIBLE] el rancho" })])).toEqual([0])
  })

  it("counts a multi-threshold segment once and returns indices", () => {
    const segs = [seg(), seg({ avg_logprob: -0.6, no_speech_prob: 0.9 }), seg()]
    expect(flagSegments(segs)).toEqual([1])
  })
})

describe("buildContext", () => {
  const segs = Array.from({ length: 10 }, (_, i) =>
    seg({ id: i, text: `line ${i}`, speaker: i % 2 === 0 ? "Tomasa" : "Interviewer" })
  )

  it("includes radius neighbors on both sides and marks the target", () => {
    const out = buildContext(segs, 5, 2)
    const lines = out.split("\n")
    expect(lines).toHaveLength(5) // 3,4,5,6,7
    expect(lines[0]).toBe("Interviewer: line 3")
    expect(lines[2]).toBe(">> Interviewer: line 5")
    expect(lines[4]).toBe("Interviewer: line 7")
  })

  it("clamps at the start of the array", () => {
    const out = buildContext(segs, 0, 3)
    const lines = out.split("\n")
    expect(lines).toHaveLength(4) // 0,1,2,3
    expect(lines[0]).toBe(">> Tomasa: line 0")
  })

  it("clamps at the end of the array", () => {
    const out = buildContext(segs, 9, 3)
    const lines = out.split("\n")
    expect(lines).toHaveLength(4) // 6,7,8,9
    expect(lines[3]).toBe(">> Interviewer: line 9")
  })

  it("defaults radius to 3", () => {
    const out = buildContext(segs, 5)
    expect(out.split("\n")).toHaveLength(7) // 2..8
  })
})

describe("extractFilledText", () => {
  it("parses a bare JSON object", () => {
    expect(extractFilledText('{"text": "¿De qué son?"}')).toBe("¿De qué son?")
  })

  it("parses JSON wrapped in markdown fences", () => {
    expect(extractFilledText('```json\n{"text": "El caballo"}\n```')).toBe("El caballo")
  })

  it("trims the extracted text", () => {
    expect(extractFilledText('{"text": "  El caballo  "}')).toBe("El caballo")
  })

  it("throws on non-JSON commentary (caller falls back to original)", () => {
    expect(() => extractFilledText("Segment fine, return as-is")).toThrow()
  })

  it("throws when 'text' field is missing or non-string", () => {
    expect(() => extractFilledText('{"corrected": "x"}')).toThrow()
  })
})
