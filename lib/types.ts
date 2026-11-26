export type QuestionType = 'KNOWN' | 'SEMI-OPEN' | 'PRIOR KNOWLEDGE' | 'MATH' | 'VAKT' | 'OPEN'

export interface Question {
  type: QuestionType
  question: string
  answer: string
  youtubeQuery?: string
  youtubeDescription?: string
  youtubeVideoId?: string
  youtubeVideoTitle?: string
  youtubeDuration?: string
}

export interface Hunk {
  number: number
  text: string
  questions: Question[]
  writingPrompt?: string // legacy single-prompt field — kept as a fallback, superseded by writingPrompts
  writingPrompts?: {
    beginner: string
    intermediate: string
    pro: string
  }
  imageUrl?: string
  imageAlt?: string
  /** VAKT sensory-break game shown after this hunk (see lib/brainBreaks.ts). */
  brainBreak?: BrainBreak
}

// Short sensory-break games placed between hunks. Built for spellers:
// tap-only (no dragging), big targets, no timers.
export type BrainBreak =
  | { type: 'hangman'; word: string; hint: string }
  | { type: 'match'; pairs: { a: string; aLabel: string; b: string; bLabel: string }[] }
  | { type: 'wordsearch'; words: string[]; size: number }
  | { type: 'tictactoe'; x: string; o: string }

export interface Lesson {
  id: string
  topic: string
  ageGroup: string
  title: string
  createdAt: string
  hunks: Hunk[]
  citations: string[]
  hashtags: string[]
  practitionerId?: string
  isAiGenerated?: boolean
  author?: string
  verified?: boolean
}
