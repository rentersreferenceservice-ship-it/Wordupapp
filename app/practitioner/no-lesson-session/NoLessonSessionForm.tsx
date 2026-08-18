'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import SmartNotesField from '@/app/practitioner/components/SmartNotesField'

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

  const [generatingInvoice, setGeneratingInvoice] = useState(false)
  const [invoiceError, setInvoiceError] = useState('')

  function handleStudentChange(id: string) {
    setStudentId(id)
    const s = students.find(s => s.id === id)
    if (s?.guardianEmail) setTo(s.guardianEmail)
  }

  async function handleGenerateInvoice() {
    if (!studentId) { setInvoiceError('Select a student first'); return }
    setGeneratingInvoice(true)
    setInvoiceError('')
    try {
      const res = await fetch('/api/practitioner/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, asSessionFee: true }),
      })
      const data = await res.json()
      if (!res.ok || !data.invoiceId) { setInvoiceError(data.error ?? 'Failed to create invoice'); setGeneratingInvoice(false); return }
      setInvoice(`/practitioner/invoice/${data.invoiceId}`)
      // Land straight on the invoice page, same as the transcript's Generate Invoice
      // button — that's where the fee amount is click-to-edit for a partial/reduced
      // session. Opened in a new tab so the in-progress note here isn't lost.
      window.open(`/practitioner/invoice/${data.invoiceId}`, '_blank')
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
        body: JSON.stringify({ to: recipients, note, invoice, video, studentId: studentId || null }),
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
            <h1 className="text-2xl font-bold text-gray-900">Session Note</h1>
            <p className="text-gray-600 mt-1">No lesson conducted</p>
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

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">No lesson note</label>
          <SmartNotesField
            value={note}
            onChange={setNote}
            placeholder="Write the session update or note here..."
            rows={6}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Invoice</label>
          {generatedInvoiceId ? (
            <div className="border border-green-200 bg-green-50 rounded-md px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-green-700 font-medium flex-1">Invoice generated</span>
                <a href={`/practitioner/invoice/${generatedInvoiceId}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline">View</a>
                <button onClick={() => setInvoice('')} className="text-xs text-gray-400 hover:text-red-500">Remove</button>
              </div>
              <p className="text-xs text-green-700 mt-1">Opened in a new tab — click the fee amount there to bill a partial or reduced session.</p>
            </div>
          ) : (
            <div>
              <button
                onClick={handleGenerateInvoice}
                disabled={generatingInvoice || !studentId}
                className="bg-green-600 text-white border-2 border-green-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition-colors"
              >
                {generatingInvoice ? 'Creating…' : 'Generate Invoice'}
              </button>
              {!studentId && <p className="text-xs text-amber-600 mt-1">Select a student above to generate an invoice.</p>}
              {invoiceError && <p className="text-xs text-red-600 mt-1">{invoiceError}</p>}
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
