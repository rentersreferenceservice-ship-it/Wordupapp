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
}

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
