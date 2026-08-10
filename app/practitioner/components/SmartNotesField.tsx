'use client'

import { useState, useRef, useEffect } from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
  className?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySpeechRecognition = any

function getSR(): AnySpeechRecognition | null {
  if (typeof window === 'undefined') return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export default function SmartNotesField({ value, onChange, placeholder = 'Session notes…', rows = 3, className = '' }: Props) {
  const [listening, setListening] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiDraft, setAiDraft] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [speechSupported, setSpeechSupported] = useState(false)

  const listeningRef = useRef(false)
  const userStoppedRef = useRef(false)
  const baseRef = useRef(value)
  const interimRef = useRef('')
  const recognitionRef = useRef<AnySpeechRecognition>(null)
  const rapidEndsRef = useRef(0)

  useEffect(() => { setSpeechSupported(!!getSR()) }, [])

  useEffect(() => {
    if (!listeningRef.current) baseRef.current = value
  }, [value])

  function buildRecognition(): AnySpeechRecognition | null {
    const SR = getSR()
    if (!SR) return null

    const rec = new SR()
    // Single utterance per session, not continuous — continuous mode is the
    // flaky one on Android (internal restarts, repeated mic-start tones,
    // duplicated text). We get the reliability of single-utterance mode but
    // keep the "just talk, don't touch anything" feel by automatically
    // chaining a new one-utterance session onto the end of the last, below.
    rec.continuous = false
    rec.interimResults = true
    rec.lang = 'en-US'

    const startedAt = Date.now()

    // Tracked per-instance (closured, not a shared ref) so a late/stale event
    // from a previous instance can never corrupt a newer instance's count.
    let finalizedCount = 0

    rec.onresult = (e: AnySpeechRecognition) => {
      if (recognitionRef.current !== rec) return // stale instance — ignore

      // Some browsers (notably Android Chrome) report e.resultIndex unreliably,
      // sometimes re-pointing at results already marked final. Trusting it caused
      // the same finalized phrase to be appended repeatedly on later onresult
      // events. Instead, track our own watermark of how many results (by index)
      // have already been committed, and only ever commit each index once.
      let finalChunk = ''
      let interim = ''
      for (let i = 0; i < e.results.length; i++) {
        const result = e.results[i]
        const t = result[0].transcript
        if (result.isFinal) {
          if (i >= finalizedCount) {
            finalChunk += t
            finalizedCount = i + 1
          }
        } else {
          interim += t
        }
      }
      if (finalChunk) {
        const sep = baseRef.current && !baseRef.current.endsWith(' ') ? ' ' : ''
        baseRef.current = baseRef.current + sep + finalChunk.trimStart()
      }
      interimRef.current = interim
      const display = baseRef.current + (interim ? (baseRef.current ? ' ' : '') + interim : '')
      onChange(display)
    }

    rec.onerror = (e: AnySpeechRecognition) => {
      if (recognitionRef.current !== rec) return // stale instance — ignore
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        setError(`Mic error: ${e.error}`)
        userStoppedRef.current = true
      }
    }

    // Single-utterance mode always ends after each phrase/pause, even while
    // the practitioner is still talking — so to feel continuous (no tapping
    // between sentences), we chain a fresh one-utterance session onto the end
    // of the last one automatically. Each session is short and clean, which
    // sidesteps the flakiness of asking the browser for one long continuous
    // session. If it somehow ends near-instantly over and over (a real error,
    // not a natural speech pause), stop instead of looping/beeping forever.
    rec.onend = () => {
      if (recognitionRef.current !== rec) return // stale instance — ignore

      if (interimRef.current) {
        const sep = baseRef.current && !baseRef.current.endsWith(' ') ? ' ' : ''
        baseRef.current = baseRef.current + sep + interimRef.current.trimStart()
        onChange(baseRef.current)
        interimRef.current = ''
      }

      if (userStoppedRef.current || !listeningRef.current) {
        recognitionRef.current = null
        listeningRef.current = false
        setListening(false)
        return
      }

      rapidEndsRef.current = Date.now() - startedAt < 300 ? rapidEndsRef.current + 1 : 0
      if (rapidEndsRef.current > 6) {
        setError('Mic kept disconnecting — tap Dictate to try again.')
        recognitionRef.current = null
        listeningRef.current = false
        setListening(false)
        return
      }

      try {
        const next = buildRecognition()
        if (next) { recognitionRef.current = next; next.start() }
        else { listeningRef.current = false; setListening(false) }
      } catch {
        recognitionRef.current = null
        listeningRef.current = false
        setListening(false)
      }
    }

    return rec
  }

  function startListening() {
    if (listeningRef.current) return // already listening — never start a second overlapping instance
    setError('')
    const rec = buildRecognition()
    if (!rec) { setError('Voice input is not supported in this browser.'); return }
    userStoppedRef.current = false
    listeningRef.current = true
    rapidEndsRef.current = 0
    recognitionRef.current = rec
    baseRef.current = value
    interimRef.current = ''
    try {
      rec.start()
      setListening(true)
    } catch {
      listeningRef.current = false
      recognitionRef.current = null
    }
  }

  function stopListening() {
    userStoppedRef.current = true
    listeningRef.current = false
    // .stop() (not .abort()) so it still delivers a final result for
    // whatever was captured before stopping — onend does the actual cleanup.
    try { recognitionRef.current?.stop() } catch {}
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
          {aiLoading ? '⏳ Converting…' : '📋 Convert to Clinical Note'}
        </button>

        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>

      {aiDraft !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setAiDraft(null)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[92dvh]" onClick={e => e.stopPropagation()}>
            {/* Fixed header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Clinical Note</h2>
                <p className="text-xs text-gray-400 mt-0.5">Edit the AI version if needed, then approve — or discard to keep your original.</p>
              </div>
              <button onClick={() => setAiDraft(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none ml-4">×</button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 sm:divide-x divide-gray-100">
              <div className="p-5 border-b sm:border-b-0 border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Your original</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{value}</p>
              </div>
              <div className="p-5 bg-indigo-50 flex flex-col">
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-2">AI version ✨ — edit before approving</p>
                <textarea
                  value={aiDraft}
                  onChange={e => setAiDraft(e.target.value)}
                  rows={8}
                  className="w-full flex-1 text-sm text-gray-800 leading-relaxed font-medium bg-white border border-indigo-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                />
              </div>
            </div>

            {/* Fixed footer */}
            <div className="px-5 py-4 border-t border-gray-100 flex gap-3 justify-end flex-shrink-0">
              <button onClick={() => setAiDraft(null)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border-2 border-gray-200 hover:bg-gray-50 transition-colors">
                Keep original
              </button>
              <button onClick={() => { onChange(aiDraft!); setAiDraft(null) }}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
                Use AI version
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
