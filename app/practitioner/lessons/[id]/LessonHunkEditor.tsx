'use client'

import { useState } from 'react'
import type { Hunk, QuestionType } from '@/lib/types'
import type { Student } from '@/lib/practitionerStore'
import StartSessionFromLesson from './StartSessionFromLesson'

const QUESTION_COLORS: Record<QuestionType, string> = {
  KNOWN: 'text-green-700',
  'SEMI-OPEN': 'text-orange-500',
  'PRIOR KNOWLEDGE': 'text-blue-600',
  MATH: 'text-purple-700',
  VAKT: 'text-red-500',
  OPEN: 'text-pink-500',
}

type EditingKey = {
  type: 'question'
  hunkIdx: number
  qIdx: number
} | {
  type: 'writing'
  hunkIdx: number
}

export default function LessonHunkEditor({
  lessonId,
  lessonTitle,
  initialHunks,
  qrMap,
  students,
}: {
  lessonId: string
  lessonTitle: string
  initialHunks: Hunk[]
  qrMap: Record<string, string>
  students: Student[]
}) {
  const [hunks, setHunks] = useState<Hunk[]>(initialHunks)
  const [editing, setEditing] = useState<EditingKey | null>(null)
  const [draft, setDraft] = useState('')
  const hasEdits = JSON.stringify(hunks) !== JSON.stringify(initialHunks)

  function startEdit(key: EditingKey) {
    if (key.type === 'question') {
      setDraft(hunks[key.hunkIdx].questions[key.qIdx].question)
    } else {
      setDraft(hunks[key.hunkIdx].writingPrompt ?? '')
    }
    setEditing(key)
  }

  function saveEdit() {
    if (!editing) return
    setHunks(prev => {
      const next = prev.map(h => ({ ...h, questions: [...h.questions] }))
      if (editing.type === 'question') {
        next[editing.hunkIdx].questions[editing.qIdx] = {
          ...next[editing.hunkIdx].questions[editing.qIdx],
          question: draft,
        }
      } else {
        next[editing.hunkIdx] = { ...next[editing.hunkIdx], writingPrompt: draft }
      }
      return next
    })
    setEditing(null)
  }

  function cancelEdit() {
    setEditing(null)
  }

  function resetHunk(hunkIdx: number) {
    setHunks(prev => prev.map((h, i) => i === hunkIdx ? initialHunks[i] : h))
  }

  const isEditingKey = (key: EditingKey) =>
    editing?.type === key.type &&
    editing.hunkIdx === key.hunkIdx &&
    (key.type === 'writing' || (editing as { qIdx: number }).qIdx === key.qIdx)

  return (
    <>
      {hasEdits && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-800 print:hidden">
          You have edited questions — these changes will be saved to the student record when you start a session.
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 mb-4 print:hidden">
        <StartSessionFromLesson
          lessonId={lessonId}
          lessonTitle={lessonTitle}
          students={students}
          customHunks={hasEdits ? hunks : null}
        />
      </div>

      {hunks.map((hunk, hunkIdx) => {
        const hunkEdited = JSON.stringify(hunk) !== JSON.stringify(initialHunks[hunkIdx])
        return (
          <section key={hunk.number} className="mb-8">
            {hunk.imageUrl && (
              <img
                src={hunk.imageUrl}
                alt={hunk.imageAlt || ''}
                className="w-full max-h-48 object-contain rounded-xl mb-3 bg-gray-50"
              />
            )}
            <p className="mb-3 text-gray-900 leading-relaxed">{hunk.text}</p>

            {hunkEdited && (
              <button
                onClick={() => resetHunk(hunkIdx)}
                className="print:hidden text-xs text-gray-400 hover:text-red-500 mb-2 underline underline-offset-2"
              >
                Reset hunk to original
              </button>
            )}

            <div className="space-y-2 pl-2">
              {hunk.questions.map((q, qi) => {
                const key: EditingKey = { type: 'question', hunkIdx, qIdx: qi }
                const isActive = isEditingKey(key)
                const qrDataUrl = q.type === 'VAKT' ? qrMap[`${hunk.number}-${qi}`] : undefined
                return (
                  <div key={qi} className="group">
                    {isActive ? (
                      <div className="print:hidden space-y-1">
                        <textarea
                          value={draft}
                          onChange={e => setDraft(e.target.value)}
                          rows={2}
                          autoFocus
                          className="w-full border border-blue-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                        <div className="flex gap-2">
                          <button onClick={saveEdit} className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700">Save</button>
                          <button onClick={cancelEdit} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <div className="flex-1 flex items-start gap-3">
                          <div className="flex-1">
                            <span className={`font-medium ${QUESTION_COLORS[q.type]}`}>{q.question}</span>
                            {q.answer && <div className="ml-4 text-black font-normal">{q.answer}</div>}
                          </div>
                          {qrDataUrl && (
                            <div className="shrink-0 text-center" style={{ maxWidth: 96 }}>
                              <img src={qrDataUrl} alt="YouTube QR" width={80} height={80} />
                              {q.youtubeDescription && <p className="text-[7pt] text-gray-600 mt-0.5 leading-tight">{q.youtubeDescription}</p>}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => startEdit(key)}
                          title="Edit question"
                          className="print:hidden opacity-0 group-hover:opacity-100 text-gray-300 hover:text-blue-500 transition-opacity shrink-0 mt-0.5"
                        >
                          ✏
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Writing prompt */}
            {(() => {
              const key: EditingKey = { type: 'writing', hunkIdx }
              const isActive = isEditingKey(key)
              return hunk.writingPrompt || isActive ? (
                <div className="mt-3 border border-pink-200 rounded-lg p-3 bg-pink-50 group">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-pink-500 uppercase tracking-wide">Writing Prompt</p>
                    {!isActive && (
                      <button
                        onClick={() => startEdit(key)}
                        title="Edit writing prompt"
                        className="print:hidden opacity-0 group-hover:opacity-100 text-gray-300 hover:text-blue-500 transition-opacity text-sm"
                      >
                        ✏
                      </button>
                    )}
                  </div>
                  {isActive ? (
                    <div className="space-y-1">
                      <textarea
                        value={draft}
                        onChange={e => setDraft(e.target.value)}
                        rows={2}
                        autoFocus
                        className="w-full border border-pink-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none bg-white"
                      />
                      <div className="flex gap-2">
                        <button onClick={saveEdit} className="text-xs bg-pink-500 text-white px-3 py-1 rounded-lg hover:bg-pink-600">Save</button>
                        <button onClick={cancelEdit} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-pink-600">{hunk.writingPrompt}</p>
                  )}
                </div>
              ) : null
            })()}
          </section>
        )
      })}
    </>
  )
}
