'use client'

import { useState } from 'react'

export default function FamilyTypeToTalkButton({ studentId }: { studentId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [code, setCode] = useState<string | null>(null)
  const [copied, setCopied] = useState<'ask' | 'answer' | null>(null)

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const askUrl = code ? `${origin}/type-to-talk/ask/${code}` : ''
  const answerUrl = code ? `${origin}/type-to-talk/live/${code}` : ''

  async function loadLinks() {
    setOpen(true)
    if (code) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/practitioner/students/${studentId}/tt-pairing`)
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to create links'); return }
      setCode(data.code)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create links')
    } finally {
      setLoading(false)
    }
  }

  async function copy(which: 'ask' | 'answer', url: string) {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(which)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // ignore — the link is still visible to copy manually
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={loadLinks} className="text-sm text-purple-600 hover:underline">
        Family Type to Talk Links
      </button>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 mt-3">
      <p className="text-sm font-semibold text-gray-700 mb-1">Family Type to Talk Links</p>
      <p className="text-xs text-gray-500 mb-3">
        These two links stay the same forever for this student — save them once and use them anytime, no session needed.
      </p>

      {loading && <p className="text-sm text-gray-400">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {code && (
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Asker&apos;s link — for whoever is asking a question</p>
            <div className="flex items-center gap-2 flex-wrap">
              <code className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 break-all flex-1">{askUrl}</code>
              <button type="button" onClick={() => copy('ask', askUrl)} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-200 shrink-0">
                {copied === 'ask' ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Answerer&apos;s link — for the non-speaker&apos;s device</p>
            <div className="flex items-center gap-2 flex-wrap">
              <code className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 break-all flex-1">{answerUrl}</code>
              <button type="button" onClick={() => copy('answer', answerUrl)} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-200 shrink-0">
                {copied === 'answer' ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-400 pt-1">
            Save each link to its own device&apos;s home screen so they&apos;re one tap away. These same links also work automatically whenever you run a formal Type to Talk session with {`this student`}.
          </p>
        </div>
      )}

      <button type="button" onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:text-gray-600 mt-3">
        Close
      </button>
    </div>
  )
}
