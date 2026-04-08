export type QuestionType = 'KNOWN' | 'SEMI-OPEN' | 'PRIOR KNOWLEDGE' | 'MATH' | 'VAKT' | 'OPEN'

export interface Question {
  type: QuestionType
  question: string
  answer: string
}

export interface Hunk {
  number: number
  text: string
  questions: Question[]
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
}
