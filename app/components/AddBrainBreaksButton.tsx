'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// For lessons made before brain breaks existed.
export default function AddBrainBreaksButton({ lessonId }: { lessonId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleClick() {
    setLoading(true)
    setError('')
    const res = await fetch(`/api/lessons/${lessonId}/brain-breaks`, { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) { setError(data.error ?? 'Could not add brain breaks'); setLoading(false); return }
    router.refresh()
    setLoading(false)
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button type="button" onClick={handleClick} disabled={loading}
        className="bg-purple-100 text-purple-800 border-2 border-purple-400 px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-200 disabled:opacity-60 transition-colors">
        {loading ? 'Adding…' : '🧠 Add brain breaks'}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  )
}
