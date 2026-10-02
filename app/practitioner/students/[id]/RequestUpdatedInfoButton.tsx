'use client'

import { useState } from 'react'

export default function RequestUpdatedInfoButton({
  studentId, guardianEmail, funderEmail,
}: {
  studentId: string
  guardianEmail?: string
  funderEmail?: string
}) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState(guardianEmail || funderEmail || '')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [link, setLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const knownEmails = [...new Set([guardianEmail, funderEmail].filter((e): e is string => !!e))]

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
    if (!email.includes('@')) { setError('Enter a valid email address first.'); return }
    setSending(true)
    setError('')
    try {
      const res = await fetch(`/api/practitioner/students/${studentId}/intake-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'email', recipientEmail: email }),
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
        <p className="text-sm text-green-700">✓ Sent by email to {email}.</p>
      ) : (
        <div className="mb-3">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Send to</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="guardian@email.com"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2"
          />
          {knownEmails.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {guardianEmail && (
                <button type="button" onClick={() => setEmail(guardianEmail)} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full hover:bg-gray-200">
                  Guardian: {guardianEmail}
                </button>
              )}
              {funderEmail && funderEmail !== guardianEmail && (
                <button type="button" onClick={() => setEmail(funderEmail)} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full hover:bg-gray-200">
                  Bill-to: {funderEmail}
                </button>
              )}
            </div>
          )}
          {knownEmails.length === 0 && (
            <p className="text-xs text-amber-600 mb-2">No email on file for this student yet — type one above (it won&apos;t be saved to their record, just used for this send).</p>
          )}
          <button
            type="button"
            onClick={sendByEmail}
            disabled={sending}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {sending ? 'Sending…' : 'Send by email'}
          </button>
        </div>
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
