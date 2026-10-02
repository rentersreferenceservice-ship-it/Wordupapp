'use client'

import { useState } from 'react'

export default function RequestUpdatedInfoButton({ studentId }: { studentId: string }) {
  const [open, setOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [link, setLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  async function requestLink() {
    setSending(true)
    setError('')
    try {
      const res = await fetch(`/api/practitioner/students/${studentId}/intake-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'text' }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to create link'); return }
      setLink(data.link)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create link')
    } finally {
      setSending(false)
    }
  }

  async function sendByEmail() {
    setSending(true)
    setError('')
    try {
      const res = await fetch(`/api/practitioner/students/${studentId}/intake-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'email' }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to send'); return }
      setEmailSent(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  async function copyMessage() {
    if (!link) return
    const message = `Hi — could you take a few minutes to fill out an updated info form for us? ${link}`
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable — the box with the text is still visible to copy manually
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-blue-600 hover:underline"
      >
        Request Updated Info
      </button>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 mt-3">
      <p className="text-sm font-semibold text-gray-700 mb-3">Request Updated Info</p>

      {emailSent ? (
        <p className="text-sm text-green-700">✓ Sent by email.</p>
      ) : (
        <button
          type="button"
          onClick={sendByEmail}
          disabled={sending}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors mb-3"
        >
          {sending ? 'Sending…' : 'Send by email'}
        </button>
      )}

      <div className="border-t border-gray-100 pt-3 mt-1">
        {!link ? (
          <button type="button" onClick={requestLink} disabled={sending} className="text-sm text-purple-600 hover:underline disabled:opacity-50">
            Or get a link to text yourself
          </button>
        ) : (
          <div>
            <p className="text-xs text-gray-500 mb-2">Copy this and text it, or tap to open your Messages app:</p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700 mb-2">
              Hi — could you take a few minutes to fill out an updated info form for us? {link}
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={copyMessage} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors">
                {copied ? '✓ Copied' : 'Copy message'}
              </button>
              <a
                href={`sms:?&body=${encodeURIComponent(`Hi — could you take a few minutes to fill out an updated info form for us? ${link}`)}`}
                className="text-xs text-blue-600 hover:underline"
              >
                Open in Messages
              </a>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      <button type="button" onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:text-gray-600 mt-3">
        Close
      </button>
    </div>
  )
}
