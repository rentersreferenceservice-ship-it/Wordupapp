'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'

interface FactCheckResult {
  perplexity: string
  gemini: string
  perplexityClean: boolean
  geminiClean: boolean
  geminiUnavailable?: boolean
  autoVerified: boolean
}

interface Change {
  hunkNumber: number
  originalText: string
  correctedText: string
  correctedQuestions: { index: number; answer: string }[]
}

type Stage = 'idle' | 'checking' | 'results' | 'applying' | 'preview' | 'saving' | 'done'

export default function FactCheckButton({ lessonId }: { lessonId: string }) {
  const [stage, setStage] = useState<Stage>('idle')
  const [result, setResult] = useState<FactCheckResult | null>(null)
  const [changes, setChanges] = useState<Change[]>([])
  const [error, setError] = useState('')

  async function runCheck() {
    setStage('checking')
    setError('')
    setResult(null)
    try {
      const res = await fetch(`/api/lessons/${lessonId}/factcheck`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Unknown error')
      setResult(data)
      setStage('results')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setStage('idle')
    }
  }

  async function applyFixes() {
    if (!result) return
    setStage('applying')
    setError('')
    try {
      const issues = [
        !result.perplexityClean ? result.perplexity : '',
        !result.geminiClean ? result.gemini : '',
      ].filter(Boolean).join('\n\n')

      const res = await fetch(`/api/lessons/${lessonId}/apply-fixes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issues }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error ?? `HTTP ${res.status}`)
        throw new Error(msg)
      }
      setChanges(data.changes)
      setStage('preview')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setStage('results')
    }
  }

  async function confirmFixes() {
    setStage('saving')
    try {
      const res = await fetch(`/api/lessons/${lessonId}/apply-fixes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true, correctedHunks: changes }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(`Save failed (${res.status}): ${errData.error ?? 'unknown'}`)
      }
      setStage('done')
      // Re-run fact check after a short pause
      setTimeout(() => {
        setStage('idle')
        setResult(null)
        setChanges([])
        runCheck()
      }, 1500)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setStage('preview')
    }
  }

  function close() {
    setStage('idle')
    setResult(null)
    setChanges([])
    setError('')
  }

  const showModal = stage !== 'idle' && stage !== 'checking' && typeof document !== 'undefined'

  const modal = showModal && createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4" onClick={stage === 'results' || stage === 'preview' || stage === 'done' ? close : undefined}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {stage === 'applying' && '⏳ Generating Fixes…'}
            {stage === 'preview' && '📝 Review Changes'}
            {stage === 'saving' && '💾 Saving…'}
            {stage === 'done' && '✓ Saved — Re-running Fact Check…'}
            {stage === 'results' && result?.autoVerified && '✓ Auto-Verified!'}
            {stage === 'results' && !result?.autoVerified && result?.perplexityClean && result?.geminiUnavailable && '✓ Perplexity Clean — Gemini Unavailable'}
            {stage === 'results' && !result?.autoVerified && (!result?.perplexityClean || (!result?.geminiClean && !result?.geminiUnavailable)) && '⚠️ Issues Found'}
          </h2>
          {(stage === 'results' || stage === 'preview') && (
            <button onClick={close} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          )}
        </div>

        <div className="px-6 py-5 space-y-4">

          {/* Applying spinner */}
          {(stage === 'applying' || stage === 'saving' || stage === 'done') && (
            <div className="text-center py-8 text-gray-500 text-sm">
              {stage === 'applying' && 'Claude is reading the issues and rewriting the affected sections. This takes about 15 seconds…'}
              {stage === 'saving' && 'Saving corrected lesson…'}
              {stage === 'done' && 'Changes saved! Starting fact-check again…'}
            </div>
          )}

          {/* Fact check results */}
          {stage === 'results' && result && (
            <>
              {/* Auto-verified */}
              {result.autoVerified && (
                <div className="bg-green-50 border border-green-300 rounded-xl p-4">
                  <p className="text-green-800 font-semibold">Both AIs confirmed accuracy. Lesson auto-verified — you&apos;ll receive a confirmation email.</p>
                </div>
              )}

              {/* Perplexity clean, Gemini unreachable */}
              {result.perplexityClean && result.geminiUnavailable && (
                <div className="bg-green-50 border border-green-300 rounded-xl p-4">
                  <p className="text-green-800 font-semibold mb-1">Perplexity found no issues.</p>
                  <p className="text-sm text-green-700">Gemini was unreachable. You can verify this lesson now or try the fact-check again later to get Gemini&apos;s result too.</p>
                </div>
              )}

              {/* Issues found */}
              {(!result.perplexityClean || (!result.geminiClean && !result.geminiUnavailable)) && (
                <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4">
                  <p className="text-yellow-800 font-semibold">Issues were found. Click &quot;Apply Fixes&quot; and Claude will rewrite the flagged sentences for you to review before anything saves.</p>
                </div>
              )}

              <div className={`rounded-xl border p-4 ${result.perplexityClean ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
                <p className="text-sm font-bold mb-2">Perplexity AI — {result.perplexityClean ? '✓ Clean' : '⚠️ Issues Found'}</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{result.perplexity}</p>
              </div>

              <div className={`rounded-xl border p-4 ${result.geminiUnavailable ? 'border-gray-200 bg-gray-50' : result.geminiClean ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
                <p className="text-sm font-bold mb-2">Google Gemini — {result.geminiUnavailable ? '— Unavailable' : result.geminiClean ? '✓ Clean' : '⚠️ Issues Found'}</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{result.gemini}</p>
              </div>

              {(!result.perplexityClean || (!result.geminiClean && !result.geminiUnavailable)) && (
                <button onClick={applyFixes} className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">
                  Apply Fixes — Claude Will Rewrite Flagged Sections
                </button>
              )}

              <button onClick={close} className="w-full bg-gray-100 text-gray-700 border-2 border-blue-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
                {result.perplexityClean && result.geminiUnavailable ? 'Close — Use Mark Verified Button to Verify' : 'Close'}
              </button>
            </>
          )}

          {/* Changes preview */}
          {stage === 'preview' && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800 font-semibold">Review each change below. Nothing is saved until you click Confirm.</p>
              </div>

              {changes.map(c => (
                <div key={c.hunkNumber} className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Section {c.hunkNumber}</p>
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-red-600 mb-1">Original:</p>
                      <p className="text-sm text-gray-600 bg-red-50 rounded-lg p-3 leading-relaxed">{c.originalText}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-green-600 mb-1">Corrected:</p>
                      <p className="text-sm text-gray-800 bg-green-50 rounded-lg p-3 leading-relaxed">{c.correctedText}</p>
                    </div>
                    {c.correctedQuestions.length > 0 && c.correctedQuestions.map(q => (
                      <div key={q.index}>
                        <p className="text-xs font-semibold text-green-600 mb-1">Question {q.index + 1} answer corrected:</p>
                        <p className="text-sm text-gray-800 bg-green-50 rounded-lg p-3">{q.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                onClick={confirmFixes}
                className="w-full bg-green-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-green-700 transition-colors"
              >
                ✓ Confirm & Save — Then Re-run Fact Check
              </button>
              <button onClick={close} className="w-full bg-gray-100 text-gray-700 border-2 border-blue-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
                Cancel
              </button>
            </>
          )}

          {error && stage !== 'preview' && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </div>,
    document.body
  )

  return (
    <>
      <button
        onClick={runCheck}
        disabled={stage === 'checking'}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
      >
        {stage === 'checking' ? '⏳ Checking…' : '🔍 Fact Check'}
      </button>
      {modal}
    </>
  )
}
