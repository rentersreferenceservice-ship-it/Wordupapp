'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function NoLessonSessionForm() {
  const router = useRouter()
  const [to, setTo] = useState('')
  const [note, setNote] = useState('')
  const [invoice, setInvoice] = useState('')
  const [video, setVideo] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recognizing, setRecognizing] = useState(false)

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

  return (
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
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Invoice link</label>
          <input value={invoice} onChange={e => setInvoice(e.target.value)} placeholder="Paste invoice URL (optional)" className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Video link</label>
          <input value={video} onChange={e => setVideo(e.target.value)} placeholder="Paste YouTube or video URL (optional)" className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" />
        </div>

        <p className="text-xs text-gray-500">This email will include the practice branding, note, optional invoice, and optional video link in a transcript-style layout.</p>

        <div className="flex items-center gap-2 pt-1">
          <button onClick={handleSend} disabled={sending} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">{sending ? 'Sending…' : 'Send'}</button>
          <button onClick={() => router.push('/practitioner/dashboard')} className="text-gray-500 text-sm">Cancel</button>
          {error && <span className="text-red-500 text-xs">{error}</span>}
        </div>
      </div>
    </div>
  )
}
