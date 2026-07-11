'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Student } from '@/lib/practitionerStore'

const STATE_OPTIONS = [
  'Happy', 'Excited', 'High energy',
  'Anxious', 'Frustrated', 'Sad', 'Overwhelmed',
  'Overstimulated', 'Understimulated', 'Sensory seeking',
  'Low energy', 'Shutdown', 'Stuck in loops',
  'Distracted', 'Transition difficulty',
  'Hungry', 'Tired', 'Sick', 'Pain',
]

interface QuestionRow {
  id: number
  question: string
  response: string
  misspokeCount: number
}

function MisspokeCounter({ value, onChange }: { value: number; onChange: (delta: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => onChange(-1)} className="w-7 h-7 rounded-full bg-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-300">−</button>
      <span className={`w-5 text-center font-bold text-sm ${value > 0 ? 'text-red-600' : 'text-gray-400'}`}>{value}</span>
      <button type="button" onClick={() => onChange(1)} className="w-7 h-7 rounded-full bg-red-100 text-red-700 font-bold text-sm hover:bg-red-200">+</button>
    </div>
  )
}

export default function OpenSessionForm({ students }: { students: Student[] }) {
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
  const [questions, setQuestions] = useState<QuestionRow[]>([{ id: 1, question: '', response: '', misspokeCount: 0 }])
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [generatingInvoice, setGeneratingInvoice] = useState(false)
  const [error, setError] = useState('')
  const nextId = useRef(2)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )
  const selectedStudent = students.find(s => s.id === studentId)

  function addQuestion() {
    setQuestions(prev => [...prev, { id: nextId.current++, question: '', response: '', misspokeCount: 0 }])
  }

  function removeQuestion(id: number) {
    setQuestions(prev => prev.filter(q => q.id !== id))
  }

  function updateQuestion(id: number, changes: Partial<QuestionRow>) {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...changes } : q))
  }

  function toggleState(s: string) {
    setStudentStates(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setSelectedPhotos(prev => [...prev, ...files])
    files.forEach(file => {
      const url = URL.createObjectURL(file)
      setPhotoPreviews(prev => [...prev, url])
    })
    if (photoInputRef.current) photoInputRef.current.value = ''
  }

  function removePhoto(index: number) {
    URL.revokeObjectURL(photoPreviews[index])
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index))
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index))
  }

  function getFilledQuestions() {
    return questions.filter(q => q.question.trim())
  }

  async function saveNewSession(): Promise<string | null> {
    const filled = getFilledQuestions()
    const res = await fetch('/api/practitioner/open-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId,
        sessionDate,
        questions: filled.map(q => ({ question: q.question.trim(), response: q.response.trim(), misspokeCount: q.misspokeCount })),
        sessionNotes,
        sessionVideo,
        invoiceLink: showExternalLink ? invoiceLink.trim() : null,
        regulationArrival: regArrival,
        regulationDeparture: regDeparture,
        studentStates,
      }),
    })
    const data = await res.json()
    if (!res.ok) return null
    for (const photo of selectedPhotos) {
      const fd = new FormData()
      fd.append('file', photo)
      await fetch(`/api/practitioner/sessions/${data.sessionId}/notes-images`, { method: 'POST', body: fd })
    }
    return data.sessionId
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!studentId) { setError('Please select a student.'); return }
    if (!getFilledQuestions().length) { setError('Enter at least one question.'); return }
    setSaving(true)
    setError('')
    const sessionId = await saveNewSession()
    if (!sessionId) { setError('Failed to save session.'); setSaving(false); return }
    router.push(`/practitioner/transcript/${sessionId}`)
  }

  async function handleGenerateInvoice() {
    if (!studentId) { alert('Please select a student first.'); return }
    if (!getFilledQuestions().length) { alert('Please enter at least one question first.'); return }
    setGeneratingInvoice(true)
    try {
      const sessionId = await saveNewSession()
      if (!sessionId) { alert('Failed to save session.'); setGeneratingInvoice(false); return }
      const res = await fetch('/api/practitioner/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
      const data = await res.json()
      if (data.invoiceId) {
        router.push(`/practitioner/invoice/${data.invoiceId}`)
      } else {
        alert(data.error ?? 'Failed to generate invoice')
        setGeneratingInvoice(false)
      }
    } catch {
      alert('An error occurred. Please try again.')
      setGeneratingInvoice(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/practitioner/dashboard" className="text-sm text-blue-600 hover:underline">← Dashboard</Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-900">Open Session</h1>

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

        <textarea
          value={sessionNotes}
          onChange={e => setSessionNotes(e.target.value)}
          placeholder="Session notes…"
          rows={2}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
        />

        {/* Session note photos */}
        <div>
          <p className="text-xs text-gray-400 mb-1.5">Session Photos</p>
          {photoPreviews.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {photoPreviews.map((src, i) => (
                <div key={i} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs font-bold flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            multiple
            className="hidden"
            onChange={handlePhotoSelect}
          />
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors border border-gray-200"
          >
            + Add Photo
          </button>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Session Video URL</label>
          <input
            type="url"
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
          {showExternalLink && (
            <input
              type="url"
              value={invoiceLink}
              onChange={e => setInvoiceLink(e.target.value)}
              placeholder="https://your-accounting-app.com/invoice/…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          )}
        </div>
      </div>

      {/* Questions */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Questions & Responses</p>

        {questions.map((q, idx) => {
          const letters = q.response.replace(/\s/g, '').length
          return (
            <div key={q.id} className="border border-gray-100 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400">Q{idx + 1}</span>
                {questions.length > 1 && (
                  <button type="button" onClick={() => removeQuestion(q.id)} className="text-gray-300 hover:text-red-400 text-xs">Remove</button>
                )}
              </div>

              <input
                type="text"
                value={q.question}
                onChange={e => updateQuestion(q.id, { question: e.target.value })}
                placeholder="Question…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <textarea
                value={q.response}
                onChange={e => updateQuestion(q.id, { response: e.target.value })}
                placeholder="Speller's response…"
                rows={2}
                className="w-full border border-pink-200 bg-pink-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none placeholder-pink-300"
              />

              <div className="flex items-center gap-4">
                {letters > 0 && (
                  <span className="text-xs font-semibold text-blue-500">{letters} letters</span>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Misspokes:</span>
                  <MisspokeCounter value={q.misspokeCount} onChange={d => updateQuestion(q.id, { misspokeCount: Math.max(0, q.misspokeCount + d) })} />
                </div>
              </div>
            </div>
          )
        })}

        <button
          type="button"
          onClick={addQuestion}
          className="w-full border-2 border-dashed border-gray-200 text-gray-400 hover:border-blue-400 hover:text-blue-500 rounded-xl py-2.5 text-sm font-medium transition-colors"
        >
          + Add Question
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
      >
        {saving ? 'Saving…' : 'Save Session'}
      </button>
    </form>
  )
}
