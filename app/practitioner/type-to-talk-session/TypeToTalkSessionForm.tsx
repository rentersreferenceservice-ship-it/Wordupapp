'use client'

import { useState, useRef, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Student } from '@/lib/practitionerStore'
import SmartNotesField from '@/app/practitioner/components/SmartNotesField'

const STATE_OPTIONS = [
  'Happy', 'Excited', 'High energy',
  'Anxious', 'Frustrated', 'Sad', 'Overwhelmed',
  'Overstimulated', 'Understimulated', 'Sensory seeking',
  'Low energy', 'Shutdown', 'Stuck in loops',
  'Distracted', 'Transition difficulty',
  'Hungry', 'Tired', 'Sick', 'Pain',
]

const SENTENCE_ENDERS = ['.', '!', '?']

interface FinishedParagraph {
  text: string
  misspokeCount: number
}

function speak(text: string) {
  const trimmed = text.trim()
  if (!trimmed || typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(trimmed))
}

export default function TypeToTalkSessionForm({ students }: { students: Student[] }) {
  const router = useRouter()
  const [studentId, setStudentId] = useState('')
  const [search, setSearch] = useState('')
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0])
  const [regArrival, setRegArrival] = useState<string | null>(null)
  const [regDeparture, setRegDeparture] = useState<string | null>(null)
  const [studentStates, setStudentStates] = useState<string[]>([])
  const [sessionNotes, setSessionNotes] = useState('')
  const [sessionVideo, setSessionVideo] = useState('')
  const [showExternalLink, setShowExternalLink] = useState(false)
  const [invoiceLink, setInvoiceLink] = useState('')
  const [excludeFromAccuracy, setExcludeFromAccuracy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // The writing surface
  const [text, setText] = useState('')
  const [misspokeCount, setMisspokeCount] = useState(0)
  const [finishedParagraphs, setFinishedParagraphs] = useState<FinishedParagraph[]>([])
  const paragraphStartRef = useRef(0)
  const wordStartRef = useRef(0)
  const sentenceStartRef = useRef(0)
  const speechUnlockedRef = useRef(false)

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )
  const selectedStudent = students.find(s => s.id === studentId)

  function unlockSpeech() {
    if (speechUnlockedRef.current || typeof window === 'undefined' || !window.speechSynthesis) return
    speechUnlockedRef.current = true
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(''))
  }

  function toggleState(s: string) {
    setStudentStates(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  function finishParagraph(newValue: string, cursor: number) {
    const paragraph = newValue.slice(paragraphStartRef.current, cursor - 2).trim()
    paragraphStartRef.current = cursor
    wordStartRef.current = cursor
    sentenceStartRef.current = cursor
    if (paragraph) {
      speak(paragraph)
      setFinishedParagraphs(prev => [...prev, { text: paragraph, misspokeCount }])
    }
    setMisspokeCount(0)
  }

  function handleTextChange(e: ChangeEvent<HTMLTextAreaElement>) {
    const newValue = e.target.value
    const oldValue = text
    const cursor = e.target.selectionStart ?? newValue.length

    if (newValue.length > oldValue.length) {
      const insertedLength = newValue.length - oldValue.length
      setText(newValue)
      if (insertedLength !== 1) return // paste / autocomplete block insert — skip letter-by-letter speech
      const char = newValue[cursor - 1]

      if (/[a-zA-Z]/.test(char)) {
        speak(char)
      } else if (char === ' ') {
        // Word boundary — everything since the last word/sentence/paragraph boundary, excluding this space.
        const word = newValue.slice(wordStartRef.current, cursor - 1)
        wordStartRef.current = cursor
        speak(word)
      } else if (SENTENCE_ENDERS.includes(char)) {
        // Sentence boundary — everything since the last sentence/paragraph boundary, including this punctuation.
        const sentence = newValue.slice(sentenceStartRef.current, cursor)
        sentenceStartRef.current = cursor
        wordStartRef.current = cursor // the sentence just spoken already covered its trailing word
        speak(sentence)
      } else if (char === '\n' && newValue[cursor - 2] === '\n') {
        finishParagraph(newValue, cursor)
      }
    } else if (newValue.length < oldValue.length) {
      setMisspokeCount(m => m + (oldValue.length - newValue.length))
      setText(newValue)
    } else {
      setText(newValue)
    }
  }

  function getAllParagraphs(): FinishedParagraph[] {
    const trailing = text.slice(paragraphStartRef.current).trim()
    return trailing ? [...finishedParagraphs, { text: trailing, misspokeCount }] : finishedParagraphs
  }

  async function handleFinishSession() {
    if (!studentId) { setError('Please select a student.'); return }
    const paragraphs = getAllParagraphs()
    if (!paragraphs.length) { setError('Type at least one paragraph.'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/practitioner/type-to-talk-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          sessionDate,
          paragraphs,
          sessionNotes,
          sessionVideo,
          invoiceLink: showExternalLink ? invoiceLink.trim() : null,
          regulationArrival: regArrival,
          regulationDeparture: regDeparture,
          studentStates,
          excludeFromAccuracy,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.sessionId) { setError(data.error ?? 'Failed to save session'); setSaving(false); return }
      router.push(`/practitioner/transcript/${data.sessionId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save session')
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/practitioner/dashboard" className="text-sm text-blue-600 hover:underline">← Dashboard</Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-900">Type to Talk Session</h1>

      {/* Accuracy exclusion — session level */}
      <button
        type="button"
        onClick={() => setExcludeFromAccuracy(v => !v)}
        className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-colors ${
          excludeFromAccuracy
            ? 'bg-amber-50 border-amber-400'
            : 'bg-white border-gray-200 hover:border-amber-300'
        }`}
      >
        <div className="text-left">
          <p className={`text-sm font-bold ${excludeFromAccuracy ? 'text-amber-800' : 'text-gray-700'}`}>
            {excludeFromAccuracy ? '⚠ This session is excluded from accuracy tracking' : 'Exclude this session from accuracy tracking'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {excludeFromAccuracy ? 'Session will appear as 0% in the accuracy graph' : 'Use when session data should not count toward the speller\'s accuracy graph'}
          </p>
        </div>
        <div className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ml-4 ${excludeFromAccuracy ? 'bg-amber-400' : 'bg-gray-200'}`}>
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${excludeFromAccuracy ? 'left-6' : 'left-0.5'}`} />
        </div>
      </button>

      {/* Student + Date */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Student</label>
          {selectedStudent ? (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5">
              <span className="font-semibold text-blue-800">{selectedStudent.name}</span>
              <button type="button" onClick={() => { setStudentId(''); setSearch('') }} className="text-xs text-blue-400 hover:text-blue-600">Change</button>
            </div>
          ) : (
            <div>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search students…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-1"
              />
              {search && (
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  {filteredStudents.length === 0 ? (
                    <p className="text-sm text-gray-400 px-3 py-2">No students found</p>
                  ) : (
                    filteredStudents.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => { setStudentId(s.id); setSearch(''); unlockSpeech() }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b border-gray-50 last:border-0"
                      >
                        {s.name} <span className="text-gray-400 text-xs">{s.ageGroup}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Session Date</label>
          <input
            type="date"
            value={sessionDate}
            onChange={e => setSessionDate(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Observation */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Student Observation</p>

        <div>
          <p className="text-xs text-gray-400 mb-1.5">Arrived</p>
          <div className="flex gap-2">
            {['regulated', 'dysregulated'].map(val => (
              <button key={val} type="button"
                onClick={() => setRegArrival(prev => prev === val ? null : val)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-colors ${
                  regArrival === val
                    ? val === 'regulated' ? 'bg-green-500 border-green-500 text-white' : 'bg-yellow-400 border-yellow-400 text-white'
                    : val === 'regulated' ? 'border-green-400 text-green-600 hover:bg-green-50' : 'border-yellow-400 text-yellow-600 hover:bg-yellow-50'
                }`}
              >
                {val.charAt(0).toUpperCase() + val.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {STATE_OPTIONS.map(s => (
            <button key={s} type="button"
              onClick={() => toggleState(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-colors ${
                studentStates.includes(s)
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div>
          <p className="text-xs text-gray-400 mb-1.5">Departed</p>
          <div className="flex gap-2">
            {['regulated', 'dysregulated'].map(val => (
              <button key={val} type="button"
                onClick={() => setRegDeparture(prev => prev === val ? null : val)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-colors ${
                  regDeparture === val
                    ? val === 'regulated' ? 'bg-green-500 border-green-500 text-white' : 'bg-yellow-400 border-yellow-400 text-white'
                    : val === 'regulated' ? 'border-green-400 text-green-600 hover:bg-green-50' : 'border-yellow-400 text-yellow-600 hover:bg-yellow-50'
                }`}
              >
                {val.charAt(0).toUpperCase() + val.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <SmartNotesField
          value={sessionNotes}
          onChange={setSessionNotes}
          placeholder="Session notes…"
          rows={2}
        />

        <div>
          <label className="block text-xs text-gray-400 mb-1">Session Video URL</label>
          <input
            type="text"
            inputMode="url"
            value={sessionVideo}
            onChange={e => setSessionVideo(e.target.value)}
            placeholder="https://youtube.com/…"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <div>
          <p className="text-xs text-gray-400 mb-1.5">Invoice</p>
          <button
            type="button"
            onClick={() => setShowExternalLink(v => !v)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${showExternalLink ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            External Link
          </button>
          <p className="text-xs text-gray-400 mt-1">You can generate an invoice from the transcript page after saving.</p>
          {showExternalLink && (
            <input
              type="url"
              value={invoiceLink}
              onChange={e => setInvoiceLink(e.target.value)}
              placeholder="https://your-accounting-app.com/invoice/…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 mt-2"
            />
          )}
        </div>
      </div>

      {/* Writing surface */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Type to Talk</p>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>{finishedParagraphs.length} paragraph{finishedParagraphs.length === 1 ? '' : 's'} saved</span>
            <span className={misspokeCount > 0 ? 'text-red-500 font-semibold' : ''}>{misspokeCount} misspoke{misspokeCount === 1 ? '' : 's'}</span>
          </div>
        </div>
        <textarea
          value={text}
          onChange={handleTextChange}
          onFocus={unlockSpeech}
          placeholder="Type here — letters are spoken as they're poked, words on space, sentences on a period, and paragraphs on a double Enter…"
          rows={10}
          autoCorrect="off"
          autoCapitalize="off"
          autoComplete="off"
          spellCheck={false}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base leading-relaxed font-serif focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
        <p className="text-xs text-gray-400">Press Enter twice to finish a paragraph — it will be read aloud and saved.</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleFinishSession}
        disabled={saving}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
      >
        {saving ? 'Saving…' : 'Finish Session'}
      </button>
    </div>
  )
}
