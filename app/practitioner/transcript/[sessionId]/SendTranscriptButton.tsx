'use client'

import { useState, useEffect, useRef } from 'react'

const STORAGE_KEY = 'practitioner_email_history'

function loadHistory(): string[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}

function saveToHistory(emails: string[]) {
  try {
    const existing = loadHistory()
    const merged = [...new Set([...emails, ...existing])].slice(0, 30)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
  } catch { /* ignore */ }
}

function EmailInput({ value, onChange, autoFocus, history }: {
  value: string
  onChange: (v: string) => void
  autoFocus?: boolean
  history: string[]
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const suggestions = history.filter(e =>
    e.toLowerCase().includes(value.toLowerCase()) && e !== value
  )

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <input
        type="email"
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder="Recipient email..."
        autoFocus={autoFocus}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 w-56"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
          {suggestions.map(s => (
            <li
              key={s}
              onMouseDown={e => { e.preventDefault(); onChange(s); setOpen(false) }}
              className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer truncate"
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function SendTranscriptButton({ sessionId, defaultTo }: { sessionId: string; defaultTo?: string }) {
  const [open, setOpen] = useState(false)
  const [emails, setEmails] = useState<string[]>([defaultTo ?? ''])
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [includeTranscript, setIncludeTranscript] = useState(true)

  useEffect(() => { setHistory(loadHistory()) }, [])

  function updateEmail(index: number, value: string) {
    setEmails(prev => prev.map((e, i) => i === index ? value : e))
    setError('')
  }

  function addEmail() { setEmails(prev => [...prev, '']) }

  function removeEmail(index: number) { setEmails(prev => prev.filter((_, i) => i !== index)) }

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
        body: JSON.stringify({ to: trimmed, includeTranscript }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Send failed')
        setSending(false)
        return
      }
      saveToHistory(trimmed)
      setHistory(loadHistory())
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
        className="bg-gray-100 text-gray-700 border-2 border-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
      >
        Send via Email
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {emails.map((email, index) => (
        <div key={index} className="flex items-center gap-2">
          <EmailInput
            value={email}
            onChange={v => updateEmail(index, v)}
            autoFocus={index === 0}
            history={history}
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
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={includeTranscript}
          onChange={e => setIncludeTranscript(e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        Include full transcript PDF
      </label>
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={addEmail} className="text-blue-600 hover:text-blue-800 text-xs font-medium">
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
