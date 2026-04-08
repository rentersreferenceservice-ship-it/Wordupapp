'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Lesson, Hunk, Question, QuestionType } from '@/lib/types'

const QUESTION_COLORS: Record<QuestionType, string> = {
  'KNOWN': 'text-green-700',
  'SEMI-OPEN': 'text-orange-600',
  'PRIOR KNOWLEDGE': 'text-blue-600',
  'MATH': 'text-purple-700',
  'VAKT': 'text-red-600',
  'OPEN': 'text-pink-600',
}

const QUESTION_TYPES: QuestionType[] = ['KNOWN', 'SEMI-OPEN', 'PRIOR KNOWLEDGE', 'MATH', 'VAKT', 'OPEN']

export default function LessonEditor({ lesson: original }: { lesson: Lesson }) {
  const [lesson, setLesson] = useState<Lesson>(JSON.parse(JSON.stringify(original)))
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)

  function updateHunkText(hunkIdx: number, text: string) {
    setLesson(l => {
      const hunks = [...l.hunks]
      hunks[hunkIdx] = { ...hunks[hunkIdx], text }
      return { ...l, hunks }
    })
  }

  function updateQuestion(hunkIdx: number, qIdx: number, field: keyof Question, value: string) {
    setLesson(l => {
      const hunks = [...l.hunks]
      const questions = [...hunks[hunkIdx].questions]
      questions[qIdx] = { ...questions[qIdx], [field]: value }
      hunks[hunkIdx] = { ...hunks[hunkIdx], questions }
      return { ...l, hunks }
    })
  }

  function deleteQuestion(hunkIdx: number, qIdx: number) {
    setLesson(l => {
      const hunks = [...l.hunks]
      const questions = hunks[hunkIdx].questions.filter((_, i) => i !== qIdx)
      hunks[hunkIdx] = { ...hunks[hunkIdx], questions }
      return { ...l, hunks }
    })
  }

  function addQuestion(hunkIdx: number) {
    setLesson(l => {
      const hunks = [...l.hunks]
      const questions = [...hunks[hunkIdx].questions, { type: 'KNOWN' as QuestionType, question: '', answer: '' }]
      hunks[hunkIdx] = { ...hunks[hunkIdx], questions }
      return { ...l, hunks }
    })
  }

  function resetToOriginal() {
    setLesson(JSON.parse(JSON.stringify(original)))
    setSaved(false)
  }

  async function saveEdits() {
    await fetch(`/api/lessons/${lesson.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lesson),
    })
    setSaved(true)
    setEditing(false)
  }

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="relative z-10 print:hidden flex items-center justify-between px-6 py-4 max-w-4xl mx-auto">
        <Link href="/lessons" className="text-sm text-gray-500 hover:text-gray-800">← All Lessons</Link>
        <div className="flex gap-3 items-center">
          {editing ? (
            <>
              <button
                onClick={resetToOriginal}
                className="text-sm text-gray-500 hover:text-gray-800 underline"
              >
                Reset to original
              </button>
              <button
                onClick={saveEdits}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Save changes
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              ✏️ Edit lesson
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Print
          </button>
          <a
            href={`/api/lessons/${lesson.id}/docx`}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Download DOCX
          </a>
        </div>
      </nav>

      {saved && (
        <div className="print:hidden relative z-10 max-w-4xl mx-auto px-8">
          <p className="text-green-700 text-sm bg-green-50 border border-green-200 rounded-lg px-4 py-2">
            Changes saved! Download DOCX or Print to get your edited version.
          </p>
        </div>
      )}

      {/* Lesson content */}
      <article className="relative z-10 max-w-4xl mx-auto px-8 py-8 my-4 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg font-[Arial,sans-serif] text-[14pt] leading-snug">

        {/* Title */}
        <h1 className="text-2xl font-bold text-center mb-1">{lesson.title}</h1>
        <p className="text-center text-[10pt] text-gray-400 mb-3">Created by Word Up Lesson Generator</p>

        {/* Hashtags */}
        {lesson.hashtags?.length > 0 && (
          <p className="text-center text-sm text-blue-500 mb-8">
            {lesson.hashtags.join(' ')}
          </p>
        )}

        {/* Hunks */}
        {lesson.hunks.map((hunk, hunkIdx) => (
          <section key={hunk.number} className="mb-8">
            {editing ? (
              <textarea
                value={hunk.text}
                onChange={e => updateHunkText(hunkIdx, e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm leading-relaxed mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
                rows={4}
              />
            ) : (
              <p className="mb-3 text-gray-900 leading-relaxed">{hunk.text}</p>
            )}

            <div className="space-y-3 pl-2">
              {hunk.questions.map((q, qi) => (
                <div key={qi} className={editing ? 'border border-gray-200 rounded-lg p-3 bg-gray-50' : ''}>
                  {editing ? (
                    <div className="space-y-2">
                      <div className="flex gap-2 items-center">
                        <select
                          value={q.type}
                          onChange={e => updateQuestion(hunkIdx, qi, 'type', e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-xs bg-white"
                        >
                          {QUESTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <button
                          onClick={() => deleteQuestion(hunkIdx, qi)}
                          className="text-red-500 text-xs hover:text-red-700 ml-auto"
                        >
                          Delete
                        </button>
                      </div>
                      <input
                        value={q.question}
                        onChange={e => updateQuestion(hunkIdx, qi, 'question', e.target.value)}
                        placeholder="Question"
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                      <input
                        value={q.answer}
                        onChange={e => updateQuestion(hunkIdx, qi, 'answer', e.target.value)}
                        placeholder="Answer (ALL CAPS)"
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                    </div>
                  ) : (
                    <>
                      <span className={`font-medium ${QUESTION_COLORS[q.type]}`}>{q.question}</span>
                      <div className="ml-4 text-black font-normal">{q.answer}</div>
                    </>
                  )}
                </div>
              ))}

              {editing && (
                <button
                  onClick={() => addQuestion(hunkIdx)}
                  className="text-sm text-blue-600 hover:underline mt-1"
                >
                  + Add question
                </button>
              )}
            </div>
          </section>
        ))}

        {/* Citations */}
        <section className="mt-10 pt-6 border-t border-gray-200">
          <h2 className="font-bold text-sm mb-2">References</h2>
          <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
            {lesson.citations.map((c, i) => <li key={i}>{c}</li>)}
          </ol>
        </section>

        {/* Footer key */}
        <footer className="print:hidden mt-8 pt-4 border-t border-gray-200 text-xs text-gray-500 text-center">
          Question Type Key:{' '}
          <span className="text-green-700 font-medium">KNOWN</span> |{' '}
          <span className="text-orange-600 font-medium">SEMI-OPEN</span> |{' '}
          <span className="text-purple-700 font-medium">MATH</span> |{' '}
          <span className="text-blue-600 font-medium">PRIOR KNOWLEDGE</span> |{' '}
          <span className="text-pink-600 font-medium">OPEN</span> |{' '}
          <span className="text-red-600 font-medium">VAKT</span>
        </footer>

        <div className="print-footer hidden print:block">
          <div>Question Type Key: KNOWN | SEMI-OPEN | MATH | PRIOR KNOWLEDGE | OPEN | VAKT</div>
          <div className="print-page-number">Page </div>
        </div>
      </article>
    </div>
  )
}
