'use client'

import { useState, useEffect, useRef } from 'react'

export default function NoLessonSessionForm({ defaultTo }: { defaultTo?: string }) {
  const [open, setOpen] = useState(false)
  const [to, setTo] = useState(defaultTo ?? '')
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
    if (!open) {
      setNote('')
      setInvoice('')
      setVideo('')
      setTo(defaultTo ?? '')
      setError(null)
      setSent(false)
      stopRecognition()
    }
    // cleanup on unmount
    return () => stopRecognition()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultTo])

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
        // when finished, advance base note
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
      <span className="text-sm text-green-600 font-medium px-3 py-2">✓ Sent</span>
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-gray-100 text-gray-700 border-2 border-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
      >
        No Lesson Session
      </button>
    )
  }

  return (
    <div className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm w-[360px] max-w-[90vw]">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold">No Lesson Session</h3>
          <p className="text-[11px] text-gray-500">Session update without a lesson</p>
        </div>
        <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
      </div>

      <div className="space-y-2">
        <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500">Recipient email</label>
        <input value={to} onChange={e => setTo(e.target.value)} placeholder="Email" className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" />

        <div className="relative">
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mt-1">No lesson note</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={5} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm pr-10" placeholder="Write the session update or note here..." />
          <button
            onClick={toggleRecognition}
            title={recognizing ? 'Stop dictation' : 'Start dictation'}
            className={`absolute right-2 top-9 p-1 rounded-md ${recognizing ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-700'}`}
          >
            {recognizing ? '●' : '🎤'}
          </button>
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mt-1">Invoice link</label>
          <input value={invoice} onChange={e => setInvoice(e.target.value)} placeholder="Paste invoice URL (optional)" className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mt-1">Video link</label>
          <input value={video} onChange={e => setVideo(e.target.value)} placeholder="Paste YouTube or video URL (optional)" className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" />
        </div>

        <p className="text-[11px] text-gray-500">This email will include the practice branding, note, optional invoice, and optional video link in a transcript-style layout.</p>

        <div className="flex items-center gap-2 pt-1">
          <button onClick={handleSend} disabled={sending} className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">{sending ? 'Sending…' : 'Send'}</button>
          <button onClick={() => setOpen(false)} className="text-gray-500 text-sm">Cancel</button>
          {error && <span className="text-red-500 text-xs">{error}</span>}
        </div>
      </div>
    </div>
  )
}
