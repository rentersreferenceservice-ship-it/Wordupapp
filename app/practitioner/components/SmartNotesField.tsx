'use client'

import { useState, useRef, useEffect } from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
  className?: string
}

type SpeechRecognitionCtor = new () => SpeechRecognition
function getSR(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  return (
    (window as Window & { SpeechRecognition?: SpeechRecognitionCtor }).SpeechRecognition ??
    (window as Window & { webkitSpeechRecognition?: SpeechRecognitionCtor }).webkitSpeechRecognition ??
    null
  )
}

export default function SmartNotesField({ value, onChange, placeholder = 'Session notes…', rows = 3, className = '' }: Props) {
  const [listening, setListening] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiDraft, setAiDraft] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [speechSupported, setSpeechSupported] = useState(false)

  // Refs that survive across recognition restarts (iOS kills the instance after each pause)
  const userStoppedRef = useRef(false)   // true = user tapped Stop; false = iOS auto-killed it
  const listeningRef = useRef(false)
  const baseRef = useRef(value)          // confirmed final text, updated from parent onChange
  const interimRef = useRef('')
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => { setSpeechSupported(!!getSR()) }, [])

  // Keep baseRef in sync when the user types manually (not via speech)
  // Only update baseRef when not listening (to avoid clobbering speech session)
  useEffect(() => {
    if (!listeningRef.current) baseRef.current = value
  }, [value])

  function buildRecognition(): SpeechRecognition | null {
    const SR = getSR()
    if (!SR) return null

    const rec = new SR()
    rec.continuous = true      // Chrome honours this; iOS Safari ignores it — we handle via onend restart
    rec.interimResults = true
    rec.lang = 'en-US'

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let finalChunk = ''
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) finalChunk += t
        else interim += t
      }
      if (finalChunk) {
        const sep = baseRef.current && !baseRef.current.endsWith(' ') ? ' ' : ''
        baseRef.current = baseRef.current + sep + finalChunk.trimStart()
      }
      interimRef.current = interim
      const display = baseRef.current + (interim ? (baseRef.current ? ' ' : '') + interim : '')
      onChange(display)
    }

    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      // 'no-speech' and 'aborted' are normal on iOS — just let onend handle the restart
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        setError(`Mic error: ${e.error}`)
        userStoppedRef.current = true
        setListening(false)
        listeningRef.current = false
      }
    }

    rec.onend = () => {
      // Flush interim on any end
      if (interimRef.current) {
        const sep = baseRef.current && !baseRef.current.endsWith(' ') ? ' ' : ''
        baseRef.current = baseRef.current + sep + interimRef.current.trimStart()
        onChange(baseRef.current)
        interimRef.current = ''
      }

      if (!userStoppedRef.current && listeningRef.current) {
        // iOS killed the session mid-dictation — silently restart
        try {
          const next = buildRecognition()
          if (next) { recognitionRef.current = next; next.start() }
        } catch {
          // start() can throw if mic permission was revoked; give up gracefully
          setListening(false)
          listeningRef.current = false
        }
      } else {
        setListening(false)
        listeningRef.current = false
      }
    }

    return rec
  }

  function startListening() {
    setError('')
    const rec = buildRecognition()
    if (!rec) { setError('Voice input is not supported in this browser.'); return }
    userStoppedRef.current = false
    listeningRef.current = true
    recognitionRef.current = rec
    baseRef.current = value
    interimRef.current = ''
    rec.start()
    setListening(true)
  }

  function stopListening() {
    userStoppedRef.current = true
    listeningRef.current = false
    recognitionRef.current?.stop()
    recognitionRef.current = null
    interimRef.current = ''
    setListening(false)
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

      {/* Controls */}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {speechSupported && (
          <button
            type="button"
            onClick={listening ? stopListening : startListening}
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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border-2 bg-white border-gray-200 text-gray-600 hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {aiLoading ? '⏳ Editing…' : '✨ Polish with AI'}
        </button>

        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>

      {/* AI approval modal */}
      {aiDraft !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setAiDraft(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900">AI-Polished Note</h2>
                <p className="text-xs text-gray-400 mt-0.5">Approve to replace your note, or discard to keep your original.</p>
              </div>
              <button onClick={() => setAiDraft(null)} className="text-gray-400 hover:text-gray-600 text-xl ml-4">×</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 sm:divide-x divide-gray-100">
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
              <button onClick={() => { onChange(aiDraft!); setAiDraft(null) }}
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
