import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getPractitionerSubscription, getSessionResponses } from '@/lib/practitionerStore'
import { getSupabase } from '@/lib/supabase'
import Link from 'next/link'
import type { QuestionType } from '@/lib/types'
import PrintTranscriptButton from './PrintTranscriptButton'

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
  if (!userId) redirect('/practitioner/pricing')

  const sub = await getPractitionerSubscription(userId)
  if (!sub) redirect('/practitioner/pricing')

  const { data: session } = await getSupabase()
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('practitioner_id', userId)
    .single()

  if (!session) redirect('/practitioner/dashboard')

  const { data: studentData } = await getSupabase()
    .from('students')
    .select('name, age_group')
    .eq('id', session.student_id)
    .single()

  const responses = await getSessionResponses(sessionId)

  // Extract session-level records
  const sessionStateRecord = responses.find(r => r.questionType === 'SESSION_STATE')
  const sessionNotesRecord = responses.find(r => r.questionType === 'SESSION_NOTES')

  // Group by hunk — skip hunk 0 special records
  const byHunk: Record<number, typeof responses> = {}
  for (const r of responses) {
    if (r.hunkNumber == null) continue
    if (!byHunk[r.hunkNumber]) byHunk[r.hunkNumber] = []
    byHunk[r.hunkNumber].push(r)
  }

  const keywords = responses.filter(r => r.questionType === 'KEYWORD' && r.capturedAnswer !== 'SKIPPED')
  const totalLetters = keywords.reduce((sum, k) => sum + (k.keyword ?? '').replace(/\s/g, '').length, 0)
  const totalMisspokes = keywords.reduce((sum, k) => sum + (k.misspokeCount ?? 0), 0)
  const totalPokes = totalLetters + totalMisspokes
  const correctPct = totalPokes > 0 ? Math.round((totalLetters / totalPokes) * 100) : 0
  const misspokePct = totalPokes > 0 ? 100 - correctPct : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @media print {
          @page { margin: 0.5in; size: letter; }
          body { font-size: 9pt !important; line-height: 1.2 !important; }
          * { line-height: 1.2 !important; }
          h1 { font-size: 13pt !important; }
          h2 { font-size: 9pt !important; margin-bottom: 4px !important; }
          p { margin: 1px 0 !important; font-size: 8pt !important; }
          .print-card { padding: 6px 8px !important; margin-bottom: 4px !important; border-radius: 4px !important; border: 1px solid #e5e7eb !important; }
          .print-stat { padding: 4px !important; }
          .print-keyword { padding: 2px 6px !important; font-size: 7.5pt !important; }
          .print-question { padding: 3px 6px !important; gap: 4px !important; }
        }
      `}</style>
      <div className="max-w-3xl mx-auto px-6 py-8 print:px-0 print:py-0">
        {/* Nav - hidden on print */}
        <div className="flex gap-3 mb-6 print:hidden">
          <Link href="/practitioner/dashboard" className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
            ← Dashboard
          </Link>
          <PrintTranscriptButton />
        </div>

        {/* Debug panel — screen only */}
        <div className="print:hidden mb-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-xs text-gray-600 space-y-1">
          <p className="font-bold text-yellow-800">Debug (temporary)</p>
          <p>Total responses saved: {responses.length}</p>
          <p>KEYWORD responses: {responses.filter(r => r.questionType === 'KEYWORD').length}</p>
          <p>KEYWORD not skipped: {keywords.length}</p>
          <p>Types found: {[...new Set(responses.map(r => r.questionType))].join(', ') || 'none'}</p>
          <p>Keywords: {responses.filter(r => r.questionType === 'KEYWORD').map(k => `${k.keyword ?? 'NULL'}(ans:${JSON.stringify(k.capturedAnswer)},miss:${k.misspokeCount})`).join(' | ') || 'none'}</p>
        </div>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 print:shadow-none print:border-0 print:rounded-none print-card">
          <div className="flex items-start justify-between">
            <div>
              <img src="/word_up_clean.jpeg" alt="Word Up" style={{ width: 100, marginBottom: 8 }} />
              <h1 className="text-2xl font-bold text-gray-900">Session Transcript</h1>
              <p className="text-gray-600 mt-1">{session.lesson_title}</p>
            </div>
            <div className="text-right text-sm text-gray-500">
              <p><strong>Student:</strong> {studentData?.name}</p>
              <p><strong>Age Group:</strong> {studentData?.age_group}</p>
              <p><strong>Date:</strong> {new Date(session.session_date + 'T00:00:00').toLocaleDateString()}</p>
            </div>
          </div>

          {/* Student state & notes — always shown at top */}
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Student State</p>
              {sessionStateRecord?.capturedAnswer
                ? (
                  <div className="flex flex-wrap gap-1.5">
                    {sessionStateRecord.capturedAnswer.split(', ').filter(Boolean).map((s, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs text-indigo-700 font-medium">{s}</span>
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
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{totalLetters}</p>
              <p className="text-xs text-gray-500">Letters to Poke</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">{totalMisspokes}</p>
              <p className="text-xs text-gray-500">Misspokes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{correctPct}%</p>
              <p className="text-xs text-gray-500">Accuracy</p>
              <p className="text-xs text-gray-400 mt-0.5">{totalPokes} total pokes</p>
            </div>
          </div>
        </div>

        {/* Per-hunk detail */}
        {Object.entries(byHunk).sort(([a], [b]) => Number(a) - Number(b)).map(([hunkNum, items]) => {
          const hunkKeywords = items.filter(r => r.questionType === 'KEYWORD')
          const hunkQuestions = items.filter(r => r.questionType !== 'KEYWORD')
          return (
            <div key={hunkNum} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4 print:shadow-none print:border print:border-gray-200 print:rounded-lg print-card">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">Hunk {hunkNum}</h2>

              {hunkKeywords.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 mb-2">Spelling Words</p>
                  <div className="flex flex-wrap gap-2">
                    {hunkKeywords.map((k, i) => (
                      <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm print-keyword ${k.capturedAnswer === 'SKIPPED' ? 'bg-gray-50 border border-gray-200 opacity-50' : (k.misspokeCount ?? 0) > 0 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                        <span className={`font-bold ${k.capturedAnswer === 'SKIPPED' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{k.keyword}</span>
                        <span className="text-xs text-gray-400">{(k.keyword ?? '').replace(/\s/g, '').length} letters</span>
                        {k.capturedAnswer === 'SKIPPED' && <span className="text-xs text-gray-400">not asked</span>}
                        {k.capturedAnswer !== 'SKIPPED' && (k.misspokeCount ?? 0) > 0 && (
                          <span className="text-xs text-red-600 font-semibold">{k.misspokeCount}✗</span>
                        )}
                        {k.capturedAnswer !== 'SKIPPED' && (k.misspokeCount ?? 0) === 0 && (
                          <span className="text-xs text-green-600">✓</span>
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
                    return (
                      <div key={i} className="flex items-start gap-3 text-sm print-question mb-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white shrink-0 mt-0.5" style={{ backgroundColor: color }}>
                          {q.questionType}
                        </span>
                        <div className="flex-1">
                          <p className="text-gray-700">{q.questionText}</p>
                          {q.capturedAnswer && q.capturedAnswer !== 'SKIP' && q.capturedAnswer !== 'COMPLETED' && (
                            <p className="text-xs mt-0.5">
                              <span className="text-gray-400">Response: </span>
                              <span className="font-semibold text-gray-800">{q.capturedAnswer}</span>
                              {q.questionType !== 'OPEN' && q.questionType !== 'PRIOR KNOWLEDGE' && (
                                <span className={`ml-2 font-semibold ${q.capturedAnswer === 'correct' || q.capturedAnswer === q.expectedAnswer ? 'text-green-600' : 'text-orange-500'}`}>
                                  {q.capturedAnswer === 'correct' || q.capturedAnswer === q.expectedAnswer ? '✓' : '✗'}
                                </span>
                              )}
                            </p>
                          )}
                          {q.capturedAnswer === 'SKIP' && <p className="text-xs text-gray-400 mt-0.5">Skipped</p>}
                          {q.capturedAnswer === 'NOT_ASKED' && <p className="text-xs text-gray-400 mt-0.5 italic">Not asked this session</p>}
                          {q.capturedAnswer === 'COMPLETED' && <p className="text-xs text-green-600 mt-0.5">✓ Activity completed</p>}
                          {(q.questionType === 'OPEN' || q.questionType === 'PRIOR KNOWLEDGE') && (
                            <div className="mt-1.5 space-y-1 print:mt-2">
                              <div className="border-b border-gray-300 w-full h-5" />
                              <div className="border-b border-gray-300 w-full h-5" />
                            </div>
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

        <p className="text-center text-xs text-gray-400 mt-6 print:mt-4">
          Generated by Word Up S2C Lesson Generator — worduplessongenerator.com
        </p>
      </div>
    </div>
  )
}
