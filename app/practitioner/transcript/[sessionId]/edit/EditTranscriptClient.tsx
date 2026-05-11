'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SessionResponse } from '@/lib/practitionerStore'

const STATE_OPTIONS = ['Regulated', 'Dysregulated', 'Overstimulated', 'Understimulated', 'Sick', 'Tired', 'Hungry', 'Stuck in loops']

const QUESTION_COLORS: Record<string, string> = {
  KNOWN: '#15803d',
  'SEMI-OPEN': '#f97316',
  'PRIOR KNOWLEDGE': '#2563eb',
  MATH: '#7e22ce',
  VAKT: '#dc2626',
  OPEN: '#db2777',
  KEYWORD: '#64748b',
}

interface EditState {
  capturedAnswer: string
  misspokeCount: number
  skipped: boolean
  notAsked: boolean
}

function initialEditState(r: SessionResponse): EditState {
  const ca = r.capturedAnswer ?? ''
  return {
    capturedAnswer: ca,
    misspokeCount: r.misspokeCount ?? 0,
    skipped: ca === 'SKIPPED' || ca === 'SKIP',
    notAsked: ca === 'NOT_ASKED',
  }
}

function Stepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      <button onClick={() => onChange(Math.max(0, value - 1))} className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 flex items-center justify-center text-sm">−</button>
      <span className="w-5 text-center text-sm font-semibold text-red-600">{value}</span>
      <button onClick={() => onChange(value + 1)} className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 flex items-center justify-center text-sm">+</button>
    </div>
  )
}

export default function EditTranscriptClient({
  sessionId,
  studentId,
  responses,
}: {
  sessionId: string
  studentId: string
  responses: SessionResponse[]
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const sessionStateRecord = responses.find(r => r.questionType === 'SESSION_STATE')
  const sessionNotesRecord = responses.find(r => r.questionType === 'SESSION_NOTES')
  const sessionCompleteRecord = responses.find(r => r.questionType === 'SESSION_COMPLETE')

  const [studentStates, setStudentStates] = useState<string[]>(
    sessionStateRecord?.capturedAnswer ? sessionStateRecord.capturedAnswer.split(', ').filter(Boolean) : []
  )
  const [sessionNotes, setSessionNotes] = useState(sessionNotesRecord?.capturedAnswer ?? '')

  const [edits, setEdits] = useState<Record<string, EditState>>(() => {
    const map: Record<string, EditState> = {}
    for (const r of responses) {
      if (!r.hunkNumber || r.hunkNumber <= 0) continue
      map[r.id] = initialEditState(r)
    }
    return map
  })

  function update(id: string, changes: Partial<EditState>) {
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], ...changes } }))
  }

  function toggleState(s: string) {
    setStudentStates(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  function buildPayload() {
    const out: object[] = [
      { hunkNumber: 0, questionType: 'SESSION_STATE', questionText: 'Student State', capturedAnswer: studentStates.join(', '), expectedAnswer: '', misspokeCount: 0 },
      { hunkNumber: 0, questionType: 'SESSION_NOTES', questionText: 'Session Notes', capturedAnswer: sessionNotes, expectedAnswer: '', misspokeCount: 0 },
    ]
    if (sessionCompleteRecord) {
      out.push({ hunkNumber: 0, questionType: 'SESSION_COMPLETE', questionText: 'Session Complete', capturedAnswer: 'true', expectedAnswer: '', misspokeCount: 0 })
    }
    for (const r of responses) {
      if (!r.hunkNumber || r.hunkNumber <= 0) continue
      const edit = edits[r.id]
      if (!edit) continue

      let capturedAnswer: string
      let misspokeCount = 0

      if (r.questionType === 'KEYWORD') {
        capturedAnswer = edit.skipped ? 'SKIPPED' : ''
        misspokeCount = edit.skipped ? 0 : edit.misspokeCount
      } else if (edit.notAsked) {
        capturedAnswer = 'NOT_ASKED'
      } else if (edit.skipped) {
        capturedAnswer = 'SKIP'
      } else {
        capturedAnswer = edit.capturedAnswer
        misspokeCount = edit.misspokeCount
      }

      out.push({
        hunkNumber: r.hunkNumber,
        keyword: r.keyword,
        questionType: r.questionType,
        questionText: r.questionText,
        expectedAnswer: r.expectedAnswer,
        capturedAnswer,
        misspokeCount,
      })
    }
    return out
  }

  async function handleSave() {
    setSaving(true)
    setSaveError('')
    try {
      const res = await fetch(`/api/practitioner/sessions/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses: buildPayload() }),
      })
      if (!res.ok) {
        const data = await res.json()
        setSaveError(`Save failed: ${data.error ?? res.status}`)
        setSaving(false)
        return
      }
      router.push(`/practitioner/transcript/${sessionId}`)
    } catch (e) {
      setSaveError(`Error: ${e instanceof Error ? e.message : String(e)}`)
      setSaving(false)
    }
  }

  const byHunk: Record<number, SessionResponse[]> = {}
  for (const r of responses) {
    if (!r.hunkNumber || r.hunkNumber <= 0) continue
    if (!byHunk[r.hunkNumber]) byHunk[r.hunkNumber] = []
    byHunk[r.hunkNumber].push(r)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push(`/practitioner/transcript/${sessionId}`)}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          ← Cancel
        </button>
        <h1 className="text-xl font-bold text-gray-900">Edit Transcript</h1>
      </div>

      {/* Student State */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Student State</p>
        <div className="flex flex-wrap gap-2">
          {STATE_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => toggleState(s)}
              className={`px-3 py-1.5 rounded-full border-2 text-xs font-medium transition-colors ${studentStates.includes(s) ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Session Notes */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Session Notes</p>
        <textarea
          value={sessionNotes}
          onChange={e => setSessionNotes(e.target.value)}
          rows={3}
          placeholder="Add notes..."
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* Per-hunk */}
      {Object.entries(byHunk).sort(([a], [b]) => Number(a) - Number(b)).map(([hunkNum, items]) => (
        <div key={hunkNum} className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Hunk {hunkNum}</h2>

          {/* Keywords */}
          {items.filter(r => r.questionType === 'KEYWORD').map(r => {
            const edit = edits[r.id]
            if (!edit) return null
            return (
              <div key={r.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-700">{r.keyword}</span>
                  <span className="text-xs text-gray-400">{(r.keyword ?? '').replace(/\s/g, '').length}L</span>
                </div>
                <div className="flex items-center gap-3">
                  {!edit.skipped && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400 mr-1">Misspokes:</span>
                      <Stepper value={edit.misspokeCount} onChange={n => update(r.id, { misspokeCount: n })} />
                    </div>
                  )}
                  <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={edit.skipped}
                      onChange={e => update(r.id, { skipped: e.target.checked, misspokeCount: 0 })}
                      className="rounded"
                    />
                    Skip
                  </label>
                </div>
              </div>
            )
          })}

          {/* Questions */}
          {items.filter(r => r.questionType !== 'KEYWORD').map(r => {
            const edit = edits[r.id]
            if (!edit) return null
            const color = QUESTION_COLORS[r.questionType] ?? '#666'

            return (
              <div key={r.id} className="py-3 border-b border-gray-50 last:border-0">
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5" style={{ color, border: `1.5px solid ${color}` }}>
                    {r.questionType}
                  </span>
                  <p className="text-sm text-gray-700 leading-snug">{r.questionText}</p>
                </div>

                {r.questionType === 'MATH' && (
                  <div className="flex flex-wrap gap-2 ml-1">
                    {[
                      { val: 'NOT_ASKED', label: 'Not Asked' },
                      { val: 'correct', label: 'Correct' },
                      { val: 'incorrect', label: 'Incorrect' },
                      { val: 'SKIP', label: 'Skipped' },
                    ].map(({ val, label }) => {
                      const active = val === 'NOT_ASKED' ? edit.notAsked : val === 'SKIP' ? edit.skipped : (edit.capturedAnswer === val && !edit.notAsked && !edit.skipped)
                      return (
                        <button
                          key={val}
                          onClick={() => update(r.id, { capturedAnswer: val, notAsked: val === 'NOT_ASKED', skipped: val === 'SKIP' })}
                          className={`px-3 py-1 rounded-full text-xs font-medium border-2 transition-colors ${active
                            ? val === 'correct' ? 'border-green-500 bg-green-50 text-green-700'
                              : val === 'incorrect' ? 'border-red-500 bg-red-50 text-red-700'
                              : 'border-gray-400 bg-gray-100 text-gray-700'
                            : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                )}

                {r.questionType === 'VAKT' && (
                  <div className="flex flex-wrap gap-2 ml-1">
                    {[
                      { val: 'NOT_ASKED', label: 'Not Asked' },
                      { val: 'COMPLETED', label: 'Completed' },
                      { val: 'SKIP', label: 'Skipped' },
                    ].map(({ val, label }) => {
                      const active = val === 'NOT_ASKED' ? edit.notAsked : val === 'SKIP' ? edit.skipped : (edit.capturedAnswer === 'COMPLETED' && !edit.notAsked && !edit.skipped)
                      return (
                        <button
                          key={val}
                          onClick={() => update(r.id, { capturedAnswer: val, notAsked: val === 'NOT_ASKED', skipped: val === 'SKIP' })}
                          className={`px-3 py-1 rounded-full text-xs font-medium border-2 transition-colors ${active ? 'border-gray-400 bg-gray-100 text-gray-700' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                )}

                {r.questionType === 'KNOWN' && (
                  <div className="flex items-center gap-4 ml-1">
                    <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={edit.notAsked}
                        onChange={e => update(r.id, { notAsked: e.target.checked, misspokeCount: 0 })}
                        className="rounded"
                      />
                      Not Asked
                    </label>
                    {!edit.notAsked && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">Misspokes:</span>
                        <Stepper value={edit.misspokeCount} onChange={n => update(r.id, { misspokeCount: n })} />
                      </div>
                    )}
                  </div>
                )}

                {(r.questionType === 'OPEN' || r.questionType === 'PRIOR KNOWLEDGE' || r.questionType === 'SEMI-OPEN') && (
                  <div className="space-y-2 ml-1">
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={edit.notAsked}
                          onChange={e => update(r.id, { notAsked: e.target.checked, skipped: false })}
                          className="rounded"
                        />
                        Not Asked
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={edit.skipped}
                          onChange={e => update(r.id, { skipped: e.target.checked, notAsked: false })}
                          className="rounded"
                        />
                        Skipped
                      </label>
                    </div>
                    {!edit.notAsked && !edit.skipped && (
                      <>
                        <input
                          type="text"
                          value={edit.capturedAnswer === 'NOT_ASKED' || edit.capturedAnswer === 'SKIP' ? '' : edit.capturedAnswer}
                          onChange={e => update(r.id, { capturedAnswer: e.target.value })}
                          placeholder="Student's response..."
                          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-400">Misspokes:</span>
                          <Stepper value={edit.misspokeCount} onChange={n => update(r.id, { misspokeCount: n })} />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}

      {saveError && <p className="text-red-600 text-sm mb-4">{saveError}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  )
}
