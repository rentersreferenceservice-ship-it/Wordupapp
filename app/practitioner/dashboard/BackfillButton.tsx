'use client'
import { useState } from 'react'

export default function BackfillButton() {
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [result, setResult] = useState('')

  async function run() {
    setStatus('running')
    try {
      const res = await fetch('/api/admin/backfill-writing-prompts', { method: 'POST' })
      const data = await res.json()
      if (data.ok) {
        setResult(`Done! ${data.lessonsUpdated} lessons updated, ${data.hunksUpdated} writing prompts added.`)
        setStatus('done')
      } else {
        setResult(data.error ?? 'Something went wrong.')
        setStatus('error')
      }
    } catch {
      setResult('Request failed.')
      setStatus('error')
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <p className="text-sm font-semibold text-gray-700 mb-2">Add Writing Prompts to Old Lessons</p>
      <p className="text-xs text-gray-400 mb-3">Generates writing prompts for any lesson that was created before this feature was added.</p>
      <button
        onClick={run}
        disabled={status === 'running' || status === 'done'}
        className="bg-pink-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pink-600 disabled:opacity-50 transition-colors"
      >
        {status === 'idle' && 'Run Backfill'}
        {status === 'running' && 'Running… (may take a minute)'}
        {status === 'done' && '✓ Complete'}
        {status === 'error' && 'Retry'}
      </button>
      {result && (
        <p className={`mt-2 text-xs ${status === 'done' ? 'text-green-600' : 'text-red-500'}`}>{result}</p>
      )}
    </div>
  )
}
