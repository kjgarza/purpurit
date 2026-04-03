// Shared type definitions — add project-specific types here
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }
export type Prettify<T> = { [K in keyof T]: T[K] } & {}

export type SlideType = "decade-title" | "photo" | "artwork" | "audio" | "narrative"

export interface Slide {
  id: string
  type: SlideType
  title?: string
  subtitle?: string
  imageSrc?: string
  imageAlt?: string
  caption?: string
  text?: string
  audioSrc?: string
  audioTranscript?: string
  attribution?: string
}

export interface Decade {
  id: string
  label: string
  year: number
  coverImage: string
  coverImageAlt: string
  ambientAudioSrc?: string
  slides: Slide[]
}

export type ReactionType = "heart" | "pray" | "flower" | "candle" | "star"

export type ReactionCounts = Record<ReactionType, number>
