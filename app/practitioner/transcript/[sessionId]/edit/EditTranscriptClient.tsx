'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { SessionResponse } from '@/lib/practitionerStore'
import type { Hunk } from '@/lib/types'
import SessionNotesImages from '../SessionNotesImages'
import SmartNotesField from '@/app/practitioner/components/SmartNotesField'

function extractKeywords(text: string): string[] {
  const matches = text.match(/\b[A-Z][A-Z\s\-']{1,}[A-Z]\b/g) ?? []
  const unique: string[] = []
  for (const m of matches) {
    const trimmed = m.trim()
    if (!unique.includes(trimmed)) unique.push(trimmed)
  }
  return unique
}

function synthResponsesFromHunks(hunks: Hunk[]): SessionResponse[] {
  const out: SessionResponse[] = []
  for (const hunk of hunks) {
    extractKeywords(hunk.text).forEach((kw, i) => {
      out.push({
        id: `synth-${hunk.number}-kw-${i}`,
        sessionId: '',
        hunkNumber: hunk.number,
        keyword: kw,
        questionType: 'KEYWORD',
        questionText: `Spell: ${kw}`,
        expectedAnswer: kw,
        capturedAnswer: '',
        misspokeCount: 0,
      })
    })
    hunk.questions.forEach((q, i) => {
      out.push({
        id: `synth-${hunk.number}-q-${i}`,
        sessionId: '',
        hunkNumber: hunk.number,
        questionType: q.type,
        questionText: q.question,
        expectedAnswer: q.answer,
        capturedAnswer: '',
        misspokeCount: 0,
      })
    })
  }
  return out
}

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
  spellerSentence: string
}

function initialEditState(r: SessionResponse): EditState {
  const ca = r.capturedAnswer ?? ''
  return {
    capturedAnswer: ca,
    misspokeCount: r.misspokeCount ?? 0,
    skipped: ca === 'SKIPPED' || ca === 'SKIP',
    notAsked: ca === 'NOT_ASKED',
    spellerSentence: r.spellerSentence ?? '',
  }
}

function Stepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      <button onClick={() => onChange(Math.max(0, value - 1))} className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 flex items-center justify-center text-sm">−</button>
      <span className="w-5 text-center text-sm font-semibold text-red-600">{value}</span>
      <button onClick={() => onChange(value + 1)} className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 flex items-center justify-center text-sm">+</button>
      {value > 0 && (
        <button onClick={() => onChange(0)} className="text-gray-300 hover:text-red-400 text-xs leading-none ml-0.5" title="Clear">×</button>
      )}
    </div>
  )
}

export default function EditTranscriptClient({
  sessionId,
  studentId,
  responses,
  lessonHunks,
  isOpenSession = false,
  initialRegulationArrival = null,
  initialRegulationDeparture = null,
  initialNotesImages = [],
}: {
  sessionId: string
  studentId: string
  responses: SessionResponse[]
  lessonHunks?: Hunk[]
  isOpenSession?: boolean
  initialRegulationArrival?: string | null
  initialRegulationDeparture?: string | null
  initialNotesImages?: string[]
}) {
  const hasHunkData = responses.some(r => r.hunkNumber != null && r.hunkNumber > 0)
  const allResponses = hasHunkData || !lessonHunks
    ? responses
    : [...responses, ...synthResponsesFromHunks(lessonHunks)]
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [generatingInvoice, setGeneratingInvoice] = useState(false)
  const [invoiceError, setInvoiceError] = useState('')
  const [invoiceAmount, setInvoiceAmount] = useState('')
  const [regArrival, setRegArrival] = useState<string | null>(initialRegulationArrival)
  const [regDeparture, setRegDeparture] = useState<string | null>(initialRegulationDeparture)

  const sessionStateRecord = responses.find(r => r.questionType === 'SESSION_STATE')
  const sessionNotesRecord = responses.find(r => r.questionType === 'SESSION_NOTES')
  const sessionCompleteRecord = responses.find(r => r.questionType === 'SESSION_COMPLETE')
  const sessionVideoRecord = responses.find(r => r.questionType === 'SESSION_VIDEO')
  const sessionInvoiceRecord = responses.find(r => r.questionType === 'SESSION_INVOICE')

  const [studentStates, setStudentStates] = useState<string[]>(
    sessionStateRecord?.capturedAnswer ? sessionStateRecord.capturedAnswer.split(', ').filter(Boolean) : []
  )
  const [sessionNotes, setSessionNotes] = useState(sessionNotesRecord?.capturedAnswer ?? '')
  const [sessionVideo, setSessionVideo] = useState(sessionVideoRecord?.capturedAnswer ?? '')
  const initialInvoice = sessionInvoiceRecord?.capturedAnswer ?? ''
  const [sessionInvoice, setSessionInvoice] = useState(initialInvoice)
  const [invoiceMode, setInvoiceMode] = useState<'link' | 'generate'>(
    initialInvoice.startsWith('/practitioner/invoice/') ? 'generate' : 'link'
  )

  const [unskippedHunks, setUnskippedHunks] = useState<Set<number>>(new Set())

  // Open session: unified editable list of all questions (existing + any new ones)
  const openQNextId = useRef(1)
  const [openQuestions, setOpenQuestions] = useState<{ id: number; questionText: string; capturedAnswer: string; misspokeCount: number }[]>(() => {
    const existing = responses
      .filter(r => r.questionType === 'OPEN' && r.hunkNumber != null && r.hunkNumber > 0)
      .map(r => ({ id: openQNextId.current++, questionText: r.questionText ?? '', capturedAnswer: r.capturedAnswer ?? '', misspokeCount: r.misspokeCount ?? 0 }))
    return existing.length > 0
      ? existing
      : [{ id: openQNextId.current++, questionText: '', capturedAnswer: '', misspokeCount: 0 }]
  })

  function addOpenQuestion() {
    setOpenQuestions(prev => [...prev, { id: openQNextId.current++, questionText: '', capturedAnswer: '', misspokeCount: 0 }])
  }

  function removeOpenQuestion(id: number) {
    setOpenQuestions(prev => prev.filter(q => q.id !== id))
  }

  function updateOpenQuestion(id: number, changes: Partial<{ questionText: string; capturedAnswer: string; misspokeCount: number }>) {
    setOpenQuestions(prev => prev.map(q => q.id === id ? { ...q, ...changes } : q))
  }

  const [edits, setEdits] = useState<Record<string, EditState>>(() => {
    const map: Record<string, EditState> = {}
    for (const r of allResponses) {
      if (!r.hunkNumber || r.hunkNumber <= 0) continue
      map[r.id] = initialEditState(r)
    }
    return map
  })

  const [writingResponses, setWritingResponses] = useState<Record<number, string>>(() => {
    const map: Record<number, string> = {}
    for (const r of responses) {
      if (r.questionType === 'WRITING_PROMPT' && r.hunkNumber && r.hunkNumber > 0) {
        map[r.hunkNumber] = r.capturedAnswer === 'SKIPPED' ? '' : (r.capturedAnswer ?? '')
      }
    }
    return map
  })

  const [writingMisspokes, setWritingMisspokes] = useState<Record<number, number>>(() => {
    const map: Record<number, number> = {}
    for (const r of responses) {
      if (r.questionType === 'WRITING_PROMPT' && r.hunkNumber && r.hunkNumber > 0) {
        map[r.hunkNumber] = r.misspokeCount ?? 0
      }
    }
    return map
  })

  const [extraKeywords, setExtraKeywords] = useState<Record<number, { word: string; misspokeCount: number; skipped: boolean }[]>>(() => {
    const allHunks = new Set(allResponses.filter(r => r.hunkNumber && r.hunkNumber > 0).map(r => r.hunkNumber!))
    const map: Record<number, { word: string; misspokeCount: number; skipped: boolean }[]> = {}
    for (const hunkNum of allHunks) {
      const seenWords = new Set<string>()
      const existing = allResponses
        .filter(r => r.questionType === 'EXTRA_SPELLING' && r.hunkNumber === hunkNum)
        .map(r => ({ word: r.keyword ?? '', misspokeCount: r.misspokeCount ?? 0, skipped: r.capturedAnswer === 'SKIPPED' }))
        .filter(e => {
          const key = e.word.toUpperCase().trim()
          if (seenWords.has(key)) return false
          seenWords.add(key)
          return true
        })
      while (existing.length < 2) existing.push({ word: '', misspokeCount: 0, skipped: false })
      map[hunkNum] = existing
    }
    return map
  })

  function updateExtraKeyword(hunkNum: number, index: number, changes: Partial<{ word: string; misspokeCount: number; skipped: boolean }>) {
    setExtraKeywords(prev => {
      const slots = [...(prev[hunkNum] ?? [])]
      slots[index] = { ...slots[index], ...changes }
      return { ...prev, [hunkNum]: slots }
    })
  }

  function update(id: string, changes: Partial<EditState>) {
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], ...changes } }))
  }

  function resetAllMisspokes() {
    setEdits(prev => {
      const next = { ...prev }
      for (const id of Object.keys(next)) next[id] = { ...next[id], misspokeCount: 0 }
      return next
    })
    setExtraKeywords(prev => {
      const next = { ...prev }
      for (const k of Object.keys(next)) next[Number(k)] = next[Number(k)].map(s => ({ ...s, misspokeCount: 0 }))
      return next
    })
    setWritingMisspokes(prev => {
      const next = { ...prev }
      for (const k of Object.keys(next)) next[Number(k)] = 0
      return next
    })
  }

  function toggleState(s: string) {
    setStudentStates(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  async function handleGenerateInvoice() {
    setGeneratingInvoice(true)
    setInvoiceError('')
    try {
      const res = await fetch('/api/practitioner/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, amount: invoiceAmount ? parseFloat(invoiceAmount) : undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        setInvoiceError(data.error ?? 'Failed to create invoice')
        setGeneratingInvoice(false)
      } else {
        const invoicePath = `/practitioner/invoice/${data.invoiceId}`
        setSessionInvoice(invoicePath)
        // Save the invoice link alongside all existing session data
        await fetch(`/api/practitioner/sessions/${sessionId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ responses: buildPayload(invoicePath) }),
        })
        router.push(invoicePath)
      }
    } catch (e) {
      setInvoiceError(e instanceof Error ? e.message : 'Failed to create invoice')
      setGeneratingInvoice(false)
    }
  }

  const hunkPrompts: Record<number, string> = {}
  if (lessonHunks) {
    for (const hunk of lessonHunks) {
      if (hunk.writingPrompt) hunkPrompts[hunk.number] = hunk.writingPrompt
    }
  }
  // Fall back to the questionText stored in the response record for submitted lessons without writingPrompt
  for (const r of responses) {
    if (r.questionType === 'WRITING_PROMPT' && r.hunkNumber && r.hunkNumber > 0 && !hunkPrompts[r.hunkNumber] && r.questionText && r.questionText !== 'Writing Prompt') {
      hunkPrompts[r.hunkNumber] = r.questionText
    }
  }

  function buildPayload(invoiceOverride?: string) {
    const out: object[] = [
      { hunkNumber: 0, questionType: 'SESSION_STATE', questionText: 'Student State', capturedAnswer: studentStates.join(', '), expectedAnswer: '', misspokeCount: 0 },
      { hunkNumber: 0, questionType: 'SESSION_NOTES', questionText: 'Session Notes', capturedAnswer: sessionNotes, expectedAnswer: '', misspokeCount: 0 },
      { hunkNumber: 0, questionType: 'SESSION_VIDEO', questionText: 'Session Video', capturedAnswer: sessionVideo.trim(), expectedAnswer: '', misspokeCount: 0 },
      { hunkNumber: 0, questionType: 'SESSION_INVOICE', questionText: 'Invoice', capturedAnswer: (invoiceOverride ?? sessionInvoice).trim(), expectedAnswer: '', misspokeCount: 0 },
    ]
    if (sessionCompleteRecord) {
      out.push({ hunkNumber: 0, questionType: 'SESSION_COMPLETE', questionText: 'Session Complete', capturedAnswer: 'true', expectedAnswer: '', misspokeCount: 0 })
    }
    for (const r of allResponses) {
      if (!r.hunkNumber || r.hunkNumber <= 0) continue
      if (r.questionType === 'WRITING_PROMPT') continue
      if (r.questionType === 'EXTRA_SPELLING') continue
      if (r.questionType === 'HUNK_SKIPPED' && unskippedHunks.has(r.hunkNumber)) continue
      if (isOpenSession && r.questionType === 'OPEN') continue
      const edit = edits[r.id]
      if (!edit) continue

      let capturedAnswer: string
      let misspokeCount = 0

      if (r.questionType === 'KEYWORD') {
        capturedAnswer = edit.skipped ? 'SKIPPED' : ''
        misspokeCount = edit.skipped ? 0 : edit.misspokeCount
      } else if (edit.notAsked) {
        capturedAnswer = 'NOT_ASKED'
        misspokeCount = r.misspokeCount ?? 0
      } else if (edit.skipped) {
        capturedAnswer = 'SKIP'
        misspokeCount = r.misspokeCount ?? 0
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
        spellerSentence: edit.spellerSentence || undefined,
      })
    }
    for (const [hunkNum, slots] of Object.entries(extraKeywords)) {
      for (const slot of slots) {
        if (slot.word.trim()) {
          out.push({
            hunkNumber: Number(hunkNum),
            keyword: slot.word.trim().toUpperCase(),
            questionType: 'EXTRA_SPELLING',
            questionText: 'Additional Spelling Word',
            expectedAnswer: '',
            capturedAnswer: slot.skipped ? 'SKIPPED' : '',
            misspokeCount: slot.skipped ? 0 : slot.misspokeCount,
          })
        }
      }
    }
    if (isOpenSession) {
      for (const q of openQuestions) {
        if (q.questionText.trim() || q.capturedAnswer.trim()) {
          out.push({ hunkNumber: 1, questionType: 'OPEN', questionText: q.questionText, capturedAnswer: q.capturedAnswer, expectedAnswer: '', misspokeCount: q.misspokeCount })
        }
      }
      return out
    }
    for (const [hunkNum, response] of Object.entries(writingResponses)) {
      out.push({
        hunkNumber: Number(hunkNum),
        questionType: 'WRITING_PROMPT',
        questionText: hunkPrompts[Number(hunkNum)] ?? 'Writing Prompt',
        capturedAnswer: response || 'SKIPPED',
        expectedAnswer: '',
        misspokeCount: writingMisspokes[Number(hunkNum)] ?? 0,
      })
    }
    return out
  }

  async function handleSave() {
    setSaving(true)
    setSaveError('')
    try {
      const [res] = await Promise.all([
        fetch(`/api/practitioner/sessions/${sessionId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ responses: buildPayload() }),
        }),
        fetch(`/api/practitioner/sessions/${sessionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ regulation_arrival: regArrival, regulation_departure: regDeparture }),
        }),
      ])
      if (!res.ok) {
        const data = await res.json()
        setSaveError(`Save failed: ${data.error ?? res.status}`)
        setSaving(false)
        return
      }
      window.location.href = `/practitioner/transcript/${sessionId}`
    } catch (e) {
      setSaveError(`Error: ${e instanceof Error ? e.message : String(e)}`)
      setSaving(false)
    }
  }

  const byHunk: Record<number, SessionResponse[]> = {}
  for (const r of allResponses) {
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

      {/* Regulation + Student State */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 space-y-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Arrived</p>
          <div className="flex gap-2">
            {['regulated', 'dysregulated'].map(val => (
              <button
                key={val}
                onClick={() => setRegArrival(prev => prev === val ? null : val)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-colors ${
                  regArrival === val
                    ? val === 'regulated' ? 'bg-green-500 border-green-500 text-white' : 'bg-yellow-400 border-yellow-400 text-white'
                    : val === 'regulated' ? 'border-green-400 text-green-600 hover:bg-green-50' : 'border-yellow-400 text-yellow-600 hover:bg-yellow-50'
                }`}
              >
                {val.charAt(0).toUpperCase() + val.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
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

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Departed</p>
          <div className="flex gap-2">
            {['regulated', 'dysregulated'].map(val => (
              <button
                key={val}
                onClick={() => setRegDeparture(prev => prev === val ? null : val)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-colors ${
                  regDeparture === val
                    ? val === 'regulated' ? 'bg-green-500 border-green-500 text-white' : 'bg-yellow-400 border-yellow-400 text-white'
                    : val === 'regulated' ? 'border-green-400 text-green-600 hover:bg-green-50' : 'border-yellow-400 text-yellow-600 hover:bg-yellow-50'
                }`}
              >
                {val.charAt(0).toUpperCase() + val.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Session Notes */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Session Notes</p>
        <SmartNotesField
          value={sessionNotes}
          onChange={setSessionNotes}
          placeholder="Add notes…"
          rows={3}
        />
        <SessionNotesImages sessionId={sessionId} initialImages={initialNotesImages} />
      </div>

      {/* Video Link & Invoice */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 space-y-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Session Video Link</p>
          <input
            type="url"
            value={sessionVideo}
            onChange={e => setSessionVideo(e.target.value)}
            placeholder="https://..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Invoice</p>
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setInvoiceMode('link')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${invoiceMode === 'link' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              External Link
            </button>
            <button
              type="button"
              onClick={() => setInvoiceMode('generate')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${invoiceMode === 'generate' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Generate Invoice
            </button>
          </div>

          {invoiceMode === 'link' ? (
            <input
              type="url"
              value={sessionInvoice}
              onChange={e => setSessionInvoice(e.target.value)}
              placeholder="https://your-accounting-app.com/invoice/..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <div>
              {sessionInvoice.startsWith('/practitioner/invoice/') ? (
                <div className="flex items-center gap-3">
                  <a
                    href={sessionInvoice}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 text-sm font-medium hover:underline"
                  >
                    View Invoice →
                  </a>
                  <button
                    type="button"
                    onClick={() => setSessionInvoice('')}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-600 whitespace-nowrap">Session fee ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={invoiceAmount}
                      onChange={e => setInvoiceAmount(e.target.value)}
                      placeholder="Use default rate"
                      className="w-36 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateInvoice}
                    disabled={generatingInvoice}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition-colors"
                  >
                    {generatingInvoice ? 'Creating…' : 'Create Invoice'}
                  </button>
                </div>
              )}
              {invoiceError && <p className="text-xs text-red-600 mt-2">{invoiceError}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Open session: simple Q&A editor */}
      {isOpenSession && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 space-y-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Questions &amp; Responses</p>
          {openQuestions.map((q, idx) => (
            <div key={q.id} className="border border-gray-100 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-400">Q{idx + 1}</p>
                {openQuestions.length > 1 && (
                  <button type="button" onClick={() => removeOpenQuestion(q.id)} className="text-xs text-gray-300 hover:text-red-400">Remove</button>
                )}
              </div>
              <input
                type="text"
                value={q.questionText}
                onChange={e => updateOpenQuestion(q.id, { questionText: e.target.value })}
                placeholder="Question…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                value={q.capturedAnswer}
                onChange={e => updateOpenQuestion(q.id, { capturedAnswer: e.target.value })}
                placeholder="Speller's response…"
                rows={3}
                className="w-full border border-pink-200 bg-pink-50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300 resize-none"
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Misspokes:</span>
                <Stepper value={q.misspokeCount} onChange={n => updateOpenQuestion(q.id, { misspokeCount: n })} />
                {q.capturedAnswer.replace(/\s/g, '').length > 0 && (
                  <span className="text-xs font-semibold text-blue-500 ml-2">{q.capturedAnswer.replace(/\s/g, '').length} letters</span>
                )}
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addOpenQuestion}
            className="w-full border-2 border-dashed border-gray-200 text-gray-400 hover:border-blue-400 hover:text-blue-500 rounded-xl py-2.5 text-sm font-medium transition-colors"
          >
            + Add Question
          </button>
        </div>
      )}

      {/* Per-hunk + writing prompt — regular lessons only */}
      {!isOpenSession && Object.entries(byHunk).sort(([a], [b]) => Number(a) - Number(b)).map(([hunkNum, items]) => {
        const hunkNumber = Number(hunkNum)
        const hasSkippedMarker = items.some(r => r.questionType === 'HUNK_SKIPPED')
        const allNotAsked = items
          .filter(r => r.questionType !== 'HUNK_SKIPPED' && r.questionType !== 'WRITING_PROMPT' && r.questionType !== 'EXTRA_SPELLING')
          .every(r => r.capturedAnswer === 'NOT_ASKED' || r.capturedAnswer === 'SKIPPED')
        const hunkIsSkipped = (hasSkippedMarker || allNotAsked) && !unskippedHunks.has(hunkNumber)
        return (
        <div key={hunkNum} className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Hunk {hunkNum}</h2>
            {hunkIsSkipped && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full uppercase tracking-wide">Skipped</span>
                <button
                  onClick={() => {
                    setUnskippedHunks(prev => new Set([...prev, hunkNumber]))
                    setEdits(prev => {
                      const next = { ...prev }
                      for (const r of items) {
                        if (next[r.id]) next[r.id] = { ...next[r.id], skipped: false, notAsked: false }
                      }
                      return next
                    })
                  }}
                  className="text-xs text-blue-600 font-semibold hover:underline"
                >
                  Unskip
                </button>
              </div>
            )}
          </div>

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

          {/* Extra spelling word slots */}
          {(extraKeywords[Number(hunkNum)] ?? []).map((slot, idx) => (
            <div key={`extra-${idx}`} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={slot.word}
                  onChange={e => updateExtraKeyword(Number(hunkNum), idx, { word: e.target.value.toUpperCase() })}
                  placeholder="Add word…"
                  className="text-sm font-bold text-gray-700 border border-gray-200 rounded px-2 py-1 w-28 outline-none focus:ring-2 focus:ring-blue-500 placeholder:normal-case placeholder:font-normal"
                />
                <span className="text-xs text-gray-400">{slot.word.replace(/\s/g, '').length}L</span>
              </div>
              <div className="flex items-center gap-3">
                {!slot.skipped && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400 mr-1">Misspokes:</span>
                    <Stepper value={slot.misspokeCount} onChange={n => updateExtraKeyword(Number(hunkNum), idx, { misspokeCount: n })} />
                  </div>
                )}
                <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={slot.skipped}
                    onChange={e => updateExtraKeyword(Number(hunkNum), idx, { skipped: e.target.checked, misspokeCount: 0 })}
                    className="rounded"
                  />
                  Skip
                </label>
              </div>
            </div>
          ))}

          {/* Questions */}
          {items.filter(r => r.questionType !== 'KEYWORD' && r.questionType !== 'WRITING_PROMPT').map(r => {
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
                  <div className="space-y-2 ml-1">
                    <div className="flex flex-wrap gap-2">
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
                    {!edit.notAsked && !edit.skipped && (
                      <input
                        type="text"
                        value={edit.spellerSentence}
                        onChange={e => update(r.id, { spellerSentence: e.target.value })}
                        placeholder="Speller's full sentence…"
                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
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
                  <div className="space-y-2 ml-1">
                    <div className="flex items-center gap-4">
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
                    {!edit.notAsked && (
                      <input
                        type="text"
                        value={edit.spellerSentence}
                        onChange={e => update(r.id, { spellerSentence: e.target.value })}
                        placeholder="Speller's full sentence…"
                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
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
                          placeholder="Short answer (word/phrase)…"
                          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={edit.spellerSentence}
                          onChange={e => update(r.id, { spellerSentence: e.target.value })}
                          placeholder="Speller's full sentence…"
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

          {/* Writing Prompt */}
          <div className="mt-4 pt-3 border-t border-pink-100">
            <p className="text-xs font-semibold text-pink-500 uppercase tracking-wide mb-1">Writing Prompt</p>
            {hunkPrompts[Number(hunkNum)] ? (
              <p className="text-xs text-pink-600 italic mb-2">{hunkPrompts[Number(hunkNum)]}</p>
            ) : null}
            <textarea
              value={writingResponses[Number(hunkNum)] ?? ''}
              onChange={e => setWritingResponses(prev => ({ ...prev, [Number(hunkNum)]: e.target.value }))}
              rows={3}
              placeholder="Student's written response…"
              className="w-full border border-pink-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300 resize-none bg-pink-50 placeholder:text-pink-300"
            />
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-500">Misspoke:</span>
              <button onClick={() => setWritingMisspokes(prev => ({ ...prev, [Number(hunkNum)]: Math.max(0, (prev[Number(hunkNum)] ?? 0) - 1) }))} className="w-7 h-7 rounded-full bg-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-300">−</button>
              <span className={`w-6 text-center font-bold text-sm ${(writingMisspokes[Number(hunkNum)] ?? 0) > 0 ? 'text-red-600' : 'text-gray-400'}`}>{writingMisspokes[Number(hunkNum)] ?? 0}</span>
              <button onClick={() => setWritingMisspokes(prev => ({ ...prev, [Number(hunkNum)]: (prev[Number(hunkNum)] ?? 0) + 1 }))} className="w-7 h-7 rounded-full bg-red-100 text-red-700 font-bold text-sm hover:bg-red-200">+</button>
            </div>
          </div>
        </div>
        )
      })}

      {saveError && <p className="text-red-600 text-sm mb-4">{saveError}</p>}

      <button
        onClick={resetAllMisspokes}
        className="w-full mb-3 bg-gray-50 text-gray-500 py-2 rounded-xl font-medium text-sm border border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
      >
        Reset all misspoke counts to 0
      </button>

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
