'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Lesson, QuestionType } from '@/lib/types'

const QUESTION_TYPES: QuestionType[] = ['KNOWN', 'SEMI-OPEN', 'PRIOR KNOWLEDGE', 'MATH', 'VAKT', 'OPEN']

const TYPE_COLORS: Record<QuestionType, string> = {
  KNOWN: 'text-green-700',
  'SEMI-OPEN': 'text-orange-500',
  'PRIOR KNOWLEDGE': 'text-blue-600',
  MATH: 'text-purple-700',
  VAKT: 'text-red-500',
  OPEN: 'text-pink-500',
}

export default function EditLessonClient({ lesson }: { lesson: Lesson }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const [title, setTitle] = useState(lesson.title)
  const [hunks, setHunks] = useState(lesson.hunks.map(h => ({
    ...h,
    questions: h.questions.map(q => ({ ...q })),
  })))
  const [citations, setCitations] = useState(lesson.citations)
  const [hashtags, setHashtags] = useState(lesson.hashtags.join(' '))

  function updateHunkText(hi: number, text: string) {
    setHunks(prev => prev.map((h, i) => i === hi ? { ...h, text } : h))
  }

  function updateQuestion(hi: number, qi: number, field: string, value: string) {
    setHunks(prev => prev.map((h, i) => i === hi ? {
      ...h,
      questions: h.questions.map((q, j) => j === qi ? { ...q, [field]: value } : q),
    } : h))
  }

  function updateCitation(i: number, value: string) {
    setCitations(prev => prev.map((c, ci) => ci === i ? value : c))
  }

  function addCitation() {
    setCitations(prev => [...prev, ''])
  }

  function removeCitation(i: number) {
    setCitations(prev => prev.filter((_, ci) => ci !== i))
  }

  async function handleSave() {
    setSaving(true)
    setSaveError('')
    try {
      const updated: Lesson = {
        ...lesson,
        title,
        hunks,
        citations: citations.filter(c => c.trim()),
        hashtags: hashtags.split(/\s+/).filter(t => t.trim()),
      }
      const res = await fetch(`/api/lessons/${lesson.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      })
      if (!res.ok) {
        const data = await res.json()
        setSaveError(data.error ?? 'Save failed')
        setSaving(false)
        return
      }
      router.push(`/lessons/${lesson.id}`)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Something went wrong')
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push(`/lessons/${lesson.id}`)}
          className="bg-gray-100 text-gray-700 border-2 border-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          ← Cancel
        </button>
        <h1 className="text-xl font-bold text-gray-900">Edit Lesson</h1>
      </div>

      {/* Title */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Title</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Hunks */}
      {hunks.map((hunk, hi) => (
        <div key={hunk.number} className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Hunk {hunk.number}</h2>

          <label className="text-xs font-medium text-gray-500 block mb-1">Text</label>
          <textarea
            value={hunk.text}
            onChange={e => updateHunkText(hi, e.target.value)}
            rows={4}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4"
          />

          <div className="space-y-3">
            {hunk.questions.map((q, qi) => (
              <div key={qi} className="border border-gray-100 rounded-xl p-3 bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <select
                    value={q.type}
                    onChange={e => updateQuestion(hi, qi, 'type', e.target.value)}
                    className={`text-xs font-bold border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${TYPE_COLORS[q.type]}`}
                  >
                    {QUESTION_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <span className="text-xs text-gray-400">Question {qi + 1}</span>
                </div>
                <input
                  type="text"
                  value={q.question}
                  onChange={e => updateQuestion(hi, qi, 'question', e.target.value)}
                  placeholder="Question text…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 bg-white"
                />
                <input
                  type="text"
                  value={q.answer}
                  onChange={e => updateQuestion(hi, qi, 'answer', e.target.value)}
                  placeholder="Answer…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Citations */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-3">Citations</label>
        <div className="space-y-2">
          {citations.map((c, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={c}
                onChange={e => updateCitation(i, e.target.value)}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => removeCitation(i)}
                className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none px-1"
              >×</button>
            </div>
          ))}
        </div>
        <button
          onClick={addCitation}
          className="mt-2 text-xs text-blue-600 hover:underline"
        >+ Add citation</button>
      </div>

      {/* Hashtags */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Hashtags <span className="font-normal normal-case text-gray-400">(space-separated)</span></label>
        <input
          type="text"
          value={hashtags}
          onChange={e => setHashtags(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {saveError && <p className="text-red-600 text-sm mb-4">{saveError}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  )
}
