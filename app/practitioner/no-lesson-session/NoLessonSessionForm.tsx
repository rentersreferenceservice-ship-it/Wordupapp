'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface StudentOption {
  id: string
  name: string
  guardianEmail: string
}

function ytIdFromUrl(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return m?.[1] ?? null
}

export default function NoLessonSessionForm({ students, practitionerName, today }: { students: StudentOption[]; practitionerName: string; today: string }) {
  const router = useRouter()
  const [studentId, setStudentId] = useState('')
  const [to, setTo] = useState('')
  const [note, setNote] = useState('')
  const [invoice, setInvoice] = useState('')
  const [video, setVideo] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recognizing, setRecognizing] = useState(false)

  const [showInvoiceForm, setShowInvoiceForm] = useState(false)
  const [invoiceDescription, setInvoiceDescription] = useState('')
  const [invoiceAmount, setInvoiceAmount] = useState('')
  const [generatingInvoice, setGeneratingInvoice] = useState(false)
  const [invoiceError, setInvoiceError] = useState('')

  const recognitionRef = useRef<any | null>(null)
  const baseNoteRef = useRef('')

  useEffect(() => {
    return () => stopRecognition()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function stopRecognition() {
    try {
      const r = recognitionRef.current
      if (r && typeof r.stop === 'function') r.stop()
    } catch {}
    recognitionRef.current = null
    setRecognizing(false)
  }

  function startRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser')
      return
    }
    try {
      baseNoteRef.current = note
      const r = new SpeechRecognition()
      r.lang = 'en-US'
      r.interimResults = true
      r.maxAlternatives = 1
      r.continuous = false
      r.onresult = (ev: any) => {
        let interim = ''
        let final = ''
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          const res = ev.results[i]
          if (res.isFinal) final += res[0].transcript
          else interim += res[0].transcript
        }
        setNote(baseNoteRef.current + final + interim)
      }
      r.onend = () => {
        baseNoteRef.current = note
        setRecognizing(false)
        recognitionRef.current = null
      }
      r.onerror = (ev: any) => {
        console.error('Speech recognition error', ev)
        setError('Speech recognition error')
        stopRecognition()
      }
      recognitionRef.current = r
      r.start()
      setRecognizing(true)
      setError(null)
    } catch (e) {
      console.error(e)
      setError('Could not start speech recognition')
    }
  }

  function toggleRecognition() {
    if (recognizing) stopRecognition()
    else startRecognition()
  }

  function handleStudentChange(id: string) {
    setStudentId(id)
    const s = students.find(s => s.id === id)
    if (s?.guardianEmail) setTo(s.guardianEmail)
  }

  async function handleGenerateInvoice() {
    if (!studentId) { setInvoiceError('Select a student first'); return }
    if (!invoiceAmount.trim() || isNaN(parseFloat(invoiceAmount))) { setInvoiceError('Enter a valid amount'); return }
    setGeneratingInvoice(true)
    setInvoiceError('')
    try {
      const res = await fetch('/api/practitioner/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, description: invoiceDescription, amount: parseFloat(invoiceAmount) }),
      })
      const data = await res.json()
      if (!res.ok || !data.invoiceId) { setInvoiceError(data.error ?? 'Failed to create invoice'); setGeneratingInvoice(false); return }
      setInvoice(`/practitioner/invoice/${data.invoiceId}`)
      setShowInvoiceForm(false)
    } catch (e) {
      setInvoiceError(e instanceof Error ? e.message : 'Failed to create invoice')
    } finally {
      setGeneratingInvoice(false)
    }
  }

  async function handleSend() {
    setError(null)
    const recipients = to.split(',').map(s => s.trim()).filter(Boolean)
    if (recipients.length === 0 || recipients.some(r => !r.includes('@'))) {
      setError('Enter one or more valid email addresses, comma-separated')
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/practitioner/no-lesson-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: recipients, note, invoice, video }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Send failed')
        setSending(false)
        return
      }
      setSent(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Send failed')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
        <p className="text-green-600 font-semibold text-lg mb-1">✓ Sent</p>
        <p className="text-sm text-gray-500 mb-4">The update was emailed to {to}.</p>
        <button
          onClick={() => router.push('/practitioner/dashboard')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  const ytId = ytIdFromUrl(video.trim())
  const generatedInvoiceId = invoice.startsWith('/practitioner/invoice/') ? invoice.split('/').pop() : null
  const selectedStudent = students.find(s => s.id === studentId)

  return (
    <>
      {/* Student picker — first thing on the page */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Student (optional)</label>
        <select
          value={studentId}
          onChange={e => handleStudentChange(e.target.value)}
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white"
        >
          <option value="">— No student selected —</option>
          {students.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Header — mirrors the session transcript header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <img src="/word_up_clean.jpeg" alt="Word Up" style={{ width: 100, marginBottom: 8 }} />
            <h1 className="text-2xl font-bold text-gray-900">No Lesson Session</h1>
            <p className="text-gray-600 mt-1">Session update without a lesson</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{selectedStudent?.name ?? practitionerName}</p>
            <p className="text-sm text-gray-500 mt-1">{today}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Recipient email</label>
          <input value={to} onChange={e => setTo(e.target.value)} placeholder="Email" className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" />
        </div>

        <div className="relative">
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">No lesson note</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={6} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm pr-10" placeholder="Write the session update or note here..." />
          <button
            onClick={toggleRecognition}
            title={recognizing ? 'Stop dictation' : 'Start dictation'}
            className={`absolute right-2 top-8 p-1 rounded-md ${recognizing ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-700'}`}
          >
            {recognizing ? '●' : '🎤'}
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Invoice</label>
          {generatedInvoiceId ? (
            <div className="flex items-center gap-2 border border-green-200 bg-green-50 rounded-md px-3 py-2">
              <span className="text-sm text-green-700 font-medium flex-1">Invoice generated</span>
              <a href={`/practitioner/invoice/${generatedInvoiceId}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline">View</a>
              <button onClick={() => setInvoice('')} className="text-xs text-gray-400 hover:text-red-500">Remove</button>
            </div>
          ) : showInvoiceForm ? (
            <div className="border border-gray-200 rounded-md p-3 space-y-2">
              {!studentId && <p className="text-xs text-amber-600">Select a student above to generate an invoice.</p>}
              <input
                value={invoiceDescription}
                onChange={e => setInvoiceDescription(e.target.value)}
                placeholder="Description (e.g. Materials fee, Makeup session)"
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
              />
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={invoiceAmount}
                  onChange={e => setInvoiceAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-32 border border-gray-200 rounded-md px-3 py-2 text-sm"
                />
              </div>
              {invoiceError && <p className="text-xs text-red-600">{invoiceError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleGenerateInvoice}
                  disabled={generatingInvoice || !studentId}
                  className="bg-green-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {generatingInvoice ? 'Creating…' : 'Create Invoice'}
                </button>
                <button onClick={() => { setShowInvoiceForm(false); setInvoiceError('') }} className="text-gray-500 text-sm">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input value={invoice} onChange={e => setInvoice(e.target.value)} placeholder="Paste invoice URL (optional)" className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm" />
              <button onClick={() => setShowInvoiceForm(true)} className="text-xs font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap">+ Generate</button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Video link</label>
          <input value={video} onChange={e => setVideo(e.target.value)} placeholder="Paste YouTube or video URL (optional)" className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" />
          {video.trim() && (
            ytId ? (
              <div className="rounded-xl overflow-hidden mt-2" style={{ aspectRatio: '16/9', maxWidth: 480 }}>
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <p className="text-xs text-gray-400 mt-1">Preview isn&apos;t available for non-YouTube links, but the link will still be included.</p>
            )
          )}
        </div>

        <p className="text-xs text-gray-500">This email will include the practice branding, note, optional invoice, and optional video link in a transcript-style layout.</p>

        <div className="flex items-center gap-2 pt-1">
          <button onClick={handleSend} disabled={sending} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">{sending ? 'Sending…' : 'Send'}</button>
          <button onClick={() => router.push('/practitioner/dashboard')} className="text-gray-500 text-sm">Cancel</button>
          {error && <span className="text-red-500 text-xs">{error}</span>}
        </div>
      </div>
      </div>
    </>
  )
}
