'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AccuracyExcludeButton({ studentId, sessionCount }: { studentId: string; sessionCount: number }) {
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  async function handleExclude() {
    setLoading(true)
    await fetch(`/api/practitioner/students/${studentId}/exclude-accuracy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    setLoading(false)
    setShowConfirm(false)
    router.refresh()
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500">Mark all {sessionCount} sessions as 0% accuracy?</span>
        <button onClick={handleExclude} disabled={loading}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 transition-colors">
          {loading ? 'Updating…' : 'Yes, all sessions'}
        </button>
        <button onClick={() => setShowConfirm(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-700 border border-amber-300 bg-amber-50 hover:bg-amber-100 transition-colors"
    >
      Set all sessions → 0% accuracy
    </button>
  )
}
