import { describe, it, expect } from "bun:test"
import {
  parseTranscriptSpec,
  parseStoryArgs,
  selectByRange,
  groupIntoRuns,
  formatRuns,
  formatBeats,
  yamlQuote,
  buildFrontmatter,
  extractDraft,
  extractSelectedIds,
} from "./generate-story"
import type { LabeledSegment } from "./generate-story"

const seg = (over: Partial<LabeledSegment> = {}): LabeledSegment => ({
  id: 0,
  seek: 0,
  start: 0,
  end: 1,
  text: " hola",
  tokens: [],
  temperature: 0,
  avg_logprob: -0.3,
  compression_ratio: 1.5,
  no_speech_prob: 0.1,
  speaker: "Tomasa",
  ...over,
})

describe("parseTranscriptSpec", () => {
  it("parses a bare name", () => {
    expect(parseTranscriptSpec("tomasa_2025-11-16_1704")).toEqual({
      name: "tomasa_2025-11-16_1704",
    })
  })

  it("parses a name with a segment range", () => {
    expect(parseTranscriptSpec("tomasa_2025-11-16_1704:395-428")).toEqual({
      name: "tomasa_2025-11-16_1704",
      range: { start: 395, end: 428 },
    })
  })

  it("rejects a malformed range", () => {
    expect(() => parseTranscriptSpec("foo:395-")).toThrow("Invalid --transcript spec")
  })

  it("rejects an inverted range", () => {
    expect(() => parseTranscriptSpec("foo:428-395")).toThrow("start 428 > end 395")
  })

  it.each([
    ["../secrets"],
    ["../secrets:1-5"],
    ["a/b"],
    ["a\\b:1-5"],
    ["..:1-5"],
    ["."],
  ])("rejects path-like transcript name %s", (spec) => {
    expect(() => parseTranscriptSpec(spec)).toThrow(/Invalid/)
  })
})

describe("parseStoryArgs", () => {
  const base = [
    "--transcript",
    "tomasa_2025-11-16_1704:395-428",
    "--story",
    "poor-child",
    "--title",
    "Una niña pobre",
    "--decade",
    "1930s",
  ]

  it("parses a full range-mode invocation", () => {
    const args = parseStoryArgs(base)
    expect(args.story).toBe("poor-child")
    expect(args.title).toBe("Una niña pobre")
    expect(args.decade).toBe("1930s")
    expect(args.force).toBe(false)
    expect(args.transcripts).toHaveLength(1)
    expect(args.transcripts[0].range).toEqual({ start: 395, end: 428 })
  })

  it("accepts multiple transcripts and --force", () => {
    const args = parseStoryArgs([
      ...base,
      "--transcript",
      "tomasa_2025-11-20_0805:10-40",
      "--force",
    ])
    expect(args.transcripts).toHaveLength(2)
    expect(args.force).toBe(true)
  })

  it("allows a rangeless transcript when --theme is given", () => {
    const args = parseStoryArgs([
      "--transcript",
      "tomasa_2025-11-16_1704",
      "--theme",
      "niña pobre",
      "--story",
      "poor-child",
      "--title",
      "Una niña pobre",
      "--decade",
      "1930s",
    ])
    expect(args.theme).toBe("niña pobre")
    expect(args.transcripts[0].range).toBeUndefined()
  })

  it("rejects a rangeless transcript without --theme", () => {
    expect(() =>
      parseStoryArgs([
        "--transcript",
        "tomasa_2025-11-16_1704",
        "--story",
        "x",
        "--title",
        "X",
        "--decade",
        "1930s",
      ])
    ).toThrow("No beat selection")
  })

  it.each([["--story"], ["--title"], ["--decade"]])(
    "rejects when %s is missing",
    (flag) => {
      const argv = base.filter((_, i) => base[i] !== flag && base[i - 1] !== flag)
      expect(() => parseStoryArgs(argv)).toThrow(`${flag} is required`)
    }
  )

  it("rejects unknown flags", () => {
    expect(() => parseStoryArgs([...base, "--bogus"])).toThrow("Unknown argument")
  })

  it.each([["../decades"], ["a/b"], ["Poor-Child"], ["poor child"], ["poor--child"], ["poor-child-"]])(
    "rejects non-kebab-case / path-like --story %s",
    (story) => {
      const argv = base.map((v, i) => (base[i - 1] === "--story" ? story : v))
      expect(() => parseStoryArgs(argv)).toThrow('Invalid --story')
    }
  )
})

describe("selectByRange", () => {
  const segs = Array.from({ length: 10 }, (_, i) => seg({ id: i }))

  it("returns segments inside the inclusive range", () => {
    const out = selectByRange(segs, { start: 3, end: 5 })
    expect(out.map((s) => s.id)).toEqual([3, 4, 5])
  })

  it("returns empty for a range outside the transcript", () => {
    expect(selectByRange(segs, { start: 100, end: 200 })).toEqual([])
  })
})

describe("groupIntoRuns", () => {
  it("returns empty for no ids", () => {
    expect(groupIntoRuns([])).toEqual([])
  })

  it("groups contiguous ids into one run", () => {
    expect(groupIntoRuns([3, 4, 5])).toEqual([{ start: 3, end: 5 }])
  })

  it("bridges gaps within the tolerance", () => {
    // gap of 2 (ids 5,6 missing) is bridged with default tolerance 2
    expect(groupIntoRuns([3, 4, 7])).toEqual([{ start: 3, end: 7 }])
  })

  it("splits runs when the gap exceeds the tolerance", () => {
    expect(groupIntoRuns([3, 4, 8])).toEqual([
      { start: 3, end: 4 },
      { start: 8, end: 8 },
    ])
  })

  it("sorts and deduplicates ids", () => {
    expect(groupIntoRuns([5, 3, 4, 4])).toEqual([{ start: 3, end: 5 }])
  })
})

describe("formatRuns", () => {
  it("formats ranges and collapses single-segment runs", () => {
    expect(
      formatRuns([
        { start: 12, end: 40 },
        { start: 88, end: 88 },
      ])
    ).toBe("12-40, 88")
  })
})

describe("formatBeats", () => {
  it("emits one trimmed line per beat", () => {
    const beats = [
      seg({ id: 1, speaker: "Interviewer", text: " ¿Y el rancho? " }),
      seg({ id: 2, text: " Éramos felices. " }),
    ]
    expect(formatBeats(beats)).toBe(
      "1 | Interviewer | ¿Y el rancho?\n2 | Tomasa | Éramos felices."
    )
  })
})

describe("yamlQuote", () => {
  it("escapes quotes and backslashes", () => {
    expect(yamlQuote('dijo "mijo" \\ ya')).toBe('"dijo \\"mijo\\" \\\\ ya"')
  })

  it("escapes newlines, carriage returns, and tabs", () => {
    expect(yamlQuote("linea1\nlinea2\r\ttab")).toBe('"linea1\\nlinea2\\r\\ttab"')
  })
})

describe("buildFrontmatter", () => {
  const meta = {
    story: "poor-child",
    title: "Una niña pobre",
    decade: "1930s",
    generated: "2026-07-01",
  }
  const sources = [{ transcript: "tomasa_2025-11-16_1704", segments: "395-428" }]

  it("emits the full draft-v1 shape with sources and open questions", () => {
    const fm = buildFrontmatter(meta, sources, "La dignidad en la pobreza", [
      "¿Qué edad tenía exactamente?",
    ])
    expect(fm).toBe(
      [
        "---",
        "story: poor-child",
        'title: "Una niña pobre"',
        "decade: 1930s",
        "status: draft-v1",
        "generated: 2026-07-01",
        "sources:",
        "  - transcript: tomasa_2025-11-16_1704",
        '    segments: "395-428"',
        'emotional-spine: "La dignidad en la pobreza"',
        "open-questions:",
        '  - "¿Qué edad tenía exactamente?"',
        "voice-check: pending",
        "---",
      ].join("\n")
    )
  })

  it("emits an empty list when there are no open questions", () => {
    const fm = buildFrontmatter(meta, sources, "spine", [])
    expect(fm).toContain("open-questions: []")
  })
})

describe("extractDraft", () => {
  const valid = JSON.stringify({
    body: "Nosotros en el rancho...",
    emotionalSpine: "Felicidad sin nada",
    openQuestions: ["¿Qué año?"],
  })

  it("parses a plain JSON response", () => {
    const draft = extractDraft(valid)
    expect(draft.body).toBe("Nosotros en el rancho...")
    expect(draft.emotionalSpine).toBe("Felicidad sin nada")
    expect(draft.openQuestions).toEqual(["¿Qué año?"])
  })

  it("strips markdown fences with CRLF and uppercase tags", () => {
    const draft = extractDraft("```JSON\r\n" + valid + "\r\n```")
    expect(draft.body).toBe("Nosotros en el rancho...")
  })

  it("defaults openQuestions to [] and drops non-strings", () => {
    const draft = extractDraft(
      JSON.stringify({ body: "x", emotionalSpine: "y", openQuestions: [1, "ok"] })
    )
    expect(draft.openQuestions).toEqual(["ok"])
    expect(
      extractDraft(JSON.stringify({ body: "x", emotionalSpine: "y" })).openQuestions
    ).toEqual([])
  })

  it("throws when body is missing or empty", () => {
    expect(() => extractDraft(JSON.stringify({ emotionalSpine: "y" }))).toThrow("body")
    expect(() =>
      extractDraft(JSON.stringify({ body: "  ", emotionalSpine: "y" }))
    ).toThrow("body")
  })

  it("throws when emotionalSpine is missing", () => {
    expect(() => extractDraft(JSON.stringify({ body: "x" }))).toThrow("emotionalSpine")
  })
})

describe("extractSelectedIds", () => {
  it("parses a plain id array", () => {
    expect(extractSelectedIds("[395, 396, 397]")).toEqual([395, 396, 397])
  })

  it("strips fences and drops non-integer entries", () => {
    expect(extractSelectedIds('```json\n[1, "2", 3.5, 4]\n```')).toEqual([1, 4])
  })

  it("throws on a non-array response", () => {
    expect(() => extractSelectedIds('{"ids": [1]}')).toThrow("not a JSON array")
  })
})
