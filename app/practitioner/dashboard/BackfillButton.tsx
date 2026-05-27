'use client'
import { useState } from 'react'

export default function BackfillButton() {
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [result, setResult] = useState('')
  const [totalLessons, setTotalLessons] = useState(0)
  const [totalHunks, setTotalHunks] = useState(0)

  async function run() {
    setStatus('running')
    setTotalLessons(0)
    setTotalHunks(0)
    let offset = 0
    try {
      while (true) {
        const res = await fetch('/api/admin/backfill-writing-prompts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ offset }),
        })
        const data = await res.json()
        if (!res.ok || !data.ok) {
          setResult(data.error ?? 'Something went wrong.')
          setStatus('error')
          return
        }
        setTotalLessons(prev => prev + data.lessonsUpdated)
        setTotalHunks(prev => prev + data.hunksUpdated)
        if (data.done) break
        offset = data.nextOffset
      }
      setStatus('done')
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
      {status === 'running' && (totalHunks > 0 || totalLessons > 0) && (
        <p className="mt-2 text-xs text-gray-500">{totalLessons} lessons updated, {totalHunks} prompts added so far…</p>
      )}
      {status === 'done' && (
        <p className="mt-2 text-xs text-green-600">Done! {totalLessons} lessons updated, {totalHunks} writing prompts added.</p>
      )}
      {status === 'error' && (
        <p className="mt-2 text-xs text-red-500">{result}</p>
      )}
    </div>
  )
}
