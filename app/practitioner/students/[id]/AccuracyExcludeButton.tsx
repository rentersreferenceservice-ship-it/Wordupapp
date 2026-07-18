'use client'

import { useState } from 'react'

export default function AccuracyExcludeButton({ studentId, sessionCount }: { studentId: string; sessionCount: number }) {
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function handleExclude() {
    setLoading(true)
    try {
      const res = await fetch(`/api/practitioner/students/${studentId}/exclude-accuracy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok) {
        setResult(`Error: ${data.error ?? 'Unknown error'}`)
        setLoading(false)
        return
      }
      setResult(`Done — ${data.updated ?? 0} sessions cleared`)
    } catch (e) {
      setResult(`Network error`)
    }
    setLoading(false)
    setShowConfirm(false)
    // Hard reload to guarantee fresh server data
    window.location.reload()
  }

  if (result) {
    return <span className="text-xs text-green-600 font-medium">{result}</span>
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500">Remove all {sessionCount} sessions from the accuracy chart?</span>
        <button onClick={handleExclude} disabled={loading}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 transition-colors">
          {loading ? 'Updating…' : 'Yes, clear chart'}
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
      Clear accuracy chart
    </button>
  )
}
