'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Hunk, QuestionType } from '@/lib/types'

const QUESTION_TYPES: QuestionType[] = ['KNOWN', 'SEMI-OPEN', 'PRIOR KNOWLEDGE', 'MATH', 'VAKT', 'OPEN']

const TYPE_COLORS: Record<QuestionType, string> = {
  KNOWN: 'text-green-700',
  'SEMI-OPEN': 'text-orange-500',
  'PRIOR KNOWLEDGE': 'text-blue-600',
  MATH: 'text-purple-700',
  VAKT: 'text-red-600',
  OPEN: 'text-pink-600',
}

export default function EditTypesButton({ lessonId, initialHunks }: { lessonId: string; initialHunks: Hunk[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [hunks, setHunks] = useState<Hunk[]>(initialHunks)
  const [saving, setSaving] = useState(false)

  function setType(hi: number, qi: number, type: QuestionType) {
    setHunks(prev => prev.map((h, i) =>
      i !== hi ? h : {
        ...h,
        questions: h.questions.map((q, j) => j !== qi ? q : { ...q, type }),
      }
    ))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/lessons/${lessonId}`)
      const lesson = await res.json()
      await fetch(`/api/lessons/${lessonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...lesson, hunks }),
      })
      setOpen(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
      >
        Edit Types
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative ml-auto h-full w-full max-w-md bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Edit Question Types</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none px-1">×</button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-6">
              {hunks.map((hunk, hi) => (
                <div key={hi}>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Hunk {hunk.number}</p>
                  <div className="space-y-3">
                    {hunk.questions.map((q, qi) => (
                      <div key={qi} className="flex items-start gap-2">
                        <select
                          value={q.type}
                          onChange={e => setType(hi, qi, e.target.value as QuestionType)}
                          className={`shrink-0 border border-gray-200 rounded px-2 py-1 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${TYPE_COLORS[q.type]}`}
                        >
                          {QUESTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <p className="text-sm text-gray-700 leading-snug pt-0.5">{q.question}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
