'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'

interface Result {
  perplexity: string
  gemini: string
  perplexityClean: boolean
  geminiClean: boolean
  autoVerified: boolean
}

export default function FactCheckButton({ lessonId }: { lessonId: string }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')

  async function runCheck() {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch(`/api/lessons/${lessonId}/factcheck`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Unknown error')
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const modal = result && typeof document !== 'undefined' && createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4" onClick={() => setResult(null)}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {result.autoVerified ? '✓ Lesson Auto-Verified' : '⚠️ Fact-Check Issues Found'}
          </h2>
          <button onClick={() => setResult(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {result.autoVerified ? (
            <div className="bg-green-50 border border-green-300 rounded-xl p-4">
              <p className="text-green-800 font-semibold">Both AIs confirmed accuracy. This lesson has been automatically marked as Verified and you&apos;ll receive a confirmation email.</p>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4">
              <p className="text-yellow-800 font-semibold">Issues were found. The lesson has not been verified. Check your email for the full report, edit the lesson, then run the fact-check again.</p>
            </div>
          )}

          <div className={`rounded-xl border p-4 ${result.perplexityClean ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
            <p className="text-sm font-bold mb-2 {result.perplexityClean ? 'text-green-800' : 'text-red-800'}">
              Perplexity AI — {result.perplexityClean ? '✓ Clean' : '⚠️ Issues Found'}
            </p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{result.perplexity}</p>
          </div>

          <div className={`rounded-xl border p-4 ${result.geminiClean ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
            <p className="text-sm font-bold mb-2">
              Google Gemini — {result.geminiClean ? '✓ Clean' : '⚠️ Issues Found'}
            </p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{result.gemini}</p>
          </div>

          <button onClick={() => setResult(null)} className="w-full bg-gray-100 text-gray-700 border-2 border-blue-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  )

  return (
    <>
      <button
        onClick={runCheck}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
      >
        {loading ? 'Checking…' : '🔍 Fact Check'}
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
      {modal}
    </>
  )
}
