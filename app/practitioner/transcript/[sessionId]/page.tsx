import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getSessionResponses, getStudentAccuracyHistory } from '@/lib/practitionerStore'
import { getSupabase } from '@/lib/supabase'
import Link from 'next/link'
import type { QuestionType, Hunk } from '@/lib/types'
import PrintTranscriptButton from './PrintTranscriptButton'
import SendTranscriptButton from './SendTranscriptButton'
import GenerateInvoiceButton from './GenerateInvoiceButton'
import AccuracyChart from '@/app/AccuracyChart'
import SpellerSentenceInput from './SpellerSentenceInput'

export const dynamic = 'force-dynamic'

const QUESTION_COLORS: Record<string, string> = {
  KNOWN: '#15803d',
  'SEMI-OPEN': '#f97316',
  'PRIOR KNOWLEDGE': '#2563eb',
  MATH: '#7e22ce',
  VAKT: '#dc2626',
  OPEN: '#db2777',
  KEYWORD: '#64748b',
}

export default async function TranscriptPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const { userId } = await auth()
  if (!userId) redirect('/practitioner/get-started')


  const { data: session } = await getSupabase()
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('practitioner_id', userId)
    .single()

  if (!session) redirect('/practitioner/dashboard')

  const { data: studentData } = await getSupabase()
    .from('students')
    .select('name, age_group, guardian_email, session_rate')
    .eq('id', session.student_id)
    .single()

  const [responses, accuracyHistory, lessonRow] = await Promise.all([
    getSessionResponses(sessionId),
    getStudentAccuracyHistory(session.student_id, userId),
    session.lesson_id
      ? getSupabase().from('lessons').select('hunks').eq('id', session.lesson_id).single().then(r => r.data)
      : Promise.resolve(null),
  ])

  const lessonHunks = (lessonRow?.hunks ?? []) as Hunk[]

  // Extract session-level records
  const sessionStateRecord = responses.find(r => r.questionType === 'SESSION_STATE')
  const sessionNotesRecord = responses.find(r => r.questionType === 'SESSION_NOTES')
  const sessionVideoRecord = responses.find(r => r.questionType === 'SESSION_VIDEO')
  const sessionInvoiceRecord = responses.find(r => r.questionType === 'SESSION_INVOICE')

  // Group by hunk — skip hunk 0 special records
  const byHunk: Record<number, typeof responses> = {}
  for (const r of responses) {
    if (r.hunkNumber == null || r.hunkNumber <= 0) continue
    if (!byHunk[r.hunkNumber]) byHunk[r.hunkNumber] = []
    byHunk[r.hunkNumber].push(r)
  }

  const writingHunkNumbers: number[] = lessonHunks.length > 0
    ? lessonHunks.map(h => h.number)
    : Object.keys(byHunk).length > 0
      ? Object.keys(byHunk).map(Number).sort((a, b) => a - b)
      : [1, 2, 3, 4, 5, 6, 7, 8]

  const spellKeywords = responses.filter(r => r.questionType === 'KEYWORD' && r.capturedAnswer !== 'SKIPPED' && r.hunkNumber != null && r.hunkNumber > 0)
  const spellKnown = responses.filter(r => r.questionType === 'KNOWN' && r.capturedAnswer !== 'NOT_ASKED' && r.hunkNumber != null && r.hunkNumber > 0)
  const sentenceLetters = responses
    .filter(r => r.spellerSentence && r.spellerSentence.trim())
    .reduce((sum, r) => sum + (r.spellerSentence ?? '').replace(/\s/g, '').length, 0)
  const writingLetters = responses
    .filter(r => r.questionType === 'WRITING_PROMPT' && r.capturedAnswer && r.capturedAnswer !== 'SKIPPED' && r.hunkNumber != null && r.hunkNumber > 0)
    .reduce((sum, r) => sum + (r.capturedAnswer ?? '').replace(/\s/g, '').length, 0)
  const totalLetters =
    spellKeywords.reduce((sum, k) => sum + (k.keyword ?? '').replace(/\s/g, '').length, 0) +
    spellKnown.reduce((sum, q) => sum + (q.expectedAnswer ?? '').split('/').reduce((s, a) => s + a.trim().replace(/\s/g, '').length, 0), 0) +
    sentenceLetters +
    writingLetters
  const totalMisspokes = responses
    .filter(r => r.hunkNumber != null && r.hunkNumber > 0 && r.capturedAnswer !== 'NOT_ASKED' && r.capturedAnswer !== 'SKIPPED')
    .reduce((sum, r) => sum + (r.misspokeCount ?? 0), 0)
  const totalPokes = totalLetters + totalMisspokes
  const correctPct = totalPokes > 0 ? Math.round((totalLetters / totalPokes) * 100) : 0
  const misspokePct = totalPokes > 0 ? 100 - correctPct : 0

  const mathAsked = responses.filter(r => r.questionType === 'MATH' && r.capturedAnswer !== 'NOT_ASKED' && r.hunkNumber != null && r.hunkNumber > 0)
  const mathAnswered = mathAsked.filter(r => r.capturedAnswer === 'correct' || r.capturedAnswer === 'incorrect')
  const mathCorrect = mathAnswered.filter(r => r.capturedAnswer === 'correct').length
  const openAsked = responses.filter(r => r.questionType === 'OPEN' && r.capturedAnswer !== 'NOT_ASKED' && r.hunkNumber != null && r.hunkNumber > 0)
  const openAnsweredItems = openAsked.filter(r => r.capturedAnswer && r.capturedAnswer.trim() !== '')
  const openAnswered = openAnsweredItems.length
  const openLetters = openAnsweredItems.reduce((sum, r) => sum + (r.capturedAnswer ?? '').replace(/\s/g, '').length, 0)
  const openMisspokes = openAnsweredItems.reduce((sum, r) => sum + (r.misspokeCount ?? 0), 0)
  const openPokes = openLetters + openMisspokes
  const priorAsked = responses.filter(r => r.questionType === 'PRIOR KNOWLEDGE' && r.capturedAnswer !== 'NOT_ASKED' && r.hunkNumber != null && r.hunkNumber > 0)
  const priorAnswered = priorAsked.filter(r => r.capturedAnswer && r.capturedAnswer.trim() !== '').length

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @media print {
          @page { margin: 0.6in; size: letter; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { background: white !important; }
        }
      `}</style>
      <div className="max-w-3xl mx-auto px-6 py-8 print:px-0 print:py-0">
        {/* Nav - hidden on print */}
        <div className="flex gap-3 mb-6 print:hidden">
          <Link href="/practitioner/dashboard" className="bg-gray-100 text-gray-700 border-2 border-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
            ← Dashboard
          </Link>
          <Link href={`/practitioner/transcript/${sessionId}/edit`} className="bg-gray-100 text-gray-700 border-2 border-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
            Edit
          </Link>
          <SendTranscriptButton sessionId={sessionId} defaultTo={studentData?.guardian_email ?? ''} />
          <GenerateInvoiceButton sessionId={sessionId} hasInvoice={!!sessionInvoiceRecord} />
          <PrintTranscriptButton />
        </div>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 print:shadow-none print:border-0 print:rounded-none print-card">
          <div className="flex items-start justify-between">
            <div>
              <img src="/word_up_clean.jpeg" alt="Word Up" style={{ width: 100, marginBottom: 8 }} />
              <h1 className="text-2xl font-bold text-gray-900">Session Transcript</h1>
              <p className="text-gray-600 mt-1">{session.lesson_title}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{studentData?.name}</p>
              <p className="text-sm text-gray-500 mt-1">{studentData?.age_group}</p>
              <p className="text-sm text-gray-500">{new Date(session.session_date + 'T00:00:00').toLocaleDateString()}</p>
            </div>
          </div>

          {/* Student state & notes — always shown at top */}
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
            {/* Regulation: arrival and departure */}
            {(session.regulation_arrival || session.regulation_departure) && (
              <div className="flex gap-6">
                {session.regulation_arrival && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Arrived</p>
                    <span className={`text-xs font-semibold ${session.regulation_arrival === 'regulated' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {session.regulation_arrival === 'regulated' ? '● Regulated' : '● Dysregulated'}
                    </span>
                  </div>
                )}
                {session.regulation_departure && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Departed</p>
                    <span className={`text-xs font-semibold ${session.regulation_departure === 'regulated' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {session.regulation_departure === 'regulated' ? '● Regulated' : '● Dysregulated'}
                    </span>
                  </div>
                )}
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Student State</p>
              {sessionStateRecord?.capturedAnswer
                ? (
                  <div className="flex flex-wrap gap-1.5">
                    {sessionStateRecord.capturedAnswer.split(', ').filter(Boolean).map((s, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-full border-2 border-indigo-500 text-xs text-indigo-700 font-medium">{s}</span>
                    ))}
                  </div>
                )
                : <p className="text-xs text-gray-300 italic">Not recorded</p>
              }
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Session Notes</p>
              {sessionNotesRecord?.capturedAnswer
                ? <p className="text-sm text-gray-700 whitespace-pre-wrap">{sessionNotesRecord.capturedAnswer}</p>
                : <p className="text-xs text-gray-300 italic">None</p>
              }
            </div>
            {(sessionVideoRecord?.capturedAnswer || sessionInvoiceRecord?.capturedAnswer) && (
              <div className="space-y-3 pt-1">
                {sessionVideoRecord?.capturedAnswer && (() => {
                  const videoUrl = sessionVideoRecord.capturedAnswer
                  const ytMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
                  const ytId = ytMatch?.[1]
                  return (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Session Video</p>
                      {ytId ? (
                        <div className="rounded-xl overflow-hidden print:hidden" style={{ aspectRatio: '16/9', maxWidth: 480 }}>
                          <iframe
                            src={`https://www.youtube.com/embed/${ytId}`}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 underline break-all">
                          {videoUrl}
                        </a>
                      )}
                    </div>
                  )
                })()}
                {sessionInvoiceRecord?.capturedAnswer && (() => {
                  const inv = sessionInvoiceRecord.capturedAnswer
                  const isInternal = inv.startsWith('/practitioner/invoice/')
                  return (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Invoice</p>
                      <a
                        href={inv}
                        target={isInternal ? '_self' : '_blank'}
                        rel={isInternal ? undefined : 'noopener noreferrer'}
                        className="inline-flex items-center gap-1.5 bg-green-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-green-700 transition-colors print:hidden"
                      >
                        View Invoice →
                      </a>
                      <p className="hidden print:block text-xs text-gray-500 break-all">{inv}</p>
                    </div>
                  )
                })()}
              </div>
            )}
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-200">
            <div className="text-center bg-blue-50 rounded-xl py-3">
              <p className="text-3xl font-bold text-blue-600">{totalLetters}</p>
              <p className="text-xs font-semibold text-blue-500 mt-1">Letters to Poke</p>
            </div>
            <div className="text-center bg-red-50 rounded-xl py-3">
              <p className="text-3xl font-bold text-red-500">{totalMisspokes}</p>
              <p className="text-xs font-semibold text-red-400 mt-1">Misspokes</p>
            </div>
            <div className="text-center bg-green-50 rounded-xl py-3">
              <p className="text-3xl font-bold text-green-600">{correctPct}%</p>
              <p className="text-xs font-semibold text-green-500 mt-1">Accuracy</p>
              <p className="text-xs text-gray-400 mt-0.5">{totalPokes} total pokes</p>
            </div>
          </div>
          {(mathAnswered.length > 0 || openAsked.length > 0 || priorAsked.length > 0) && (
            <div className="flex gap-3 mt-3">
              {mathAnswered.length > 0 && (
                <div className="flex-1 text-center bg-purple-50 rounded-xl py-2">
                  <p className="text-2xl font-bold text-purple-700">{mathCorrect}/{mathAnswered.length}</p>
                  <p className="text-xs font-semibold text-purple-500 mt-0.5">Math Correct</p>
                </div>
              )}
              {priorAsked.length > 0 && (
                <div className="flex-1 text-center bg-blue-50 rounded-xl py-2">
                  <p className="text-2xl font-bold text-blue-600">{priorAnswered}/{priorAsked.length}</p>
                  <p className="text-xs font-semibold text-blue-500 mt-0.5">Prior Knowledge</p>
                </div>
              )}
              {openAsked.length > 0 && (
                <div className="flex-1 text-center bg-pink-50 rounded-xl py-2">
                  <p className="text-2xl font-bold text-pink-600">{openAnswered}/{openAsked.length}</p>
                  <p className="text-xs font-semibold text-pink-500 mt-0.5">Open Responses</p>
                  {openPokes > 0 && (
                    <p className="text-xs text-pink-400 mt-0.5">{openLetters}L · {openMisspokes}✗ · {openPokes} pokes</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Accuracy trend chart */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Accuracy — Past 12 Months</p>
            <AccuracyChart data={accuracyHistory} currentSessionId={sessionId} />
          </div>
        </div>

        {/* Per-hunk detail */}
        {Object.entries(byHunk).sort(([a], [b]) => Number(a) - Number(b)).map(([hunkNum, items]) => {

          const allHunkKeywords = items.filter(r => (r.questionType === 'KEYWORD' || r.questionType === 'EXTRA_SPELLING') && r.capturedAnswer !== 'SKIPPED' && (r.keyword ?? '').trim() !== '')
          const seenKeywords = new Set<string>()
          const hunkKeywords = allHunkKeywords.filter(r => {
            const key = (r.keyword ?? '').toUpperCase().trim()
            if (seenKeywords.has(key)) return false
            seenKeywords.add(key)
            return true
          })
          const hunkQuestions = items.filter(r => r.questionType !== 'KEYWORD' && r.questionType !== 'EXTRA_SPELLING' && r.questionType !== 'WRITING_PROMPT' && r.questionType !== 'HUNK_SKIPPED' && r.capturedAnswer !== 'NOT_ASKED' && r.capturedAnswer !== 'SKIP')
          const hunkWasSkipped = items.some(r => r.questionType === 'HUNK_SKIPPED')
          if (hunkKeywords.length === 0 && hunkQuestions.length === 0 && !hunkWasSkipped) return null
          return (
            <div key={hunkNum} className={`bg-white rounded-2xl shadow-sm border p-5 mb-4 print:shadow-none print:border print:rounded-lg print-card ${hunkWasSkipped ? 'border-gray-200 opacity-60' : 'border-gray-100'}`}>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide">Hunk {hunkNum}</h2>
                {hunkWasSkipped && <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full uppercase tracking-wide">Skipped</span>}
              </div>

              {hunkKeywords.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 mb-2">Spelling Words</p>
                  <div className="flex flex-wrap gap-2">
                    {hunkKeywords.map((k, i) => (
                      <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm print-keyword ${k.capturedAnswer === 'SKIPPED' ? 'bg-gray-50 border border-gray-200 opacity-50' : (k.misspokeCount ?? 0) > 0 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                        <span className={`font-bold ${k.capturedAnswer === 'SKIPPED' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{k.keyword}</span>
                        <span className="text-xs text-gray-400">{(k.keyword ?? '').replace(/\s/g, '').length}L</span>
                        {k.capturedAnswer === 'SKIPPED' && <span className="text-xs text-gray-400">not asked</span>}
                        {k.capturedAnswer !== 'SKIPPED' && (k.misspokeCount ?? 0) > 0 && (
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: '#ef4444', borderRadius: 999, padding: '1px 7px' }}>{k.misspokeCount} ✗</span>
                        )}
                        {k.capturedAnswer !== 'SKIPPED' && (k.misspokeCount ?? 0) === 0 && (
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#15803d' }}>✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {hunkQuestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 mb-2">Questions</p>
                  {hunkQuestions.map((q, i) => {
                    const color = QUESTION_COLORS[q.questionType] ?? '#666'
                    const notAsked = q.capturedAnswer === 'NOT_ASKED'
                    const skipped = q.capturedAnswer === 'SKIP'
                    const completed = q.capturedAnswer === 'COMPLETED'
                    const isMathType = q.questionType === 'MATH'
                    const hasTextAnswer = q.capturedAnswer && !notAsked && !skipped && !completed && !isMathType
                    const misspokes = q.misspokeCount ?? 0
                    return (
                      <div key={i} className="flex items-start gap-3 text-sm print-question mb-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5" style={{ color, border: `1.5px solid ${color}` }}>
                          {q.questionType}
                        </span>
                        <div className="flex-1">
                          <p className={`font-medium ${notAsked ? 'opacity-40 italic' : ''}`} style={{ color: notAsked ? '#9ca3af' : color }}>{q.questionText}</p>
                          {notAsked && <p className="text-xs text-gray-400 mt-0.5 italic">Not asked this session</p>}
                          {skipped && <p className="text-xs text-gray-400 mt-0.5">Skipped</p>}
                          {completed && <p className="text-xs text-green-600 mt-0.5">✓ Activity completed</p>}
                          {isMathType && !notAsked && !skipped && q.capturedAnswer && (
                            <p className={`text-xs mt-0.5 font-semibold ${q.capturedAnswer === 'correct' ? 'text-green-600' : 'text-red-600'}`}>
                              {q.capturedAnswer === 'correct' ? '✓ Correct' : '✗ Incorrect'}
                            </p>
                          )}
                          {isMathType && !notAsked && !skipped && !q.capturedAnswer && q.expectedAnswer && (
                            <p className="text-xs mt-0.5 text-gray-400"><span className="font-semibold text-gray-600">{q.expectedAnswer}</span></p>
                          )}
                          {hasTextAnswer && (
                            <p className="text-xs mt-0.5">
                              <span className="text-gray-400">Response: </span>
                              <span className="font-semibold text-gray-800">{q.capturedAnswer}</span>
                            </p>
                          )}
                          {!hasTextAnswer && !isMathType && !notAsked && !skipped && !completed && q.expectedAnswer && (
                            <p style={{ fontSize: 12, fontWeight: 600, color: '#1f2937', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 4, display: 'inline-block', padding: '1px 8px', marginTop: 4 }}>{q.expectedAnswer}</p>
                          )}
                          {misspokes > 0 && !notAsked && (
                            <p className="text-xs text-red-600 font-semibold mt-0.5">{'✗'.repeat(misspokes)}</p>
                          )}
                          {!notAsked && !skipped && (
                            <>
                              <SpellerSentenceInput
                                sessionId={sessionId}
                                responseId={q.id}
                                initialValue={q.spellerSentence ?? ''}
                              />
                              <div className="space-y-1 print:mt-1 print:block hidden">
                                <div className="border-b border-gray-300 w-full h-5" />
                                <div className="border-b border-gray-300 w-full h-5" />
                                <div className="border-b border-gray-300 w-full h-5" />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

            </div>
          )
        })}

        {/* Writing Responses — only show hunks with an actual response */}
        {writingHunkNumbers.some(n => {
          const wr = responses.find(r => r.questionType === 'WRITING_PROMPT' && r.hunkNumber === n)
          return wr && wr.capturedAnswer !== 'SKIPPED'
        }) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4 print:shadow-none print:border print:border-gray-200 print:rounded-lg print-card">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">Writing Responses</h2>
            {writingHunkNumbers.map(n => {
              const lessonHunk = lessonHunks.find(h => h.number === n)
              const writingRecord = responses.find(r => r.questionType === 'WRITING_PROMPT' && r.hunkNumber === n)
              if (!writingRecord || writingRecord.capturedAnswer === 'SKIPPED') return null
              const response = writingRecord.capturedAnswer ?? null
              const misspokes = writingRecord.misspokeCount ?? 0
              const letters = response ? response.replace(/\s/g, '').length : 0
              const promptText = lessonHunk?.writingPrompt ?? (writingRecord.questionText !== 'Writing Prompt' ? writingRecord.questionText : undefined)
              return (
                <div key={n} className="mb-5 pb-5 border-b border-gray-50 last:border-0 last:mb-0 last:pb-0">
                  <p className="text-xs font-semibold text-gray-400 mb-1">Hunk {n}</p>
                  {promptText && (
                    <p className="text-xs text-pink-600 italic mb-2">{promptText}</p>
                  )}
                  {response
                    ? <p className="text-sm text-gray-800 whitespace-pre-wrap">{response}</p>
                    : <div className="space-y-1"><div className="border-b border-gray-200 h-5 w-full" /><div className="border-b border-gray-200 h-5 w-full" /><div className="border-b border-gray-200 h-5 w-full" /></div>
                  }
                  {(letters > 0 || misspokes > 0) && (
                    <div className="flex gap-3 mt-1.5">
                      {letters > 0 && <span className="text-xs font-semibold text-blue-500">{letters} letters</span>}
                      {misspokes > 0 && <span className="text-xs font-semibold text-red-500">{'✗'.repeat(misspokes)} ({misspokes} misspokes)</span>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-6 print:mt-4">
          Generated by Word Up S2C Lesson Generator — worduplessongenerator.com
        </p>
      </div>
    </div>
  )
}
