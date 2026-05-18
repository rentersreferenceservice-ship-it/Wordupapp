'use client'

import { useState } from 'react'

export default function SendTranscriptButton({ sessionId, defaultTo }: { sessionId: string; defaultTo?: string }) {
  const [open, setOpen] = useState(false)
  const [emails, setEmails] = useState<string[]>([defaultTo ?? ''])
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  function updateEmail(index: number, value: string) {
    setEmails(prev => prev.map((e, i) => i === index ? value : e))
    setError('')
  }

  function addEmail() {
    setEmails(prev => [...prev, ''])
  }

  function removeEmail(index: number) {
    setEmails(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSend() {
    const trimmed = emails.map(e => e.trim()).filter(Boolean)
    if (trimmed.length === 0 || trimmed.some(e => !e.includes('@'))) {
      setError('Enter valid email address(es)')
      return
    }
    setSending(true)
    setError('')
    try {
      const res = await fetch(`/api/practitioner/sessions/${sessionId}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: trimmed }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Send failed')
        setSending(false)
        return
      }
      setSent(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Send failed')
      setSending(false)
    }
  }

  if (sent) {
    const trimmed = emails.map(e => e.trim()).filter(Boolean)
    return (
      <span className="text-sm text-green-600 font-medium px-4 py-2">
        ✓ Sent to {trimmed.join(', ')}
      </span>
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
      >
        Send via Email
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {emails.map((email, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="email"
            value={email}
            onChange={e => updateEmail(index, e.target.value)}
            placeholder="Recipient email..."
            autoFocus={index === 0}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 w-56"
          />
          {emails.length > 1 && (
            <button
              onClick={() => removeEmail(index)}
              className="text-gray-400 hover:text-red-500 text-sm px-1"
              title="Remove"
            >
              ✕
            </button>
          )}
        </div>
      ))}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={addEmail}
          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
        >
          + Add another email
        </button>
        <button
          onClick={handleSend}
          disabled={sending}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {sending ? 'Sending…' : 'Send'}
        </button>
        <button
          onClick={() => { setOpen(false); setError(''); setEmails([defaultTo ?? '']) }}
          className="text-gray-400 hover:text-gray-600 text-sm px-2"
        >
          Cancel
        </button>
        {error && <span className="text-red-500 text-xs">{error}</span>}
      </div>
    </div>
  )
}
