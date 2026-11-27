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
  /** Short "Watch & listen" clip for sensory-rich pages (see lib/watchVideos.ts). */
  watchVideo?: { videoId: string; title: string; duration: string; description: string }
}

// Short sensory-break games placed between hunks. Built for spellers:
// tap-only (no dragging), big targets, no timers.
export type BrainBreak =
  | { type: 'hangman'; word: string; hint: string }
  | { type: 'match'; pairs: { a: string; aLabel: string; b: string; bLabel: string }[] }
  | { type: 'wordsearch'; words: string[]; size: number }
  | { type: 'tictactoe'; x: string; o: string }
  // Eye-hand (oculomotor) practice — the Ocular Motor Games library
  | EyeHandGame

export type TargetSize = 'small' | 'medium' | 'large'
/** Playful = emoji/animals; grown-up = plain shapes and letters for teens and adults. */
export type GameStyle = 'playful' | 'grownup'
export type GameSpeed = 'slow' | 'medium' | 'fast'
export type EyeHandGame =
  | { type: 'bubbles'; count: number; size: TargetSize; style?: GameStyle }
  | { type: 'followstar'; count: number; size: TargetSize; speed: GameSpeed }
  | { type: 'maze'; cells: number; mode: 'slide' | 'tap'; style?: GameStyle }
  | { type: 'leftright'; count: number; size: TargetSize; style?: GameStyle }
  | { type: 'dots'; count: number; size: TargetSize; mode: 'numbers' | 'letters' | 'alternating' }
  | { type: 'findletter'; count: number; board: 'three' | 'alphabet' | 'keyboard' }
  | { type: 'cardmatch'; pairs: number; style?: GameStyle }
  | { type: 'numbergrid'; grid: number; mode: 'numbers' | 'letters' }
  | { type: 'oddone'; grid: number; rounds: number; style?: GameStyle }
  | { type: 'cups'; cups: number; swaps: number; speed: GameSpeed; rounds: number; style?: GameStyle }
  | { type: 'findall'; grid: number; targets: number; style?: GameStyle }
  | { type: 'pattern'; grid: number; squares: number; rounds: number }
  | { type: 'spotdiff'; grid: number; rounds: number; style?: GameStyle }
  | { type: 'reachpoke'; layout: 'three' | 'alphabet' | 'keyboard'; count: number }

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
