import type { Lesson } from './types'

// Every word typed must appear somewhere in the lesson's title, topic,
// hashtags, subject or age group — in any order. Trims stray spaces
// (tablet keyboards and voice typing add a trailing one) and tolerates
// lessons with missing fields instead of crashing the whole library.
export function lessonMatchesSearch(lesson: Lesson, search: string, subject: string): boolean {
  const words = search.toLowerCase().replace(/#/g, '').split(/\s+/).filter(Boolean)
  if (words.length === 0) return true
  const haystack = [lesson.title, lesson.topic, ...(lesson.hashtags ?? []), subject, lesson.ageGroup]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/#/g, '')
  return words.every(w => haystack.includes(w))
}
