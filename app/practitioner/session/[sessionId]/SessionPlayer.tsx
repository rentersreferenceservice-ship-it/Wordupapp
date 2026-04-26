'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Lesson, QuestionType } from '@/lib/types'

const QUESTION_COLORS: Record<QuestionType, string> = {
  KNOWN: '#15803d',
  'SEMI-OPEN': '#f97316',
  'PRIOR KNOWLEDGE': '#2563eb',
  MATH: '#7e22ce',
  VAKT: '#dc2626',
  OPEN: '#db2777',
}

function extractKeywords(text: string): string[] {
  const matches = text.match(/\b[A-Z][A-Z\s\-']{1,}[A-Z]\b/g) ?? []
  const unique: string[] = []
  for (const m of matches) {
    const word = m.trim()
    if (word.length >= 2 && !unique.includes(word)) unique.push(word)
  }
  return unique
}

interface QuestionCapture {
  questionText: string
  questionType: QuestionType
  expectedAnswer: string
  capturedAnswer: string
}

interface KeywordCapture {
  keyword: string
  misspokeCount: number
}

interface HunkCapture {
  keywords: KeywordCapture[]
  questions: QuestionCapture[]
}

export default function SessionPlayer({ sessionId, studentName, sessionDate, lesson }: {
  sessionId: string
  studentName: string
  sessionDate: string
  lesson: Lesson
}) {
  const router = useRouter()
  const [currentHunk, setCurrentHunk] = useState(0)
  const [saving, setSaving] = useState(false)
  const [captures, setCaptures] = useState<HunkCapture[]>(() =>
    lesson.hunks.map(hunk => ({
      keywords: extractKeywords(hunk.text).map(k => ({ keyword: k, misspokeCount: 0 })),
      questions: hunk.questions.map(q => ({
        questionText: q.question,
        questionType: q.type,
        expectedAnswer: q.answer ?? '',
        capturedAnswer: '',
      })),
    }))
  )

  const hunk = lesson.hunks[currentHunk]
  const capture = captures[currentHunk]
  const isLast = currentHunk === lesson.hunks.length - 1

  function updateMisspoke(keywordIdx: number, delta: number) {
    setCaptures(prev => {
      const next = [...prev]
      const kws = [...next[currentHunk].keywords]
      kws[keywordIdx] = { ...kws[keywordIdx], misspokeCount: Math.max(0, kws[keywordIdx].misspokeCount + delta) }
      next[currentHunk] = { ...next[currentHunk], keywords: kws }
      return next
    })
  }

  function setCapturedAnswer(questionIdx: number, answer: string) {
    setCaptures(prev => {
      const next = [...prev]
      const qs = [...next[currentHunk].questions]
      qs[questionIdx] = { ...qs[questionIdx], capturedAnswer: answer }
      next[currentHunk] = { ...next[currentHunk], questions: qs }
      return next
    })
  }

  async function handleComplete() {
    setSaving(true)
    const responses = captures.flatMap((hunkCapture, hunkIdx) => [
      ...hunkCapture.keywords.map(k => ({
        hunkNumber: hunkIdx + 1,
        keyword: k.keyword,
        misspokeCount: k.misspokeCount,
        questionType: 'KEYWORD',
        questionText: `Spell: ${k.keyword}`,
        expectedAnswer: k.keyword,
        capturedAnswer: '',
      })),
      ...hunkCapture.questions.map(q => ({
        hunkNumber: hunkIdx + 1,
        questionType: q.questionType,
        questionText: q.questionText,
        expectedAnswer: q.expectedAnswer,
        capturedAnswer: q.capturedAnswer,
      })),
    ])

    await fetch(`/api/practitioner/sessions/${sessionId}/responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ responses }),
    })

    router.push(`/practitioner/transcript/${sessionId}`)
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Session</p>
            <p className="font-bold text-gray-900 text-lg">{studentName}</p>
            <p className="text-sm text-gray-500">{lesson.title}</p>
            <p className="text-xs text-gray-400">{new Date(sessionDate + 'T00:00:00').toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Hunk</p>
            <p className="text-3xl font-bold text-blue-600">{currentHunk + 1}</p>
            <p className="text-xs text-gray-400">of {lesson.hunks.length}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${((currentHunk + 1) / lesson.hunks.length) * 100}%` }} />
        </div>

        {/* Lesson content card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4 font-[Arial,sans-serif]">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Hunk {hunk.number}</p>

          {/* Image */}
          {hunk.imageUrl && (
            <img src={hunk.imageUrl} alt={hunk.imageAlt || ''} className="w-full h-48 object-cover rounded-xl mb-4" />
          )}

          {/* Hunk text */}
          <p className="text-gray-900 leading-relaxed mb-5">{hunk.text}</p>

          {/* Keywords inline */}
          {capture.keywords.length > 0 && (
            <div className="mb-5 p-3 bg-gray-50 rounded-xl">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Spelling Words</p>
              <div className="space-y-2">
                {capture.keywords.map((kw, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{kw.keyword}</span>
                      <span className="text-xs text-gray-400">{kw.keyword.replace(/\s/g, '').length} letters</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Misspoke:</span>
                      <button onClick={() => updateMisspoke(i, -1)} className="w-7 h-7 rounded-full bg-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-300 transition-colors">−</button>
                      <span className={`w-6 text-center font-bold text-sm ${kw.misspokeCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>{kw.misspokeCount}</span>
                      <button onClick={() => updateMisspoke(i, 1)} className="w-7 h-7 rounded-full bg-red-100 text-red-700 font-bold text-sm hover:bg-red-200 transition-colors">+</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Questions inline like lesson format */}
          <div className="space-y-4">
            {capture.questions.map((q, i) => {
              const color = QUESTION_COLORS[q.questionType] ?? '#666'
              const isCheckbox = q.questionType === 'KNOWN' || q.questionType === 'SEMI-OPEN' || q.questionType === 'MATH'
              const isOpen = q.questionType === 'OPEN' || q.questionType === 'PRIOR KNOWLEDGE'
              const isVakt = q.questionType === 'VAKT'

              return (
                <div key={i} className="flex items-start gap-3">
                  {/* Checkbox for KNOWN / SEMI-OPEN / MATH */}
                  {isCheckbox && (
                    <button
                      onClick={() => setCapturedAnswer(i, q.capturedAnswer === 'correct' ? '' : 'correct')}
                      className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${q.capturedAnswer === 'correct' ? 'border-transparent' : 'border-gray-300 bg-white'}`}
                      style={q.capturedAnswer === 'correct' ? { backgroundColor: color, borderColor: color } : {}}
                    >
                      {q.capturedAnswer === 'correct' && <span className="text-white text-xs font-bold">✓</span>}
                    </button>
                  )}

                  {/* VAKT completion button */}
                  {isVakt && (
                    <button
                      onClick={() => setCapturedAnswer(i, q.capturedAnswer === 'COMPLETED' ? '' : 'COMPLETED')}
                      className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${q.capturedAnswer === 'COMPLETED' ? 'bg-red-600 border-red-600' : 'border-gray-300 bg-white'}`}
                    >
                      {q.capturedAnswer === 'COMPLETED' && <span className="text-white text-xs font-bold">✓</span>}
                    </button>
                  )}

                  {/* OPEN / PRIOR KNOWLEDGE — no checkbox, just text */}
                  {isOpen && <div className="w-5 flex-shrink-0" />}

                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color }}>{q.questionText}</p>
                    {q.expectedAnswer && !isOpen && (
                      <p className="text-xs text-gray-400 mt-0.5">{q.expectedAnswer}</p>
                    )}
                    {isOpen && (
                      <input
                        type="text"
                        value={q.capturedAnswer}
                        onChange={e => setCapturedAnswer(i, e.target.value)}
                        placeholder="Type student's response…"
                        className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {currentHunk > 0 && (
            <button onClick={() => setCurrentHunk(h => h - 1)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors">
              ← Previous Hunk
            </button>
          )}
          {!isLast ? (
            <button onClick={() => setCurrentHunk(h => h + 1)} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors">
              Next Hunk →
            </button>
          ) : (
            <button onClick={handleComplete} disabled={saving} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-green-700 disabled:opacity-60 transition-colors">
              {saving ? 'Saving…' : '✓ Complete Session'}
            </button>
          )}
        </div>
      </div>
    </main>
  )
}
