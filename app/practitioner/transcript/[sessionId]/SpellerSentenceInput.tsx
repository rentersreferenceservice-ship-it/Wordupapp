'use client'

import { useState, useRef } from 'react'

export default function SpellerSentenceInput({
  sessionId,
  responseId,
  initialValue,
}: {
  sessionId: string
  responseId: string
  initialValue: string
}) {
  const [value, setValue] = useState(initialValue)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const savedValue = useRef(initialValue)

  async function handleBlur() {
    if (value === savedValue.current) return
    setStatus('saving')
    try {
      await fetch(`/api/practitioner/sessions/${sessionId}/sentence`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responseId, sentence: value }),
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
      <div className="mt-2 print:hidden">
        <p className="text-xs font-semibold text-gray-500 mb-1">Speller&apos;s sentence</p>
        <textarea
          value={value}
          onChange={e => setValue(e.target.value)}
          onBlur={handleBlur}
          placeholder="Type the full sentence the speller gave…"
          rows={2}
          className="w-full text-sm border-2 border-blue-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 resize-none text-gray-800 placeholder-gray-400 bg-blue-50"
        />
        {status === 'saving' && <span className="text-xs text-gray-400">Saving…</span>}
        {status === 'saved' && <span className="text-xs text-green-500">Saved ✓</span>}
      </div>
      {value && (
        <p className="hidden print:block text-xs text-gray-800 mt-1 italic">{value}</p>
      )}
    </>
  )
}
