'use client'

import { useState, useRef } from 'react'

export default function WritingResponseInput({
  sessionId,
  hunkNumber,
  promptText,
  initialValue,
}: {
  sessionId: string
  hunkNumber: number
  promptText?: string
  initialValue: string
}) {
  const isInitiallySkipped = initialValue === 'SKIPPED'
  const [skipped, setSkipped] = useState(isInitiallySkipped)
  const [value, setValue] = useState(isInitiallySkipped ? '' : initialValue)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const savedValue = useRef(initialValue)

  async function save(response: string) {
    setStatus('saving')
    try {
      await fetch(`/api/practitioner/sessions/${sessionId}/writing-response`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hunkNumber, response, promptText }),
      })
      savedValue.current = response
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 2000)
    } catch {
      setStatus('idle')
    }
  }

  async function handleBlur() {
    if (value === savedValue.current) return
    await save(value)
  }

  async function toggleSkip() {
    if (skipped) {
      setSkipped(false)
      await save('')
    } else {
      setSkipped(true)
      setValue('')
      await save('SKIPPED')
    }
  }

  return (
    <>
      <div className="mt-4 pt-3 border-t border-pink-100 print:hidden">
        <p className="text-xs font-semibold text-pink-500 uppercase tracking-wide mb-1">Writing Prompt</p>
        {promptText && !skipped && (
          <p className="text-xs text-pink-600 italic mb-2">{promptText}</p>
        )}
        {skipped ? (
          <p className="text-xs text-gray-400 italic mb-2">Skipped — student did not engage in writing</p>
        ) : (
          <textarea
            value={value}
            onChange={e => setValue(e.target.value)}
            onBlur={handleBlur}
            placeholder="Type the student's written response…"
            rows={3}
            className="w-full text-sm border-2 border-pink-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 resize-none text-gray-800 placeholder-pink-300 bg-pink-50"
          />
        )}
        <div className="flex items-center gap-3 mt-1">
          {status === 'saving' && <span className="text-xs text-gray-400">Saving…</span>}
          {status === 'saved' && <span className="text-xs text-green-500">Saved ✓</span>}
          <button
            onClick={toggleSkip}
            className={`text-xs font-semibold px-3 py-1 rounded-full border-2 transition-colors ml-auto ${skipped ? 'bg-blue-100 text-blue-600 border-blue-300 hover:bg-blue-200' : 'bg-white text-red-500 border-red-300 hover:bg-red-50'}`}
          >
            {skipped ? 'Undo Skip' : 'Skip'}
          </button>
        </div>
      </div>
      {/* Print view */}
      <div className="hidden print:block mt-3 pt-2 border-t border-pink-100">
        <p style={{ fontSize: 9, fontWeight: 'bold', color: '#ec4899', textTransform: 'uppercase', marginBottom: 3 }}>Writing Prompt</p>
        {promptText && <p style={{ fontSize: 9, color: '#ec4899', fontStyle: 'italic', marginBottom: 4 }}>{promptText}</p>}
        {value
          ? <p style={{ fontSize: 10, color: '#333', whiteSpace: 'pre-wrap' }}>{value}</p>
          : <div style={{ borderBottom: '1px solid #ccc', height: 16, marginBottom: 8 }} />
        }
      </div>
    </>
  )
}
