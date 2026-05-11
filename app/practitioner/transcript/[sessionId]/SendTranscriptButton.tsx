'use client'

import { useState } from 'react'

export default function SendTranscriptButton({ sessionId, defaultTo }: { sessionId: string; defaultTo?: string }) {
  const [open, setOpen] = useState(false)
  const [to, setTo] = useState(defaultTo ?? '')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSend() {
    if (!to.includes('@')) { setError('Enter a valid email address'); return }
    setSending(true)
    setError('')
    try {
      const res = await fetch(`/api/practitioner/sessions/${sessionId}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to }),
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
    return (
      <span className="text-sm text-green-600 font-medium px-4 py-2">
        ✓ Sent to {to}
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
    <div className="flex items-center gap-2">
      <input
        type="email"
        value={to}
        onChange={e => { setTo(e.target.value); setError('') }}
        placeholder="Recipient email..."
        autoFocus
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 w-56"
      />
      <button
        onClick={handleSend}
        disabled={sending}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {sending ? 'Sending…' : 'Send'}
      </button>
      <button
        onClick={() => { setOpen(false); setError('') }}
        className="text-gray-400 hover:text-gray-600 text-sm px-2"
      >
        Cancel
      </button>
      {error && <span className="text-red-500 text-xs">{error}</span>}
    </div>
  )
}
