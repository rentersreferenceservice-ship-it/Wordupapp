'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { Lesson } from '@/lib/types'

const SUBJECT_KEYWORDS: Record<string, string[]> = {
  Science:        ['science', 'biology', 'chemistry', 'physics', 'astronomy', 'space', 'nature', 'earth', 'nasa', 'artemis', 'moon', 'planet', 'animal', 'plant', 'photosynthesis', 'ecology', 'environment'],
  History:        ['history', 'american', 'world', 'civil', 'revolution', 'war', 'ancient', 'colonial', 'president', 'constitution', 'government', 'democracy'],
  Math:           ['math', 'mathematics', 'geometry', 'algebra', 'numbers', 'counting', 'fraction', 'addition', 'subtraction', 'multiplication'],
  'Language Arts':['writing', 'reading', 'grammar', 'paragraph', 'literature', 'story', 'poetry', 'sentence', 'vocabulary', 'spelling'],
  'Social Emotional': ['emotion', 'feeling', 'sel', 'mental', 'social', 'friendship', 'kindness', 'empathy', 'selfcare', 'anxiety', 'confidence'],
  Health:         ['health', 'nutrition', 'fitness', 'body', 'food', 'exercise', 'hygiene', 'brain', 'sleep'],
  Technology:     ['technology', 'computer', 'coding', 'robot', 'internet', 'digital', 'stem', 'engineering'],
  Arts:           ['art', 'music', 'dance', 'theater', 'creative', 'drawing', 'painting', 'drama'],
}

function detectSubject(lesson: Lesson): string {
  const searchText = [
    lesson.title,
    lesson.topic,
    ...(lesson.hashtags ?? []),
  ].join(' ').toLowerCase().replace(/#/g, '')

  for (const [subject, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
    if (keywords.some(k => searchText.includes(k))) return subject
  }
  return 'Other'
}

const AGE_GROUPS = [
  'All Ages',
  'Young Children (ages 6–8)',
  'Children (ages 9–11)',
  'Tweens (ages 12–14)',
  'Teens (ages 15–17)',
  'Adults (18+)',
]

const SUBJECTS = ['All Subjects', ...Object.keys(SUBJECT_KEYWORDS), 'Other']

export default function LessonBrowser({ lessons }: { lessons: Lesson[] }) {
  const [ageFilter, setAgeFilter] = useState('All Ages')
  const [subjectFilter, setSubjectFilter] = useState('All Subjects')

  // Build a lesson number per subject+ageGroup combo (oldest first = #1)
  const lessonNumbers = useMemo(() => {
    const sorted = [...lessons].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    const counters: Record<string, number> = {}
    const numbers: Record<string, number> = {}
    for (const lesson of sorted) {
      const key = `${detectSubject(lesson)}|${lesson.ageGroup}`
      counters[key] = (counters[key] ?? 0) + 1
      numbers[lesson.id] = counters[key]
    }
    return numbers
  }, [lessons])

  const filtered = useMemo(() => {
    return lessons.filter(lesson => {
      const ageMatch = ageFilter === 'All Ages' || lesson.ageGroup === ageFilter
      const subjectMatch = subjectFilter === 'All Subjects' || detectSubject(lesson) === subjectFilter
      return ageMatch && subjectMatch
    })
  }, [lessons, ageFilter, subjectFilter])

  return (
    <main className="relative z-10 min-h-screen px-4 py-10 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6 bg-white border-4 border-gray-300 rounded-xl px-5 py-4">
        <div>
          <Link href="/" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors mb-3">← Generate Lesson</Link>
          <h1 className="text-2xl font-bold text-gray-900">Saved Lessons</h1>
          <p className="text-sm text-gray-500 mt-0.5">{lessons.length} lesson{lessons.length !== 1 ? 's' : ''} saved</p>
        </div>
        <Link
          href="/"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + New Lesson
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <select
          value={ageFilter}
          onChange={e => setAgeFilter(e.target.value)}
          className="border-2 border-yellow-400 rounded-lg px-3 py-2 text-sm bg-yellow-300 font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 cursor-pointer"
        >
          {AGE_GROUPS.map(a => <option key={a}>{a}</option>)}
        </select>
        <select
          value={subjectFilter}
          onChange={e => setSubjectFilter(e.target.value)}
          className="border-2 border-yellow-400 rounded-lg px-3 py-2 text-sm bg-yellow-300 font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 cursor-pointer"
        >
          {SUBJECTS.map(s => <option key={s}>{s}</option>)}
        </select>
        {(ageFilter !== 'All Ages' || subjectFilter !== 'All Subjects') && (
          <button
            onClick={() => { setAgeFilter('All Ages'); setSubjectFilter('All Subjects') }}
            className="text-sm text-gray-400 hover:text-gray-700 underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {lessons.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">No lessons yet.</p>
          <Link href="/" className="text-blue-600 text-sm hover:underline mt-2 inline-block">Generate your first lesson</Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>No lessons match these filters.</p>
          <button onClick={() => { setAgeFilter('All Ages'); setSubjectFilter('All Subjects') }} className="text-blue-600 text-sm hover:underline mt-2">Clear filters</button>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map(lesson => (
            <li key={lesson.id}>
              <Link
                href={`/lessons/${lesson.id}`}
                className="block bg-white border-4 border-gray-300 rounded-xl px-5 py-4 hover:border-blue-500 hover:shadow-md transition-all"
              >
                <div className="font-medium text-gray-900">{lesson.title}</div>
                <div className="text-sm text-gray-500 mt-0.5 flex gap-2 flex-wrap items-center">
                  <span className="font-semibold text-blue-600">#{lessonNumbers[lesson.id]}</span>
                  <span>·</span>
                  <span>{lesson.ageGroup}</span>
                  <span>·</span>
                  <span>{detectSubject(lesson)}</span>
                  <span>·</span>
                  <span>{new Date(lesson.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
