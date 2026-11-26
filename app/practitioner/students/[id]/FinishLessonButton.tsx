'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function FinishLessonButton({ sessionId, startHunk }: { sessionId: string; startHunk: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleClick() {
    setLoading(true)
    setError('')
    try {
      const today = new Date()
      const sessionDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      const res = await fetch(`/api/practitioner/sessions/${sessionId}/continue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionDate }),
      })
      const data = await res.json()
      if (!res.ok || !data.sessionId) throw new Error(data.error ?? 'Could not start the session')
      // Open the new session on the first page not done last time.
      try { localStorage.setItem(`wordup-session-hunk-${data.sessionId}`, String(data.startHunk - 1)) } catch {}
      router.push(`/practitioner/session/${data.sessionId}`)
    } catch (e) {
      setError((e as Error).message)
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        title={`Start a new session today at page ${startHunk}`}
        className="text-xs font-semibold text-purple-700 hover:underline disabled:opacity-50"
      >
        {loading ? 'Starting…' : `▶ Finish lesson (from page ${startHunk})`}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </>
  )
}
