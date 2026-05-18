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
    <div className="mt-1.5">
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={handleBlur}
        placeholder="Speller's full sentence…"
        rows={2}
        className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 outline-none focus:ring-1 focus:ring-blue-400 resize-none text-gray-700 placeholder-gray-300 print:border-none print:shadow-none print:bg-transparent print:p-0 print:resize-none"
      />
      {status === 'saving' && <span className="text-xs text-gray-400 print:hidden">Saving…</span>}
      {status === 'saved' && <span className="text-xs text-green-500 print:hidden">Saved</span>}
    </div>
  )
}
