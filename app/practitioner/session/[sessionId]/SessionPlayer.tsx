'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Lesson, QuestionType } from '@/lib/types'
import type { SessionResponse } from '@/lib/practitionerStore'

const QUESTION_COLORS: Record<QuestionType, string> = {
  KNOWN: '#15803d',
  'SEMI-OPEN': '#f97316',
  'PRIOR KNOWLEDGE': '#2563eb',
  MATH: '#7e22ce',
  VAKT: '#dc2626',
  OPEN: '#db2777',
}

function extractKeywords(text: string): string[] {
  const matches = text.match(/\b[A-Z][A-Z\s\-']{1,}[A-Z]\b/g) ?? []
  const unique: string[] = []
  for (const m of matches) {
    const word = m.trim()
    if (word.length >= 2 && !unique.includes(word)) unique.push(word)
  }
  return unique
}

interface QuestionCapture {
  questionText: string
  questionType: QuestionType
  expectedAnswer: string
  capturedAnswer: string
  misspokeCount: number
  completedAnswers: string[]
  asked: boolean
}

interface KeywordCapture {
  keyword: string
  misspokeCount: number
  asked: boolean
}

interface HunkCapture {
  keywords: KeywordCapture[]
  questions: QuestionCapture[]
}

export default function SessionPlayer({ sessionId, studentName, sessionDate, lesson, lessonId, studentId, initialResponses = [] }: {
  sessionId: string
  studentName: string
  sessionDate: string
  lesson: Lesson
  lessonId: string
  studentId: string
  initialResponses?: SessionResponse[]
}) {
  const router = useRouter()

  const resumeHunk = (() => {
    const hunkNums = initialResponses.filter(r => r.hunkNumber != null && r.hunkNumber > 0 && r.questionType !== 'SESSION_COMPLETE').map(r => r.hunkNumber as number)
    if (!hunkNums.length) return 0
    return Math.min(Math.max(...hunkNums) - 1, lesson.hunks.length - 1)
  })()

  const [currentHunk, setCurrentHunk] = useState(resumeHunk)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [captures, setCaptures] = useState<HunkCapture[]>(() =>
    lesson.hunks.map((hunk, hunkIdx) => {
      const hunkNum = hunkIdx + 1
      const existing = initialResponses.filter(r => r.hunkNumber != null && r.hunkNumber === hunkNum)
      return {
        keywords: extractKeywords(hunk.text).map(k => {
          const saved = existing.find(r => r.questionType === 'KEYWORD' && r.keyword === k)
          return { keyword: k, misspokeCount: saved?.misspokeCount ?? 0, asked: true }
        }),
        questions: hunk.questions.map(q => {
          const saved = existing.find(r => r.questionType !== 'KEYWORD' && r.questionText === q.question)
          return {
            questionText: q.question,
            questionType: q.type,
            expectedAnswer: q.answer ?? '',
            capturedAnswer: saved?.capturedAnswer === 'NOT_ASKED' ? '' : (saved?.capturedAnswer ?? ''),
            misspokeCount: saved?.misspokeCount ?? 0,
            completedAnswers: saved && q.type === 'SEMI-OPEN'
              ? (saved.capturedAnswer ?? '').split(', ').filter(Boolean)
              : [],
            asked: true,
          }
        }),
      }
    })
  )

  const savedState = initialResponses.find(r => r.questionType === 'SESSION_STATE')
  const savedNotes = initialResponses.find(r => r.questionType === 'SESSION_NOTES')
  const [studentStates, setStudentStates] = useState<string[]>(
    savedState?.capturedAnswer ? savedState.capturedAnswer.split(', ').filter(Boolean) : []
  )
  const [sessionNotes, setSessionNotes] = useState(savedNotes?.capturedAnswer ?? '')

  const hunk = lesson.hunks[currentHunk]
  const capture = captures[currentHunk]
  const isLast = currentHunk === lesson.hunks.length - 1

  const STATE_OPTIONS = ['Regulated', 'Dysregulated', 'Overstimulated', 'Understimulated', 'Sick', 'Tired', 'Hungry', 'Stuck in loops']

  function toggleState(s: string) {
    setStudentStates(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  function updateKeywordMisspoke(idx: number, delta: number) {
    setCaptures(prev => {
      const next = [...prev]
      const kws = [...next[currentHunk].keywords]
      const newCount = Math.max(0, kws[idx].misspokeCount + delta)
      // Tapping + means the word was asked — auto-mark it
      const asked = delta > 0 ? true : kws[idx].asked
      kws[idx] = { ...kws[idx], misspokeCount: newCount, asked }
      next[currentHunk] = { ...next[currentHunk], keywords: kws }
      return next
    })
  }

  function updateQuestionMisspoke(idx: number, delta: number) {
    setCaptures(prev => {
      const next = [...prev]
      const qs = [...next[currentHunk].questions]
      const newCount = Math.max(0, qs[idx].misspokeCount + delta)
      const asked = delta > 0 ? true : qs[idx].asked
      qs[idx] = { ...qs[idx], misspokeCount: newCount, asked }
      next[currentHunk] = { ...next[currentHunk], questions: qs }
      return next
    })
  }

  function toggleCompletedAnswer(questionIdx: number, answer: string) {
    setCaptures(prev => {
      const next = [...prev]
      const qs = [...next[currentHunk].questions]
      const current = qs[questionIdx].completedAnswers
      const updated = current.includes(answer)
        ? current.filter(a => a !== answer)
        : [...current, answer]
      qs[questionIdx] = { ...qs[questionIdx], completedAnswers: updated }
      next[currentHunk] = { ...next[currentHunk], questions: qs }
      return next
    })
  }

  function toggleKeywordAsked(idx: number) {
    setCaptures(prev => {
      const next = [...prev]
      const kws = [...next[currentHunk].keywords]
      kws[idx] = { ...kws[idx], asked: !kws[idx].asked, misspokeCount: kws[idx].asked ? 0 : kws[idx].misspokeCount }
      next[currentHunk] = { ...next[currentHunk], keywords: kws }
      return next
    })
  }

  function toggleQuestionAsked(idx: number) {
    setCaptures(prev => {
      const next = [...prev]
      const qs = [...next[currentHunk].questions]
      qs[idx] = { ...qs[idx], asked: !qs[idx].asked }
      next[currentHunk] = { ...next[currentHunk], questions: qs }
      return next
    })
  }

  function setCapturedAnswer(questionIdx: number, answer: string) {
    setCaptures(prev => {
      const next = [...prev]
      const qs = [...next[currentHunk].questions]
      qs[questionIdx] = { ...qs[questionIdx], capturedAnswer: answer }
      next[currentHunk] = { ...next[currentHunk], questions: qs }
      return next
    })
  }

  function buildResponses(complete: boolean) {
    return [
      { hunkNumber: 0, questionType: 'SESSION_STATE', questionText: 'Student State', capturedAnswer: studentStates.join(', '), expectedAnswer: '', misspokeCount: 0 },
      { hunkNumber: 0, questionType: 'SESSION_NOTES', questionText: 'Session Notes', capturedAnswer: sessionNotes, expectedAnswer: '', misspokeCount: 0 },
      ...(complete ? [{ hunkNumber: 0, questionType: 'SESSION_COMPLETE', questionText: 'Session Complete', capturedAnswer: 'true', expectedAnswer: '', misspokeCount: 0 }] : []),
      ...captures.flatMap((hunkCapture, hunkIdx) => [
        ...hunkCapture.keywords.map(k => ({
          hunkNumber: hunkIdx + 1,
          keyword: k.keyword,
          misspokeCount: k.asked ? k.misspokeCount : 0,
          questionType: 'KEYWORD',
          questionText: `Spell: ${k.keyword}`,
          expectedAnswer: k.keyword,
          capturedAnswer: k.asked ? '' : 'SKIPPED',
        })),
        ...hunkCapture.questions.map(q => ({
          hunkNumber: hunkIdx + 1,
          questionType: q.questionType,
          questionText: q.questionText,
          expectedAnswer: q.expectedAnswer,
          capturedAnswer: !q.asked ? 'NOT_ASKED' : q.questionType === 'SEMI-OPEN'
            ? q.completedAnswers.join(', ')
            : q.capturedAnswer,
          misspokeCount: q.asked ? q.misspokeCount : 0,
        })),
      ]),
    ]
  }

  async function handleSaveAndExit() {
    setSaving(true)
    setSaveError('')
    try {
      const res = await fetch(`/api/practitioner/sessions/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses: buildResponses(false) }),
      })
      if (!res.ok) {
        const data = await res.json()
        setSaveError(`Save failed: ${data.error ?? res.status}`)
        setSaving(false)
        return
      }
      router.push(`/practitioner/students/${studentId}`)
    } catch (e) {
      setSaveError(`Error: ${e instanceof Error ? e.message : String(e)}`)
      setSaving(false)
    }
  }

  async function handleComplete() {
    setSaving(true)
    setSaveError('')
    try {
      const responses = buildResponses(true)
      const res = await fetch(`/api/practitioner/sessions/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSaveError(`Save failed: ${data.error ?? res.status}`)
        setSaving(false)
        return
      }
      router.push(`/practitioner/transcript/${sessionId}`)
    } catch (e) {
      setSaveError(`Error: ${e instanceof Error ? e.message : String(e)}`)
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Session</p>
            <p className="font-bold text-gray-900 text-lg">{studentName}</p>
            <p className="text-sm text-gray-500">{lesson.title}</p>
            <p className="text-xs text-gray-400">{new Date(sessionDate + 'T00:00:00').toLocaleDateString()}</p>
          </div>
          <div className="text-right flex flex-col items-end gap-2">
            <a href={`/lessons/${lessonId}/print`} target="_blank" className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors">
              🖨 Print Lesson
            </a>
            <div>
              <p className="text-xs text-gray-400">Hunk</p>
              <p className="text-3xl font-bold text-blue-600">{currentHunk + 1}</p>
              <p className="text-xs text-gray-400">of {lesson.hunks.length}</p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${((currentHunk + 1) / lesson.hunks.length) * 100}%` }} />
        </div>

        {/* Observation panel — persistent */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Student Observation</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {STATE_OPTIONS.map(s => (
              <button
                key={s}
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
          <textarea
            value={sessionNotes}
            onChange={e => setSessionNotes(e.target.value)}
            placeholder="Session notes…"
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          />
        </div>

        {/* Lesson content card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Hunk {hunk.number}</p>

          {hunk.imageUrl && (
            <img src={hunk.imageUrl} alt={hunk.imageAlt || ''} className="w-full h-48 object-cover rounded-xl mb-4" />
          )}

          <p className="text-gray-900 leading-relaxed mb-5">{hunk.text}</p>

          {/* Spelling words */}
          {capture.keywords.length > 0 && (
            <div className="mb-5 p-3 bg-gray-50 rounded-xl">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Spelling Words</p>
              <div className="space-y-2">
                {capture.keywords.map((kw, i) => (
                  <div key={i} className={`flex items-center justify-between rounded-lg px-2 py-1 ${kw.asked ? '' : 'opacity-40'}`}>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${kw.asked ? 'text-gray-900' : 'text-gray-400 line-through'}`}>{kw.keyword}</span>
                      <span className="text-xs text-gray-400">{kw.keyword.replace(/\s/g, '').length} letters</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MisspokeCounter value={kw.misspokeCount} onChange={d => updateKeywordMisspoke(i, d)} />
                      <button
                        onClick={() => toggleKeywordAsked(i)}
                        className={`text-xs px-2 py-0.5 rounded border transition-colors ${kw.asked ? 'text-gray-400 border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200' : 'text-blue-500 border-blue-200 hover:bg-blue-50'}`}
                      >
                        {kw.asked ? 'Skip' : 'Undo'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Questions */}
          <div className="space-y-5">
            {capture.questions.map((q, i) => {
              const color = QUESTION_COLORS[q.questionType] ?? '#666'
              const isKnown = q.questionType === 'KNOWN'
              const isSemiOpen = q.questionType === 'SEMI-OPEN'
              const isOpen = q.questionType === 'OPEN' || q.questionType === 'PRIOR KNOWLEDGE'
              const isVakt = q.questionType === 'VAKT'
              const isMath = q.questionType === 'MATH'
              const answers = q.expectedAnswer.split('/').map(a => a.trim()).filter(Boolean)

              return (
                <div key={i} className={`border rounded-xl p-4 transition-colors ${q.asked ? 'border-gray-100' : 'border-gray-100 opacity-50'}`}>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <p className={`text-sm font-semibold ${q.asked ? '' : 'text-gray-400 line-through'}`} style={q.asked ? { color } : {}}>{q.questionText}</p>
                    <button
                      onClick={() => toggleQuestionAsked(i)}
                      className={`text-xs px-2 py-0.5 rounded border shrink-0 transition-colors ${q.asked ? 'text-gray-400 border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200' : 'text-blue-500 border-blue-200 hover:bg-blue-50'}`}
                    >
                      {q.asked ? 'Skip' : 'Undo'}
                    </button>
                  </div>

                  {/* KNOWN — answer + misspoke counter */}
                  {isKnown && (
                    <div className="space-y-2">
                      {q.expectedAnswer && (
                        <div className="flex flex-wrap gap-2">
                          {q.expectedAnswer.split('/').map(a => a.trim()).filter(Boolean).map((ans, ai) => (
                            <span key={ai} className="flex items-center gap-1.5">
                              <span className="px-3 py-1.5 rounded-lg text-sm font-medium bg-green-50 border border-green-200 text-green-800">{ans}</span>
                              <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-500">{ans.replace(/\s/g, '').length}</span>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">Misspoke:</span>
                        <MisspokeCounter value={q.misspokeCount} onChange={d => updateQuestionMisspoke(i, d)} />
                      </div>
                    </div>
                  )}

                  {/* SEMI-OPEN — misspoke counter + each answer toggleable */}
                  {isSemiOpen && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">Misspoke:</span>
                        <MisspokeCounter value={q.misspokeCount} onChange={d => updateQuestionMisspoke(i, d)} />
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {answers.map((ans, ai) => (
                          <span key={ai} className="flex items-center gap-1.5">
                            <button
                              onClick={() => toggleCompletedAnswer(i, ans)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-colors ${
                                q.completedAnswers.includes(ans)
                                  ? 'text-white border-transparent'
                                  : 'bg-white border-gray-200 text-gray-700 hover:border-orange-300'
                              }`}
                              style={q.completedAnswers.includes(ans) ? { backgroundColor: color, borderColor: color } : {}}
                            >
                              {ans}
                            </button>
                            <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-500">{ans.replace(/\s/g, '').length}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* OPEN / PRIOR KNOWLEDGE — text input */}
                  {isOpen && (
                    <input
                      type="text"
                      value={q.capturedAnswer}
                      onChange={e => setCapturedAnswer(i, e.target.value)}
                      placeholder="Type student's response…"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}

                  {/* MATH — correct / incorrect */}
                  {isMath && (
                    <div className="space-y-2">
                      {q.expectedAnswer && (
                        <p className="text-xs text-gray-500">Answer: <span className="font-semibold text-purple-700">{q.expectedAnswer}</span></p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCapturedAnswer(i, q.capturedAnswer === 'correct' ? '' : 'correct')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${q.capturedAnswer === 'correct' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'}`}
                        >
                          ✓ Correct
                        </button>
                        <button
                          onClick={() => setCapturedAnswer(i, q.capturedAnswer === 'incorrect' ? '' : 'incorrect')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${q.capturedAnswer === 'incorrect' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
                        >
                          ✗ Incorrect
                        </button>
                      </div>
                    </div>
                  )}

                  {/* VAKT — completion toggle */}
                  {isVakt && (
                    <button
                      onClick={() => setCapturedAnswer(i, q.capturedAnswer === 'COMPLETED' ? '' : 'COMPLETED')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${q.capturedAnswer === 'COMPLETED' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
                    >
                      ✓ Activity Done
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Navigation */}
        {saveError && <p className="text-sm text-red-600 text-center pb-2">{saveError}</p>}
        <div className="flex gap-3">
          {currentHunk > 0 && (
            <button onClick={() => setCurrentHunk(h => h - 1)} className="bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors">
              ← Back
            </button>
          )}
          <button onClick={handleSaveAndExit} disabled={saving} className="bg-white text-gray-700 px-4 py-3 rounded-xl font-medium text-sm border-2 border-gray-300 hover:bg-gray-50 disabled:opacity-60 transition-colors">
            {saving ? '…' : '💾 Save & Exit'}
          </button>
          {!isLast ? (
            <button onClick={() => setCurrentHunk(h => h + 1)} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors">
              Next Hunk →
            </button>
          ) : (
            <button onClick={handleComplete} disabled={saving} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-green-700 disabled:opacity-60 transition-colors">
              {saving ? 'Saving…' : '✓ Complete Session'}
            </button>
          )}
        </div>
      </div>
    </main>
  )
}

function MisspokeCounter({ value, onChange, disabled }: { value: number; onChange: (delta: number) => void; disabled?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${disabled ? 'pointer-events-none opacity-30' : ''}`}>
      <button onClick={() => onChange(-1)} className="w-7 h-7 rounded-full bg-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-300 transition-colors">−</button>
      <span className={`w-6 text-center font-bold text-sm ${value > 0 ? 'text-red-600' : 'text-gray-400'}`}>{value}</span>
      <button onClick={() => onChange(1)} className="w-7 h-7 rounded-full bg-red-100 text-red-700 font-bold text-sm hover:bg-red-200 transition-colors">+</button>
    </div>
  )
}
