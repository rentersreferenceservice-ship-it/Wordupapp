import type { Lesson } from './types'

// Any word typed brings up every lesson with that word in its title.
// Words match from their start, so "frog" finds "Frogs" but "art" doesn't
// find "Start". Trims stray spaces and tolerates a missing title instead
// of crashing the whole library.
export function lessonMatchesSearch(lesson: Lesson, search: string): boolean {
  const words = search.toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return true
  const title = (lesson.title ?? '').toLowerCase()
  return words.some(w => {
    const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`(^|[^a-z0-9])${escaped}`).test(title)
  })
}
