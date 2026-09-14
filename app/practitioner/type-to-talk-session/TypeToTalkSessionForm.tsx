'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Student } from '@/lib/practitionerStore'
import type { RealtimeChannel } from '@supabase/supabase-js'
import SmartNotesField from '@/app/practitioner/components/SmartNotesField'
import { getSupabaseBrowserClient } from '@/lib/supabaseClient'
import { generateQRDataUrlFromUrl } from '@/lib/qrcode'

const STATE_OPTIONS = [
  'Happy', 'Excited', 'High energy',
  'Anxious', 'Frustrated', 'Sad', 'Overwhelmed',
  'Overstimulated', 'Understimulated', 'Sensory seeking',
  'Low energy', 'Shutdown', 'Stuck in loops',
  'Distracted', 'Transition difficulty',
  'Hungry', 'Tired', 'Sick', 'Pain',
]

interface QARow {
  id: number
  question: string
  answer: string
  misspokeCount: number
}

export default function TypeToTalkSessionForm({ students }: { students: Student[] }) {
  const router = useRouter()
  const [studentId, setStudentId] = useState('')
  const [search, setSearch] = useState('')
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [startingSession, setStartingSession] = useState(false)
  const [regArrival, setRegArrival] = useState<string | null>(null)
  const [regDeparture, setRegDeparture] = useState<string | null>(null)
  const [studentStates, setStudentStates] = useState<string[]>([])
  const [sessionNotes, setSessionNotes] = useState('')
  const [sessionVideo, setSessionVideo] = useState('')
  const [showExternalLink, setShowExternalLink] = useState(false)
  const [invoiceLink, setInvoiceLink] = useState('')
  const [excludeFromAccuracy, setExcludeFromAccuracy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generatingInvoice, setGeneratingInvoice] = useState(false)
  const [error, setError] = useState('')

  const [qaRows, setQaRows] = useState<QARow[]>([{ id: 1, question: '', answer: '', misspokeCount: 0 }])
  const nextRowIdRef = useRef(2)

  // Type to Talk live sync — a paired tablet the student answers from
  const [ttPanelOpen, setTtPanelOpen] = useState(false)
  const [ttCode, setTtCode] = useState<string | null>(null)
  const [ttQrDataUrl, setTtQrDataUrl] = useState<string | null>(null)
  const [ttConnecting, setTtConnecting] = useState(false)
  const [ttError, setTtError] = useState('')
  const [activeTtRow, setActiveTtRowState] = useState<{ rowId: number; sequence: number } | null>(null)
  const ttChannelRef = useRef<RealtimeChannel | null>(null)
  const ttConnectingRef = useRef(false)
  const activeTtRowRef = useRef<{ rowId: number; sequence: number } | null>(null)
  const ttSequenceRef = useRef(0)

  function setActiveTtRow(value: { rowId: number; sequence: number } | null) {
    activeTtRowRef.current = value
    setActiveTtRowState(value)
  }

  useEffect(() => {
    return () => {
      if (ttChannelRef.current) getSupabaseBrowserClient().removeChannel(ttChannelRef.current)
    }
  }, [])

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )
  const selectedStudent = students.find(s => s.id === studentId)

  function toggleState(s: string) {
    setStudentStates(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  function addRow() {
    setQaRows(prev => [...prev, { id: nextRowIdRef.current++, question: '', answer: '', misspokeCount: 0 }])
  }

  function removeRow(id: number) {
    setQaRows(prev => prev.filter(r => r.id !== id))
  }

  function updateRowQuestion(id: number, question: string) {
    setQaRows(prev => prev.map(r => r.id === id ? { ...r, question } : r))
  }

  function setRowAnswer(rowId: number, answer: string) {
    setQaRows(prev => prev.map(r => r.id === rowId ? { ...r, answer } : r))
  }

  function setRowMisspoke(rowId: number, count: number) {
    setQaRows(prev => prev.map(r => r.id === rowId ? { ...r, misspokeCount: count } : r))
  }

  async function handleSelectStudent(id: string) {
    setStudentId(id)
    setSearch('')
    if (sessionId || startingSession) return
    setStartingSession(true)
    setError('')
    try {
      const res = await fetch('/api/practitioner/type-to-talk-session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: id, sessionDate }),
      })
      const data = await res.json()
      if (!res.ok || !data.sessionId) { setError(data.error ?? 'Failed to start session'); return }
      setSessionId(data.sessionId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start session')
    } finally {
      setStartingSession(false)
    }
  }

  async function ensureTtChannel() {
    if (!sessionId || ttChannelRef.current || ttConnectingRef.current) return
    ttConnectingRef.current = true
    setTtConnecting(true)
    setTtError('')
    try {
      const res = await fetch(`/api/practitioner/sessions/${sessionId}/tt-pairing`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.code) {
        setTtError(data.error ?? 'Could not connect a tablet — please try again.')
        return
      }
      setTtCode(data.code)
      const shareUrl = `${window.location.origin}/type-to-talk/live/${data.code}`
      generateQRDataUrlFromUrl(shareUrl).then(setTtQrDataUrl).catch(() => {})

      const supabase = getSupabaseBrowserClient()
      const channel = supabase.channel(`tt:${sessionId}`, { config: { broadcast: { self: false } } })
      channel
        .on('broadcast', { event: 'answer' }, (payload) => {
          const answer = payload.payload as { sequence: number; combinedText: string; totalMisspokeCount: number }
          const active = activeTtRowRef.current
          if (!active || active.sequence !== answer.sequence) return
          setRowAnswer(active.rowId, answer.combinedText)
          setRowMisspoke(active.rowId, answer.totalMisspokeCount)
        })
        .subscribe()
      ttChannelRef.current = channel
    } catch {
      setTtError('Could not connect a tablet — check your connection and try again.')
    } finally {
      ttConnectingRef.current = false
      setTtConnecting(false)
    }
  }

  async function handleSendToTt(rowId: number, questionText: string) {
    if (!questionText.trim()) return
    await ensureTtChannel()
    if (!ttChannelRef.current) return
    const sequence = ++ttSequenceRef.current
    setActiveTtRow({ rowId, sequence })
    ttChannelRef.current.send({
      type: 'broadcast',
      event: 'question',
      payload: { sequence, questionText, hunkNumber: 1 },
    })
  }

  function buildResponses(complete: boolean) {
    const filled = qaRows.filter(r => r.question.trim())
    return [
      { hunkNumber: 0, questionType: 'SESSION_STATE', questionText: 'Student State', capturedAnswer: studentStates.join(', '), expectedAnswer: '', misspokeCount: 0 },
      { hunkNumber: 0, questionType: 'SESSION_NOTES', questionText: 'Session Notes', capturedAnswer: sessionNotes, expectedAnswer: '', misspokeCount: 0 },
      ...(sessionVideo.trim() ? [{ hunkNumber: 0, questionType: 'SESSION_VIDEO', questionText: 'Session Video', capturedAnswer: sessionVideo.trim(), expectedAnswer: '', misspokeCount: 0 }] : []),
      ...(showExternalLink && invoiceLink.trim() ? [{ hunkNumber: 0, questionType: 'SESSION_INVOICE', questionText: 'Invoice', capturedAnswer: invoiceLink.trim(), expectedAnswer: '', misspokeCount: 0 }] : []),
      ...(excludeFromAccuracy ? [{ hunkNumber: 0, questionType: 'ACCURACY_EXCLUDED', questionText: 'Accuracy Excluded', capturedAnswer: 'true', expectedAnswer: '', misspokeCount: 0 }] : []),
      ...(complete ? [{ hunkNumber: 0, questionType: 'SESSION_COMPLETE', questionText: 'Session Complete', capturedAnswer: 'true', expectedAnswer: '', misspokeCount: 0 }] : []),
      ...filled.map((r, i) => ({
        hunkNumber: i + 1,
        questionType: 'OPEN',
        questionText: r.question.trim(),
        capturedAnswer: r.answer,
        expectedAnswer: '',
        misspokeCount: r.misspokeCount,
      })),
    ]
  }

  async function saveResponses(complete: boolean): Promise<boolean> {
    if (!sessionId) return false
    await fetch(`/api/practitioner/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ regulation_arrival: regArrival, regulation_departure: regDeparture }),
    }).catch(() => {})
    const res = await fetch(`/api/practitioner/sessions/${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ responses: buildResponses(complete) }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Failed to save session')
      return false
    }
    return true
  }

  async function handleFinishSession() {
    if (!studentId || !sessionId) { setError('Please select a student.'); return }
    if (!qaRows.some(r => r.question.trim())) { setError('Add at least one question.'); return }
    setSaving(true)
    setError('')
    try {
      const ok = await saveResponses(true)
      if (!ok) { setSaving(false); return }
      if (ttChannelRef.current) {
        ttChannelRef.current.send({ type: 'broadcast', event: 'session-end', payload: {} })
      }
      router.push(`/practitioner/transcript/${sessionId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save session')
      setSaving(false)
    }
  }

  async function handleGenerateInvoice() {
    if (!studentId || !sessionId) { setError('Please select a student.'); return }
    setGeneratingInvoice(true)
    setError('')
    try {
      const ok = await saveResponses(false)
      if (!ok) { setGeneratingInvoice(false); return }
      const res = await fetch('/api/practitioner/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
      const data = await res.json()
      if (data.invoiceId) {
        router.push(`/practitioner/invoice/${data.invoiceId}`)
      } else {
        setError(data.error ?? 'Failed to generate invoice')
        setGeneratingInvoice(false)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate invoice')
      setGeneratingInvoice(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/practitioner/dashboard" className="text-sm text-blue-600 hover:underline">← Dashboard</Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-900">Type to Talk Session</h1>

      {/* Accuracy exclusion — session level */}
      <button
        type="button"
        onClick={() => setExcludeFromAccuracy(v => !v)}
        className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-colors ${
          excludeFromAccuracy
            ? 'bg-amber-50 border-amber-400'
            : 'bg-white border-gray-200 hover:border-amber-300'
        }`}
      >
        <div className="text-left">
          <p className={`text-sm font-bold ${excludeFromAccuracy ? 'text-amber-800' : 'text-gray-700'}`}>
            {excludeFromAccuracy ? '⚠ This session is excluded from accuracy tracking' : 'Exclude this session from accuracy tracking'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {excludeFromAccuracy ? 'Session will appear as 0% in the accuracy graph' : 'Use when session data should not count toward the speller\'s accuracy graph'}
          </p>
        </div>
        <div className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ml-4 ${excludeFromAccuracy ? 'bg-amber-400' : 'bg-gray-200'}`}>
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${excludeFromAccuracy ? 'left-6' : 'left-0.5'}`} />
        </div>
      </button>

      {/* Student + Date */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Student</label>
          {selectedStudent ? (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5">
              <span className="font-semibold text-blue-800">{selectedStudent.name}</span>
              {!sessionId && (
                <button type="button" onClick={() => { setStudentId(''); setSearch('') }} className="text-xs text-blue-400 hover:text-blue-600">Change</button>
              )}
            </div>
          ) : (
            <div>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search students…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-1"
              />
              {search && (
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  {filteredStudents.length === 0 ? (
                    <p className="text-sm text-gray-400 px-3 py-2">No students found</p>
                  ) : (
                    filteredStudents.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectStudent(s.id)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b border-gray-50 last:border-0"
                      >
                        {s.name} <span className="text-gray-400 text-xs">{s.ageGroup}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
              {startingSession && <p className="text-xs text-gray-400 mt-1">Starting session…</p>}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Session Date</label>
          <input
            type="date"
            value={sessionDate}
            onChange={e => setSessionDate(e.target.value)}
            disabled={!!sessionId}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
          />
        </div>
      </div>

      {/* Connect a tablet */}
      {sessionId && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            type="button"
            onClick={() => { setTtPanelOpen(o => !o); if (!ttPanelOpen) ensureTtChannel() }}
            className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <span>📱 Connect a tablet {ttCode ? '· Connected' : ''}</span>
            <span className="text-gray-400">{ttPanelOpen ? '▲' : '▼'}</span>
          </button>
          {ttPanelOpen && (
            <div className="px-5 pb-5 border-t border-gray-100 pt-4 flex items-center gap-4 flex-wrap">
              {ttConnecting && !ttCode && <p className="text-sm text-gray-400">Connecting…</p>}
              {ttError && (
                <div className="flex items-center gap-2">
                  <p className="text-sm text-red-600">{ttError}</p>
                  <button type="button" onClick={ensureTtChannel} className="text-xs text-blue-600 hover:underline">Retry</button>
                </div>
              )}
              {ttQrDataUrl && (
                <a href={`${typeof window !== 'undefined' ? window.location.origin : ''}/type-to-talk/live/${ttCode}`} target="_blank" rel="noopener noreferrer" className="shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ttQrDataUrl} alt="QR code to connect a student tablet" width={90} height={90} className="bg-white rounded-lg border border-gray-100" />
                </a>
              )}
              <div className="flex-1 min-w-[200px]">
                {ttCode && <p className="text-sm text-gray-700">Code: <span className="font-mono font-bold tracking-wider">{ttCode}</span></p>}
                <p className="text-xs text-gray-400 mt-0.5">Scan or enter this code on the student&apos;s tablet, then use &quot;Send to Speller&apos;s Tablet&quot; on any question to send it there.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Observation */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Student Observation</p>

        <div>
          <p className="text-xs text-gray-400 mb-1.5">Arrived</p>
          <div className="flex gap-2">
            {['regulated', 'dysregulated'].map(val => (
              <button key={val} type="button"
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

        <div className="flex flex-wrap gap-2">
          {STATE_OPTIONS.map(s => (
            <button key={s} type="button"
              onClick={() => toggleState(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-colors ${
                studentStates.includes(s)
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div>
          <p className="text-xs text-gray-400 mb-1.5">Departed</p>
          <div className="flex gap-2">
            {['regulated', 'dysregulated'].map(val => (
              <button key={val} type="button"
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

        <SmartNotesField
          value={sessionNotes}
          onChange={setSessionNotes}
          placeholder="Session notes…"
          rows={2}
        />

        <div>
          <label className="block text-xs text-gray-400 mb-1">Session Video URL</label>
          <input
            type="text"
            inputMode="url"
            value={sessionVideo}
            onChange={e => setSessionVideo(e.target.value)}
            placeholder="https://youtube.com/…"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <div>
          <p className="text-xs text-gray-400 mb-1.5">Invoice</p>
          <div className="flex gap-2 mb-2">
            <button
              type="button"
              onClick={() => setShowExternalLink(v => !v)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${showExternalLink ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              External Link
            </button>
            <button
              type="button"
              disabled={generatingInvoice || !sessionId}
              onClick={handleGenerateInvoice}
              className="bg-green-600 text-white border-2 border-green-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition-colors"
            >
              {generatingInvoice ? 'Creating…' : 'Generate Invoice'}
            </button>
          </div>
          <p className="text-xs text-gray-400">Generating an invoice saves the session so far and takes you to the invoice — same as Open Session.</p>
          {showExternalLink && (
            <input
              type="url"
              value={invoiceLink}
              onChange={e => setInvoiceLink(e.target.value)}
              placeholder="https://your-accounting-app.com/invoice/…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 mt-2"
            />
          )}
        </div>
      </div>

      {/* Questions & Responses */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Questions &amp; Responses</p>
        {!sessionId && <p className="text-xs text-amber-600">Select a student above to start the session.</p>}

        {qaRows.map((row, idx) => {
          const isActive = activeTtRow?.rowId === row.id
          return (
            <div key={row.id} className="border border-gray-100 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400">Q{idx + 1}</span>
                {qaRows.length > 1 && (
                  <button type="button" onClick={() => removeRow(row.id)} className="text-gray-300 hover:text-red-400 text-xs">Remove</button>
                )}
              </div>
              <input
                type="text"
                value={row.question}
                onChange={e => updateRowQuestion(row.id, e.target.value)}
                placeholder="Question…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                value={row.answer}
                onChange={e => setRowAnswer(row.id, e.target.value)}
                placeholder="Speller's response — type here, or send to their tablet below…"
                rows={2}
                className="w-full border border-pink-200 bg-pink-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none placeholder-pink-300"
              />
              <div className="flex items-center gap-3 flex-wrap">
                {row.answer && (
                  <span className="text-xs font-semibold text-blue-500">{row.answer.replace(/\s/g, '').length} letters</span>
                )}
                {row.misspokeCount > 0 && (
                  <span className="text-xs font-semibold text-red-500">{row.misspokeCount} misspoke{row.misspokeCount === 1 ? '' : 's'}</span>
                )}
                <button
                  type="button"
                  disabled={!sessionId || !row.question.trim()}
                  onClick={() => handleSendToTt(row.id, row.question)}
                  className={`ml-auto text-xs px-3 py-1 rounded-lg border font-medium transition-colors disabled:opacity-40 ${
                    isActive ? 'text-purple-700 bg-purple-100 border-purple-300' : 'text-purple-600 border-purple-200 hover:bg-purple-50'
                  }`}
                >
                  {isActive ? '✓ Sent to Speller’s Tablet' : 'Send to Speller’s Tablet'}
                </button>
              </div>
            </div>
          )
        })}

        <button
          type="button"
          onClick={addRow}
          className="w-full border-2 border-dashed border-gray-200 text-gray-400 hover:border-blue-400 hover:text-blue-500 rounded-xl py-2.5 text-sm font-medium transition-colors"
        >
          + Add Question
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleFinishSession}
        disabled={saving || !sessionId}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
      >
        {saving ? 'Saving…' : 'Finish Session'}
      </button>
    </div>
  )
}
