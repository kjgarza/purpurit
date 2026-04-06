#!/usr/bin/env bun
/**
 * Transcribe audio files using OpenAI Whisper API with timestamps.
 * Caches results to avoid repeat API calls.
 *
 * Usage: bun scripts/transcribe-with-timestamps.ts
 */

import OpenAI from "openai"
import { createReadStream, writeFileSync, readFileSync, existsSync, mkdirSync } from "fs"
import { join } from "path"

const TOMASA_DIR = join(import.meta.dir, "..")
const DATA_DIR = join(TOMASA_DIR, "..", "data")
const CACHE_DIR = join(DATA_DIR, "processed-transcripts")

if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true })

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Files to transcribe (only the ones with good interview content)
const FILES = [
  {
    id: "sunday-17-04",
    path: join(DATA_DIR, "Tommy Sunday-5-PM", "Tommy - Sunday at 17-04.m4a"),
    cache: join(CACHE_DIR, "sunday-17-04.json"),
  },
  {
    id: "sunday-22-08",
    path: join(DATA_DIR, "Tommy-02-Sunday-at-2208", "Sunday-at-22-08.m4a"),
    cache: join(CACHE_DIR, "sunday-22-08.json"),
  },
  {
    id: "wednesday-17-57",
    path: join(DATA_DIR, "Tommy Wednesday-5-57", "Tommy - Wednesday at 17-57.m4a"),
    cache: join(CACHE_DIR, "wednesday-17-57.json"),
  },
]

for (const file of FILES) {
  if (existsSync(file.cache)) {
    console.log(`✓ Already cached: ${file.id}`)
    continue
  }

  if (!existsSync(file.path)) {
    console.log(`✗ File not found: ${file.path}`)
    continue
  }

  console.log(`Transcribing ${file.id} (this may take a minute)...`)
  try {
    const response = await openai.audio.transcriptions.create({
      file: createReadStream(file.path) as any,
      model: "whisper-1",
      language: "es",
      response_format: "verbose_json",
      timestamp_granularities: ["segment"],
    })

    writeFileSync(file.cache, JSON.stringify(response, null, 2))
    console.log(`✓ Transcribed and cached: ${file.id} (${response.segments?.length ?? 0} segments)`)
  } catch (err) {
    console.error(`✗ Error transcribing ${file.id}:`, err)
  }
}

console.log("\nDone. Cached files in:", CACHE_DIR)
