import type { Lesson } from './types'

// Any word typed brings up every lesson containing it — in the title,
// topic, hashtags, subject, age group, or anywhere in the lesson text and
// questions. Words match from their start, so "frog" finds "frogs" but
// "art" doesn't find "start". Trims stray spaces and tolerates lessons
// with missing fields instead of crashing the whole library.
export function lessonMatchesSearch(lesson: Lesson, search: string, subject: string): boolean {
  const words = search.toLowerCase().replace(/#/g, '').split(/\s+/).filter(Boolean)
  if (words.length === 0) return true
  const haystack = [
    lesson.title,
    lesson.topic,
    ...(lesson.hashtags ?? []),
    subject,
    lesson.ageGroup,
    ...(lesson.hunks ?? []).flatMap(h => [
      h.text,
      h.writingPrompt,
      ...Object.values(h.writingPrompts ?? {}),
      ...(h.questions ?? []).flatMap(q => [q.question, q.answer]),
    ]),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/#/g, '')
  return words.some(w => {
    const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`(^|[^a-z0-9])${escaped}`).test(haystack)
  })
}
