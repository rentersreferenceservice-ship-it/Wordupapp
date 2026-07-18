'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
  className?: string
}

export default function SmartNotesField({ value, onChange, placeholder = 'Session notes…', rows = 3, className = '' }: Props) {
  const [listening, setListening] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiDraft, setAiDraft] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [speechSupported, setSpeechSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const interimRef = useRef('')
  const baseRef = useRef(value)

  useEffect(() => {
    const SR = (window as typeof window & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition
      ?? (window as typeof window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition
    setSpeechSupported(!!SR)
  }, [])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setListening(false)
    interimRef.current = ''
  }, [])

  function startListening() {
    setError('')
    const SR = (window as typeof window & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition
      ?? (window as typeof window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition
    if (!SR) { setError('Voice input not supported in this browser.'); return }

    const rec = new SR()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'
    recognitionRef.current = rec
    baseRef.current = value

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interim = ''
      let finalChunk = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) finalChunk += t
        else interim += t
      }
      if (finalChunk) {
        const joined = baseRef.current
          ? baseRef.current.trimEnd() + ' ' + finalChunk.trimStart()
          : finalChunk
        baseRef.current = joined
        onChange(joined + (interim ? ' ' + interim : ''))
        interimRef.current = interim
      } else {
        onChange(baseRef.current + (interim ? (baseRef.current ? ' ' : '') + interim : ''))
        interimRef.current = interim
      }
    }

    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error !== 'aborted') setError(`Mic error: ${e.error}`)
      stopListening()
    }
    rec.onend = () => {
      // Flush any leftover interim text as final
      if (interimRef.current) {
        const joined = baseRef.current
          ? baseRef.current.trimEnd() + ' ' + interimRef.current.trimStart()
          : interimRef.current
        baseRef.current = joined
        onChange(joined)
        interimRef.current = ''
      }
      setListening(false)
    }

    rec.start()
    setListening(true)
  }

  function toggleListening() {
    if (listening) stopListening()
    else startListening()
  }

  async function handleAiEdit() {
    if (!value.trim()) { setError('Write or dictate a note first.'); return }
    setAiLoading(true); setError('')
    try {
      const res = await fetch('/api/practitioner/ai-edit-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: value }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAiDraft(data.edited)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setAiLoading(false)
    }
  }

  function approveAiDraft() {
    onChange(aiDraft!)
    setAiDraft(null)
  }

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={e => { baseRef.current = e.target.value; onChange(e.target.value) }}
        placeholder={listening ? '🎙 Listening…' : placeholder}
        rows={rows}
        className={`w-full border rounded-xl px-3 py-2 text-sm outline-none resize-none transition-colors ${
          listening
            ? 'border-red-400 ring-2 ring-red-200 bg-red-50'
            : 'border-gray-200 focus:ring-2 focus:ring-blue-500'
        } ${className}`}
      />

      {/* Controls row */}
      <div className="flex items-center gap-2 mt-2">
        {speechSupported && (
          <button
            type="button"
            onClick={toggleListening}
            title={listening ? 'Stop dictating' : 'Dictate note'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-colors ${
              listening
                ? 'bg-red-500 border-red-500 text-white animate-pulse'
                : 'bg-white border-gray-200 text-gray-600 hover:border-red-400 hover:text-red-600'
            }`}
          >
            {listening ? '⏹ Stop' : '🎙 Dictate'}
          </button>
        )}

        <button
          type="button"
          onClick={handleAiEdit}
          disabled={aiLoading || !value.trim()}
          title="AI — fix errors and reword clinically"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border-2 bg-white border-gray-200 text-gray-600 hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {aiLoading ? '⏳ Editing…' : '✨ Polish with AI'}
        </button>

        {error && <span className="text-xs text-red-600 flex-1">{error}</span>}
      </div>

      {/* AI Approval modal */}
      {aiDraft !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setAiDraft(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900">AI-Polished Note</h2>
                <p className="text-xs text-gray-400 mt-0.5">Review the reworded version. Approve to replace your note, or discard to keep your original.</p>
              </div>
              <button onClick={() => setAiDraft(null)} className="text-gray-400 hover:text-gray-600 text-xl ml-4">×</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 sm:divide-x divide-gray-100">
              <div className="p-5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Your original</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{value}</p>
              </div>
              <div className="p-5 bg-indigo-50">
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-2">AI version ✨</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed font-medium">{aiDraft}</p>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setAiDraft(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 border-2 border-gray-200 hover:bg-gray-50 transition-colors">
                Keep original
              </button>
              <button onClick={approveAiDraft}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
                Use AI version
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
