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
  const [value, setValue] = useState(initialValue)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const savedValue = useRef(initialValue)

  async function handleBlur() {
    if (value === savedValue.current) return
    setStatus('saving')
    try {
      await fetch(`/api/practitioner/sessions/${sessionId}/writing-response`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hunkNumber, response: value, promptText }),
      })
      savedValue.current = value
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 2000)
    } catch {
      setStatus('idle')
    }
  }

  return (
    <>
      <div className="mt-4 pt-3 border-t border-pink-100 print:hidden">
        <p className="text-xs font-semibold text-pink-500 uppercase tracking-wide mb-1">Writing Prompt</p>
        {promptText && (
          <p className="text-xs text-pink-600 italic mb-2">{promptText}</p>
        )}
        <textarea
          value={value}
          onChange={e => setValue(e.target.value)}
          onBlur={handleBlur}
          placeholder="Type the student's written response…"
          rows={3}
          className="w-full text-sm border-2 border-pink-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 resize-none text-gray-800 placeholder-pink-300 bg-pink-50"
        />
        {status === 'saving' && <span className="text-xs text-gray-400">Saving…</span>}
        {status === 'saved' && <span className="text-xs text-green-500">Saved ✓</span>}
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
