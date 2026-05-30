'use client'

import { useState } from 'react'

interface Props {
  lessonId: string
  lessonTitle: string
  variant?: 'link' | 'button'
}

export default function SuggestEditButton({ lessonId, lessonTitle, variant = 'link' }: Props) {
  const [open, setOpen] = useState(false)
  const [suggestion, setSuggestion] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleSubmit() {
    if (!suggestion.trim()) return
    setStatus('sending')
    try {
      const res = await fetch('/api/suggest-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, lessonTitle, suggestion }),
      })
      setStatus(res.ok ? 'sent' : 'error')
    } catch {
      setStatus('error')
    }
  }

  const modalContent = (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => { setOpen(false); setStatus('idle'); setSuggestion('') }}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-base font-bold text-gray-900 mb-3">Suggest a correction or addition</h2>
        {status === 'sent' ? (
          <p className="text-sm text-green-600">Thank you — your suggestion has been sent to the Word Up team.</p>
        ) : (
          <>
            <textarea
              value={suggestion}
              onChange={e => setSuggestion(e.target.value)}
              placeholder="Describe the issue or what you'd like to add…"
              rows={4}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white"
            />
            {status === 'error' && <p className="text-xs text-red-500 mt-1">Something went wrong — please try again.</p>}
            <div className="flex gap-2 mt-3 justify-end">
              <button onClick={() => { setOpen(false); setSuggestion(''); setStatus('idle') }} className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5">Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={status === 'sending' || !suggestion.trim()}
                className="bg-blue-600 text-white text-xs px-4 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {status === 'sending' ? 'Sending…' : 'Send'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )

  if (variant === 'button') {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="bg-gray-100 text-gray-700 border-2 border-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          Suggest Edit
        </button>
        {open && modalContent}
      </>
    )
  }

  // default: link variant (bottom of lesson)
  if (status === 'sent') {
    return (
      <p className="text-center text-sm text-green-600 mt-4 print:hidden">
        Thank you — your suggestion has been sent to the Word Up team.
      </p>
    )
  }

  return (
    <div className="mt-6 print:hidden">
      {!open ? (
        <p className="text-center text-xs text-gray-400">
          Know something we missed?{' '}
          <button onClick={() => setOpen(true)} className="underline hover:text-gray-600 transition-colors">
            Suggest a correction
          </button>
        </p>
      ) : (
        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
          <p className="text-sm font-medium text-gray-700 mb-2">Suggest a correction or addition</p>
          <textarea
            value={suggestion}
            onChange={e => setSuggestion(e.target.value)}
            placeholder="Describe the issue or what you'd like to add…"
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white"
          />
          {status === 'error' && <p className="text-xs text-red-500 mt-1">Something went wrong — please try again.</p>}
          <div className="flex gap-2 mt-2 justify-end">
            <button onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={status === 'sending' || !suggestion.trim()}
              className="bg-blue-600 text-white text-xs px-4 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {status === 'sending' ? 'Sending…' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
