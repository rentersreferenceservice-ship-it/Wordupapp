'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { Lesson, QuestionType } from '@/lib/types'
import type { SessionResponse, CRP } from '@/lib/practitionerStore'

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
  spellerSentence: string
}

interface KeywordCapture {
  keyword: string
  misspokeCount: number
  asked: boolean
}

interface ExtraKeywordCapture {
  word: string
  misspokeCount: number
  skipped: boolean
}

interface HunkCapture {
  keywords: KeywordCapture[]
  extraKeywords: ExtraKeywordCapture[]
  questions: QuestionCapture[]
  writingResponse: string
  writingMisspokes: number
  writingSkipped: boolean
  skipped: boolean
}

function playBell() {
  try {
    const ctx = new AudioContext()
    // Three-note ascending chime: C5 E5 G5
    ;[523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = ctx.currentTime + i * 0.18
      gain.gain.setValueAtTime(0.28 - i * 0.04, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 2.8)
      osc.start(t)
      osc.stop(t + 2.8)
    })
  } catch {}
}

function playWarningBell() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = 440
    gain.gain.setValueAtTime(0.12, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 1.4)
  } catch {}
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function SessionPlayer({ sessionId, studentName, sessionDate, lesson, lessonId, studentId, initialResponses = [], initialRegulationArrival = null, initialRegulationDeparture = null, crps = [], initialCrpId = null }: {
  sessionId: string
  studentName: string
  sessionDate: string
  lesson: Lesson
  lessonId: string
  studentId: string
  initialResponses?: SessionResponse[]
  initialRegulationArrival?: string | null
  initialRegulationDeparture?: string | null
  crps?: CRP[]
  initialCrpId?: string | null
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
      const savedExtras = initialResponses
        .filter(r => r.hunkNumber === hunkNum && r.questionType === 'EXTRA_SPELLING')
        .map(r => ({ word: r.keyword ?? '', misspokeCount: r.misspokeCount ?? 0, skipped: r.capturedAnswer === 'SKIPPED' }))
      while (savedExtras.length < 2) savedExtras.push({ word: '', misspokeCount: 0, skipped: false })

      const writingRecord = initialResponses.find(r => r.hunkNumber === hunkNum && r.questionType === 'WRITING_PROMPT')
      const writingSkipped = writingRecord?.capturedAnswer === 'SKIPPED'
      const hunkSkipped = initialResponses.some(r => r.hunkNumber === hunkNum && r.questionType === 'HUNK_SKIPPED')
      return {
        keywords: extractKeywords(hunk.text).map(k => {
          if (hunkSkipped) return { keyword: k, misspokeCount: 0, asked: false }
          const saved = existing.find(r => r.questionType === 'KEYWORD' && r.keyword === k)
          return { keyword: k, misspokeCount: saved?.misspokeCount ?? 0, asked: saved?.capturedAnswer !== 'SKIPPED' }
        }),
        extraKeywords: savedExtras,
        writingResponse: writingSkipped ? '' : (writingRecord?.capturedAnswer ?? ''),
        writingMisspokes: writingSkipped ? 0 : (writingRecord?.misspokeCount ?? 0),
        writingSkipped,
        skipped: hunkSkipped,
        questions: hunk.questions.map(q => {
          if (hunkSkipped) return {
            questionText: q.question, questionType: q.type, expectedAnswer: q.answer ?? '',
            capturedAnswer: '', misspokeCount: 0, completedAnswers: [], asked: false, spellerSentence: '',
          }
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
            asked: saved?.capturedAnswer !== 'NOT_ASKED',
            spellerSentence: saved?.spellerSentence ?? '',
          }
        }),
      }
    })
  )

  const savedState = initialResponses.find(r => r.questionType === 'SESSION_STATE')
  const savedNotes = initialResponses.find(r => r.questionType === 'SESSION_NOTES')
  const savedVideo = initialResponses.find(r => r.questionType === 'SESSION_VIDEO')
  const savedInvoice = initialResponses.find(r => r.questionType === 'SESSION_INVOICE')
  const [studentStates, setStudentStates] = useState<string[]>(
    savedState?.capturedAnswer ? savedState.capturedAnswer.split(', ').filter(Boolean) : []
  )
  const [sessionNotes, setSessionNotes] = useState(savedNotes?.capturedAnswer ?? '')
  const [sessionVideo, setSessionVideo] = useState(savedVideo?.capturedAnswer ?? '')
  const [sessionInvoice, setSessionInvoice] = useState(savedInvoice?.capturedAnswer ?? '')
  const [regArrival, setRegArrival] = useState<string | null>(initialRegulationArrival)
  const [regDeparture, setRegDeparture] = useState<string | null>(initialRegulationDeparture)
  const [crpId, setCrpId] = useState<string | null>(initialCrpId)
  const [addingCrp, setAddingCrp] = useState(false)
  const [newCrpName, setNewCrpName] = useState('')
  const [savingCrp, setSavingCrp] = useState(false)
  const [localCrps, setLocalCrps] = useState<CRP[]>(crps)
  const [invoiceMode, setInvoiceMode] = useState<'link' | 'generate'>(
    (savedInvoice?.capturedAnswer ?? '').startsWith('/practitioner/invoice/') ? 'generate' : 'link'
  )
  const [generatingInvoice, setGeneratingInvoice] = useState(false)
  const [invoiceError, setInvoiceError] = useState('')

  // Timer
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [timerActive, setTimerActive] = useState(false)
  const warningPlayedRef = useRef(false)
  const endPlayedRef = useRef(false)

  function startTimer(minutes: 50 | 100) {
    warningPlayedRef.current = false
    endPlayedRef.current = false
    setTimeLeft(minutes * 60)
    setTimerActive(true)
  }

  useEffect(() => {
    if (!timerActive) return
    const id = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 0) return 0
        const next = prev - 1
        if (next === 300 && !warningPlayedRef.current) {
          warningPlayedRef.current = true
          playWarningBell()
        }
        return next
      })
    }, 1000)
    return () => clearInterval(id)
  }, [timerActive])

  useEffect(() => {
    if (timeLeft === 0 && timerActive) {
      setTimerActive(false)
      if (!endPlayedRef.current) {
        endPlayedRef.current = true
        playBell()
      }
    }
  }, [timeLeft, timerActive])

  // Inline question/writing-prompt editing (saved to session.custom_hunks)
  const [questionEdits, setQuestionEdits] = useState<Record<string, string>>({})
  const [writingPromptEdits, setWritingPromptEdits] = useState<Record<number, string>>({})
  const [editingQKey, setEditingQKey] = useState<string | null>(null)
  const [editingWP, setEditingWP] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState('')

  const hunk = lesson.hunks[currentHunk]
  const capture = captures[currentHunk]
  const isLast = currentHunk === lesson.hunks.length - 1

  const STATE_OPTIONS = [
    'Happy', 'Excited', 'High energy',
    'Anxious', 'Frustrated', 'Sad', 'Overwhelmed',
    'Overstimulated', 'Understimulated', 'Sensory seeking',
    'Low energy', 'Shutdown', 'Stuck in loops',
    'Distracted', 'Transition difficulty',
    'Hungry', 'Tired', 'Sick', 'Pain',
  ]

  function toggleState(s: string) {
    setStudentStates(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  async function patchRegulation(field: 'regulation_arrival' | 'regulation_departure', value: string | null) {
    await fetch(`/api/practitioner/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    })
  }

  function toggleRegArrival(reg: string) {
    const next = regArrival === reg ? null : reg
    setRegArrival(next)
    patchRegulation('regulation_arrival', next)
  }

  function toggleRegDeparture(reg: string) {
    const next = regDeparture === reg ? null : reg
    setRegDeparture(next)
    patchRegulation('regulation_departure', next)
  }

  function selectCrp(id: string | null) {
    setCrpId(id)
    fetch(`/api/practitioner/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ crp_id: id }),
    })
  }

  async function handleAddCrp() {
    if (!newCrpName.trim()) return
    setSavingCrp(true)
    const res = await fetch('/api/practitioner/crps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, name: newCrpName.trim() }),
    })
    const data = await res.json()
    if (res.ok) {
      setLocalCrps(prev => [...prev, data.crp])
      selectCrp(data.crp.id)
      setNewCrpName('')
      setAddingCrp(false)
    }
    setSavingCrp(false)
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

  function updateExtraKeyword(idx: number, changes: Partial<ExtraKeywordCapture>) {
    setCaptures(prev => {
      const next = [...prev]
      const extras = [...next[currentHunk].extraKeywords]
      extras[idx] = { ...extras[idx], ...changes }
      next[currentHunk] = { ...next[currentHunk], extraKeywords: extras }
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

  function updateWritingResponse(text: string) {
    setCaptures(prev => {
      const next = [...prev]
      next[currentHunk] = { ...next[currentHunk], writingResponse: text }
      return next
    })
  }

  async function patchCustomHunks(qEdits: typeof questionEdits, wpEdits: typeof writingPromptEdits) {
    const customHunks = lesson.hunks.map((h, hi) => ({
      ...h,
      writingPrompt: hi in wpEdits ? wpEdits[hi] : h.writingPrompt,
      questions: h.questions.map((q, qi) => ({
        ...q,
        question: qEdits[`${hi}-${qi}`] ?? q.question,
      })),
    }))
    await fetch(`/api/practitioner/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ custom_hunks: customHunks }),
    })
  }

  function commitQuestionEdit(hunkIdx: number, qIdx: number) {
    const key = `${hunkIdx}-${qIdx}`
    const newEdits = { ...questionEdits, [key]: editDraft }
    setQuestionEdits(newEdits)
    setCaptures(prev => prev.map((cap, capIdx) =>
      capIdx !== hunkIdx ? cap : {
        ...cap,
        questions: cap.questions.map((q, qi) =>
          qi === qIdx ? { ...q, questionText: editDraft } : q
        ),
      }
    ))
    setEditingQKey(null)
    patchCustomHunks(newEdits, writingPromptEdits)
  }

  function commitWritingPromptEdit(hunkIdx: number) {
    const newEdits = { ...writingPromptEdits, [hunkIdx]: editDraft }
    setWritingPromptEdits(newEdits)
    setEditingWP(null)
    patchCustomHunks(questionEdits, newEdits)
  }

  function getEffectiveWritingPrompt(hunkIdx: number): string | undefined {
    return hunkIdx in writingPromptEdits ? writingPromptEdits[hunkIdx] : lesson.hunks[hunkIdx]?.writingPrompt
  }

  function updateWritingMisspokes(delta: number) {
    setCaptures(prev => {
      const next = [...prev]
      next[currentHunk] = { ...next[currentHunk], writingMisspokes: Math.max(0, next[currentHunk].writingMisspokes + delta) }
      return next
    })
  }

  function toggleWritingSkipped() {
    setCaptures(prev => {
      const next = [...prev]
      const skipping = !next[currentHunk].writingSkipped
      next[currentHunk] = { ...next[currentHunk], writingSkipped: skipping, writingResponse: skipping ? '' : next[currentHunk].writingResponse, writingMisspokes: skipping ? 0 : next[currentHunk].writingMisspokes }
      return next
    })
  }

  function setSpellerSentence(questionIdx: number, sentence: string) {
    setCaptures(prev => {
      const next = [...prev]
      const qs = [...next[currentHunk].questions]
      qs[questionIdx] = { ...qs[questionIdx], spellerSentence: sentence }
      next[currentHunk] = { ...next[currentHunk], questions: qs }
      return next
    })
  }

  async function handleGenerateInvoice() {
    setGeneratingInvoice(true)
    setInvoiceError('')
    try {
      const invoiceRes = await fetch('/api/practitioner/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
      const invoiceData = await invoiceRes.json()
      if (!invoiceRes.ok) {
        setInvoiceError(invoiceData.error ?? 'Failed to create invoice')
        setGeneratingInvoice(false)
        return
      }
      const invoicePath = `/practitioner/invoice/${invoiceData.invoiceId}`
      // Save all session data (including invoice link) before navigating away
      await fetch(`/api/practitioner/sessions/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses: buildResponses(false, invoicePath) }),
      })
      router.push(invoicePath)
    } catch (e) {
      setInvoiceError(e instanceof Error ? e.message : 'Failed to create invoice')
      setGeneratingInvoice(false)
    }
  }

  function buildResponses(complete: boolean, invoiceOverride?: string) {
    const invoiceValue = (invoiceOverride ?? sessionInvoice).trim()
    return [
      { hunkNumber: 0, questionType: 'SESSION_STATE', questionText: 'Student State', capturedAnswer: studentStates.join(', '), expectedAnswer: '', misspokeCount: 0 },
      { hunkNumber: 0, questionType: 'SESSION_NOTES', questionText: 'Session Notes', capturedAnswer: sessionNotes, expectedAnswer: '', misspokeCount: 0 },
      ...(sessionVideo.trim() ? [{ hunkNumber: 0, questionType: 'SESSION_VIDEO', questionText: 'Session Video', capturedAnswer: sessionVideo.trim(), expectedAnswer: '', misspokeCount: 0 }] : []),
      ...(invoiceValue ? [{ hunkNumber: 0, questionType: 'SESSION_INVOICE', questionText: 'Session Invoice', capturedAnswer: invoiceValue, expectedAnswer: '', misspokeCount: 0 }] : []),
      ...(complete ? [{ hunkNumber: 0, questionType: 'SESSION_COMPLETE', questionText: 'Session Complete', capturedAnswer: 'true', expectedAnswer: '', misspokeCount: 0 }] : []),
      ...captures.flatMap((hunkCapture, hunkIdx) => [
        ...(hunkCapture.skipped ? [{ hunkNumber: hunkIdx + 1, questionType: 'HUNK_SKIPPED', questionText: 'Hunk Skipped', capturedAnswer: 'true', expectedAnswer: '', misspokeCount: 0 }] : []),
        ...hunkCapture.keywords.map(k => ({
          hunkNumber: hunkIdx + 1,
          keyword: k.keyword,
          misspokeCount: k.asked ? k.misspokeCount : 0,
          questionType: 'KEYWORD',
          questionText: `Spell: ${k.keyword}`,
          expectedAnswer: k.keyword,
          capturedAnswer: k.asked ? '' : 'SKIPPED',
        })),
        ...hunkCapture.extraKeywords
          .filter(e => e.word.trim())
          .map(e => ({
            hunkNumber: hunkIdx + 1,
            keyword: e.word.trim().toUpperCase(),
            questionType: 'EXTRA_SPELLING',
            questionText: 'Additional Spelling Word',
            expectedAnswer: '',
            capturedAnswer: e.skipped ? 'SKIPPED' : '',
            misspokeCount: e.skipped ? 0 : e.misspokeCount,
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
          spellerSentence: q.spellerSentence || undefined,
        })),
        ...(hunkCapture.writingSkipped ? [{
          hunkNumber: hunkIdx + 1,
          questionType: 'WRITING_PROMPT',
          questionText: getEffectiveWritingPrompt(hunkIdx) ?? 'Writing Prompt',
          capturedAnswer: 'SKIPPED',
          expectedAnswer: '',
          misspokeCount: 0,
        }] : hunkCapture.writingResponse.trim() ? [{
          hunkNumber: hunkIdx + 1,
          questionType: 'WRITING_PROMPT',
          questionText: getEffectiveWritingPrompt(hunkIdx) ?? 'Writing Prompt',
          capturedAnswer: hunkCapture.writingResponse.trim(),
          expectedAnswer: '',
          misspokeCount: hunkCapture.writingMisspokes,
        }] : []),
      ]),
    ]
  }

  function autoSave() {
    fetch(`/api/practitioner/sessions/${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ responses: buildResponses(false) }),
    }).catch(() => {})
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
            {/* Timer */}
            {timeLeft === null ? (
              <div className="flex gap-1.5">
                <button onClick={() => startTimer(50)} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors">50 min</button>
                <button onClick={() => startTimer(100)} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors">100 min</button>
              </div>
            ) : (
              <div className={`text-center ${timeLeft === 0 ? 'animate-pulse' : timeLeft <= 300 ? 'animate-pulse' : ''}`}>
                <p className="text-xs text-gray-400">Time Left</p>
                <p className={`text-2xl font-bold tabular-nums ${
                  timeLeft === 0 ? 'text-red-600' :
                  timeLeft <= 300 ? 'text-amber-500' :
                  'text-green-600'
                }`}>
                  {formatTime(timeLeft)}
                </p>
                <button
                  onClick={() => setTimerActive(v => !v)}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {timerActive ? 'Pause' : timeLeft === 0 ? 'Done' : 'Resume'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${((currentHunk + 1) / lesson.hunks.length) * 100}%` }} />
        </div>

        {/* Observation panel — persistent */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Student Observation</p>

          {/* Facilitator selector */}
          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-1.5">Session run by</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => selectCrp(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-colors ${
                  crpId === null
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-blue-300 text-blue-600 hover:bg-blue-50'
                }`}
              >
                Practitioner
              </button>
              {localCrps.map(crp => (
                <button
                  key={crp.id}
                  onClick={() => selectCrp(crp.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-colors ${
                    crpId === crp.id ? 'text-white' : 'hover:opacity-80'
                  }`}
                  style={crpId === crp.id
                    ? { backgroundColor: crp.color, borderColor: crp.color }
                    : { borderColor: crp.color, color: crp.color }
                  }
                >
                  {crp.name}
                </button>
              ))}
              {!addingCrp && (
                <button
                  onClick={() => setAddingCrp(true)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold border-2 border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors"
                >
                  + New CRP
                </button>
              )}
            </div>
            {addingCrp && (
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={newCrpName}
                  onChange={e => setNewCrpName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddCrp(); if (e.key === 'Escape') { setAddingCrp(false); setNewCrpName('') } }}
                  placeholder="CRP name…"
                  autoFocus
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={handleAddCrp} disabled={savingCrp || !newCrpName.trim()} className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-medium disabled:opacity-50">
                  {savingCrp ? '…' : 'Add'}
                </button>
                <button onClick={() => { setAddingCrp(false); setNewCrpName('') }} className="text-gray-400 text-xs px-1">Cancel</button>
              </div>
            )}
          </div>

          {/* Arrival regulation */}
          <div className="mb-3">
            <p className="text-xs text-gray-400 mb-1.5">Arrived</p>
            <div className="flex gap-2">
              <button
                onClick={() => toggleRegArrival('regulated')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-colors ${
                  regArrival === 'regulated'
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-green-400 text-green-600 hover:bg-green-50'
                }`}
              >
                Regulated
              </button>
              <button
                onClick={() => toggleRegArrival('dysregulated')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-colors ${
                  regArrival === 'dysregulated'
                    ? 'bg-yellow-400 border-yellow-400 text-white'
                    : 'border-yellow-400 text-yellow-600 hover:bg-yellow-50'
                }`}
              >
                Dysregulated
              </button>
            </div>
          </div>

          {/* Student state chips */}
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

          {/* Session notes */}
          <textarea
            value={sessionNotes}
            onChange={e => setSessionNotes(e.target.value)}
            placeholder="Session notes…"
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none mb-3"
          />

          {/* Video & Invoice */}
          <div className="flex flex-col gap-2 mb-3">
            <div>
              <p className="text-xs text-gray-400 mb-1">Session Video URL</p>
              <input
                type="text"
                value={sessionVideo}
                onChange={e => setSessionVideo(e.target.value)}
                placeholder="https://youtube.com/…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Invoice</p>
              <div className="flex gap-2 mb-2">
                <button type="button" onClick={() => setInvoiceMode('link')} className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${invoiceMode === 'link' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>External Link</button>
                <button type="button" onClick={() => setInvoiceMode('generate')} className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${invoiceMode === 'generate' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Generate Invoice</button>
              </div>
              {invoiceMode === 'link' ? (
                <input
                  type="url"
                  value={sessionInvoice}
                  onChange={e => setSessionInvoice(e.target.value)}
                  placeholder="https://your-accounting-app.com/invoice/…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              ) : (
                <div>
                  {sessionInvoice.startsWith('/practitioner/invoice/') ? (
                    <div className="flex items-center gap-3">
                      <a href={sessionInvoice} className="text-blue-600 text-sm font-medium hover:underline">View Invoice →</a>
                      <button type="button" onClick={() => setSessionInvoice('')} className="text-xs text-gray-400 hover:text-gray-600">Remove</button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleGenerateInvoice}
                      disabled={generatingInvoice}
                      className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition-colors"
                    >
                      {generatingInvoice ? 'Creating…' : 'Create Invoice'}
                    </button>
                  )}
                  {invoiceError && <p className="text-xs text-red-600 mt-1">{invoiceError}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Departure regulation */}
          <div>
            <p className="text-xs text-gray-400 mb-1.5">Departed</p>
            <div className="flex gap-2">
              <button
                onClick={() => toggleRegDeparture('regulated')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-colors ${
                  regDeparture === 'regulated'
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-green-400 text-green-600 hover:bg-green-50'
                }`}
              >
                Regulated
              </button>
              <button
                onClick={() => toggleRegDeparture('dysregulated')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-colors ${
                  regDeparture === 'dysregulated'
                    ? 'bg-yellow-400 border-yellow-400 text-white'
                    : 'border-yellow-400 text-yellow-600 hover:bg-yellow-50'
                }`}
              >
                Dysregulated
              </button>
            </div>
          </div>
        </div>

        {/* Lesson content card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Hunk {hunk.number}</p>

          {hunk.imageUrl && (
            <img src={hunk.imageUrl} alt={hunk.imageAlt || ''} className="w-full max-h-48 object-contain rounded-xl mb-4 bg-gray-50" />
          )}

          <p className="text-gray-900 leading-relaxed mb-5">{hunk.text}</p>

          {/* Spelling words */}
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
              {capture.extraKeywords.map((ek, i) => (
                <div key={`extra-${i}`} className={`flex items-center justify-between rounded-lg px-2 py-1 ${ek.skipped ? 'opacity-40' : ''}`}>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={ek.word}
                      onChange={e => updateExtraKeyword(i, { word: e.target.value.toUpperCase() })}
                      placeholder="+ Add word…"
                      className="font-bold text-gray-900 bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none text-sm w-28 placeholder:text-gray-400 placeholder:font-normal"
                    />
                    {ek.word.trim() && (
                      <span className="text-xs text-gray-400">{ek.word.replace(/\s/g, '').length} letters</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {!ek.skipped && <MisspokeCounter value={ek.misspokeCount} onChange={d => updateExtraKeyword(i, { misspokeCount: Math.max(0, ek.misspokeCount + d) })} />}
                    <button
                      onClick={() => updateExtraKeyword(i, { skipped: !ek.skipped, misspokeCount: 0 })}
                      className={`text-xs px-2 py-0.5 rounded border transition-colors ${ek.skipped ? 'text-blue-500 border-blue-200 hover:bg-blue-50' : 'text-gray-400 border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200'}`}
                    >
                      {ek.skipped ? 'Undo' : 'Skip'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Writing Prompt */}
          <div className="mb-5 mt-1 p-4 bg-pink-50 rounded-xl border border-pink-100">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-pink-500 uppercase tracking-wide">Writing Prompt</p>
              {!capture.writingSkipped && editingWP !== currentHunk && (
                <button
                  onClick={() => { setEditDraft(getEffectiveWritingPrompt(currentHunk) ?? ''); setEditingWP(currentHunk) }}
                  className="text-gray-300 hover:text-pink-400 text-sm transition-colors"
                  title="Edit writing prompt"
                >✏</button>
              )}
            </div>
            {editingWP === currentHunk ? (
              <div className="space-y-1 mb-2">
                <textarea
                  value={editDraft}
                  onChange={e => setEditDraft(e.target.value)}
                  rows={2}
                  autoFocus
                  className="w-full border border-pink-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none"
                />
                <div className="flex gap-2">
                  <button onClick={() => commitWritingPromptEdit(currentHunk)} className="text-xs bg-pink-500 text-white px-3 py-1 rounded-lg hover:bg-pink-600">Save</button>
                  <button onClick={() => setEditingWP(null)} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                </div>
              </div>
            ) : (
              getEffectiveWritingPrompt(currentHunk) && !capture.writingSkipped && (
                <p className="text-xs text-pink-600 italic mb-2">{getEffectiveWritingPrompt(currentHunk)}</p>
              )
            )}
            {capture.writingSkipped ? (
              <p className="text-xs text-gray-400 italic mb-2">Skipped — student did not engage in writing</p>
            ) : (
              <textarea
                value={capture.writingResponse}
                onChange={e => updateWritingResponse(e.target.value)}
                placeholder="Type the student's written response…"
                rows={3}
                className="w-full text-sm border-2 border-pink-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 resize-none text-gray-800 placeholder-pink-300 bg-white"
              />
            )}
            <div className="flex items-center gap-4 mt-2">
              {!capture.writingSkipped && capture.writingResponse && (
                <span className="text-xs font-semibold text-blue-500">
                  {capture.writingResponse.replace(/\s/g, '').length} letters
                </span>
              )}
              {!capture.writingSkipped && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Misspoke:</span>
                  <MisspokeCounter value={capture.writingMisspokes} onChange={updateWritingMisspokes} />
                </div>
              )}
              <button
                onClick={toggleWritingSkipped}
                className={`text-xs font-semibold px-3 py-1 rounded-full border-2 transition-colors ml-auto ${capture.writingSkipped ? 'bg-blue-100 text-blue-600 border-blue-300 hover:bg-blue-200' : 'bg-white text-red-500 border-red-300 hover:bg-red-50'}`}
              >
                {capture.writingSkipped ? 'Undo Skip' : 'Skip'}
              </button>
            </div>
          </div>

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
                    {editingQKey === `${currentHunk}-${i}` ? (
                      <div className="flex-1 space-y-1">
                        <textarea
                          value={editDraft}
                          onChange={e => setEditDraft(e.target.value)}
                          rows={2}
                          autoFocus
                          className="w-full border border-blue-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => commitQuestionEdit(currentHunk, i)} className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700">Save</button>
                          <button onClick={() => setEditingQKey(null)} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-start gap-1">
                        <p className={`flex-1 text-sm font-semibold ${q.asked ? '' : 'text-gray-400 line-through'}`} style={q.asked ? { color } : {}}>{q.questionText}</p>
                        <button
                          onClick={() => { setEditDraft(q.questionText); setEditingQKey(`${currentHunk}-${i}`) }}
                          className="text-gray-300 hover:text-blue-500 text-sm transition-colors shrink-0"
                          title="Edit question"
                        >✏</button>
                      </div>
                    )}
                    <button
                      onClick={() => toggleQuestionAsked(i)}
                      className={`text-xs px-2 py-0.5 rounded border shrink-0 transition-colors ${q.asked ? 'text-gray-400 border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200' : 'text-blue-500 border-blue-200 hover:bg-blue-50'}`}
                    >
                      {q.asked ? 'Skip' : 'Undo'}
                    </button>
                  </div>

                  {/* KNOWN — answer + misspoke counter + sentence */}
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
                      <textarea
                        value={q.spellerSentence}
                        onChange={e => setSpellerSentence(i, e.target.value)}
                        placeholder="Speller's full sentence…"
                        rows={2}
                        className="w-full border-2 border-green-200 bg-green-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none placeholder-gray-400"
                      />
                    </div>
                  )}

                  {/* SEMI-OPEN — misspoke counter + each answer toggleable + sentence */}
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
                      <textarea
                        value={q.spellerSentence}
                        onChange={e => setSpellerSentence(i, e.target.value)}
                        placeholder="Speller's full sentence…"
                        rows={2}
                        className="w-full border-2 border-orange-200 bg-orange-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none placeholder-gray-400"
                      />
                    </div>
                  )}

                  {/* OPEN / PRIOR KNOWLEDGE — text input + misspoke counter */}
                  {isOpen && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={q.capturedAnswer}
                        onChange={e => setCapturedAnswer(i, e.target.value)}
                        placeholder="Type student's response…"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">Misspoke:</span>
                        <MisspokeCounter value={q.misspokeCount} onChange={d => updateQuestionMisspoke(i, d)} />
                        {q.capturedAnswer && (
                          <span className="text-xs text-gray-400">{q.capturedAnswer.replace(/\s/g, '').length} letters</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* MATH — correct / incorrect + sentence */}
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
                      <textarea
                        value={q.spellerSentence}
                        onChange={e => setSpellerSentence(i, e.target.value)}
                        placeholder="Speller's full sentence…"
                        rows={2}
                        className="w-full border-2 border-purple-200 bg-purple-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none placeholder-gray-400"
                      />
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
            <button onClick={() => setCurrentHunk(h => h - 1)} className="bg-gray-100 text-gray-700 border-2 border-blue-600 px-4 py-3 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors">
              ← Back
            </button>
          )}
          <button onClick={handleSaveAndExit} disabled={saving} className="bg-white text-gray-700 px-4 py-3 rounded-xl font-medium text-sm border-2 border-gray-300 hover:bg-gray-50 disabled:opacity-60 transition-colors">
            {saving ? '…' : '💾 Save & Exit'}
          </button>
          {capture.skipped ? (
            <button
              onClick={() => {
                setCaptures(prev => {
                  const next = [...prev]
                  const c = next[currentHunk]
                  next[currentHunk] = {
                    ...c,
                    skipped: false,
                    keywords: c.keywords.map(k => ({ ...k, asked: true, misspokeCount: 0 })),
                    extraKeywords: c.extraKeywords.map(e => ({ ...e, skipped: false, misspokeCount: 0 })),
                    questions: c.questions.map(q => ({ ...q, asked: true, misspokeCount: 0, capturedAnswer: '', completedAnswers: [] })),
                    writingSkipped: false,
                    writingResponse: '',
                    writingMisspokes: 0,
                  }
                  return next
                })
              }}
              className="bg-blue-50 text-blue-600 px-4 py-3 rounded-xl font-medium text-sm border border-blue-200 hover:bg-blue-100 transition-colors"
            >
              Unskip
            </button>
          ) : (
            <button
              onClick={() => {
                setCaptures(prev => {
                  const next = [...prev]
                  const c = next[currentHunk]
                  next[currentHunk] = {
                    ...c,
                    skipped: true,
                    keywords: c.keywords.map(k => ({ ...k, asked: false, misspokeCount: 0 })),
                    extraKeywords: c.extraKeywords.map(e => ({ ...e, skipped: true, misspokeCount: 0 })),
                    questions: c.questions.map(q => ({ ...q, asked: false, misspokeCount: 0, capturedAnswer: '', completedAnswers: [] })),
                    writingSkipped: true,
                    writingResponse: '',
                    writingMisspokes: 0,
                  }
                  return next
                })
                if (!isLast) setCurrentHunk(h => h + 1)
                else handleComplete()
              }}
              className="bg-gray-100 text-gray-500 px-4 py-3 rounded-xl font-medium text-sm border border-gray-200 hover:bg-gray-200 transition-colors"
            >
              Skip Page
            </button>
          )}
          {!isLast ? (
            <button onClick={() => { autoSave(); setCurrentHunk(h => h + 1) }} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors">
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
