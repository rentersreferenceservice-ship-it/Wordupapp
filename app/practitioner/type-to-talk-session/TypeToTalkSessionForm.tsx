'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Student } from '@/lib/practitionerStore'
import SmartNotesField from '@/app/practitioner/components/SmartNotesField'
import TypeToTalkSurface, { type TypeToTalkSurfaceHandle } from '@/app/components/TypeToTalkSurface'

const STATE_OPTIONS = [
  'Happy', 'Excited', 'High energy',
  'Anxious', 'Frustrated', 'Sad', 'Overwhelmed',
  'Overstimulated', 'Understimulated', 'Sensory seeking',
  'Low energy', 'Shutdown', 'Stuck in loops',
  'Distracted', 'Transition difficulty',
  'Hungry', 'Tired', 'Sick', 'Pain',
]

export default function TypeToTalkSessionForm({ students }: { students: Student[] }) {
  const router = useRouter()
  const [studentId, setStudentId] = useState('')
  const [search, setSearch] = useState('')
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0])
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

  const surfaceRef = useRef<TypeToTalkSurfaceHandle>(null)

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )
  const selectedStudent = students.find(s => s.id === studentId)

  function toggleState(s: string) {
    setStudentStates(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  async function saveSession(): Promise<string | null> {
    const paragraphs = surfaceRef.current?.getAllParagraphs() ?? []
    const res = await fetch('/api/practitioner/type-to-talk-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId,
        sessionDate,
        paragraphs,
        sessionNotes,
        sessionVideo,
        invoiceLink: showExternalLink ? invoiceLink.trim() : null,
        regulationArrival: regArrival,
        regulationDeparture: regDeparture,
        studentStates,
        excludeFromAccuracy,
      }),
    })
    const data = await res.json()
    if (!res.ok || !data.sessionId) { setError(data.error ?? 'Failed to save session'); return null }
    return data.sessionId
  }

  async function handleFinishSession() {
    if (!studentId) { setError('Please select a student.'); return }
    if (!surfaceRef.current?.getAllParagraphs().length) { setError('Type at least one paragraph.'); return }
    setSaving(true)
    setError('')
    try {
      const sessionId = await saveSession()
      if (!sessionId) { setSaving(false); return }
      router.push(`/practitioner/transcript/${sessionId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save session')
      setSaving(false)
    }
  }

  async function handleGenerateInvoice() {
    if (!studentId) { setError('Please select a student.'); return }
    if (!surfaceRef.current?.getAllParagraphs().length) { setError('Type at least one paragraph.'); return }
    setGeneratingInvoice(true)
    setError('')
    try {
      const sessionId = await saveSession()
      if (!sessionId) { setGeneratingInvoice(false); return }
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
              <button type="button" onClick={() => { setStudentId(''); setSearch('') }} className="text-xs text-blue-400 hover:text-blue-600">Change</button>
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
                        onClick={() => { setStudentId(s.id); setSearch('') }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b border-gray-50 last:border-0"
                      >
                        {s.name} <span className="text-gray-400 text-xs">{s.ageGroup}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Session Date</label>
          <input
            type="date"
            value={sessionDate}
            onChange={e => setSessionDate(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

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
              disabled={generatingInvoice}
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

      {/* Writing surface */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <TypeToTalkSurface ref={surfaceRef} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleFinishSession}
        disabled={saving}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
      >
        {saving ? 'Saving…' : 'Finish Session'}
      </button>
    </div>
  )
}
