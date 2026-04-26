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

  // Group by hunk
  const byHunk: Record<number, typeof responses> = {}
  for (const r of responses) {
    if (!byHunk[r.hunkNumber]) byHunk[r.hunkNumber] = []
    byHunk[r.hunkNumber].push(r)
  }

  const keywords = responses.filter(r => r.questionType === 'KEYWORD')
  const totalLetters = keywords.reduce((sum, k) => sum + (k.keyword ?? '').replace(/\s/g, '').length, 0)
  const totalMisspokes = keywords.reduce((sum, k) => sum + (k.misspokeCount ?? 0), 0)
  const misspokePct = totalLetters > 0 ? Math.round((totalMisspokes / totalLetters) * 100) : 0
  const correctPct = 100 - misspokePct

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-8 print:px-0 print:py-0">
        {/* Nav - hidden on print */}
        <div className="flex gap-3 mb-6 print:hidden">
          <Link href="/practitioner/dashboard" className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
            ← Dashboard
          </Link>
          <PrintTranscriptButton />
        </div>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 print:shadow-none print:border-0 print:rounded-none">
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

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{totalLetters}</p>
              <p className="text-xs text-gray-500">Total Letters Poked</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">{totalMisspokes}</p>
              <p className="text-xs text-gray-500">Total Misspokes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{correctPct}%</p>
              <p className="text-xs text-gray-500">Correct</p>
              <p className="text-xs text-red-400 mt-0.5">{misspokePct}% misspoke</p>
            </div>
          </div>
        </div>

        {/* Per-hunk detail */}
        {Object.entries(byHunk).sort(([a], [b]) => Number(a) - Number(b)).map(([hunkNum, items]) => {
          const hunkKeywords = items.filter(r => r.questionType === 'KEYWORD')
          const hunkQuestions = items.filter(r => r.questionType !== 'KEYWORD')
          return (
            <div key={hunkNum} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4 print:shadow-none print:border print:border-gray-200 print:rounded-lg">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">Hunk {hunkNum}</h2>

              {hunkKeywords.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 mb-2">Spelling Words</p>
                  <div className="flex flex-wrap gap-2">
                    {hunkKeywords.map((k, i) => (
                      <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${(k.misspokeCount ?? 0) > 0 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                        <span className="font-bold text-gray-800">{k.keyword}</span>
                        <span className="text-xs text-gray-400">{(k.keyword ?? '').replace(/\s/g, '').length} letters</span>
                        {(k.misspokeCount ?? 0) > 0 && (
                          <span className="text-xs text-red-600 font-semibold">{k.misspokeCount}✗</span>
                        )}
                        {(k.misspokeCount ?? 0) === 0 && (
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
                      <div key={i} className="flex items-start gap-3 text-sm">
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
                          {q.capturedAnswer === 'COMPLETED' && <p className="text-xs text-green-600 mt-0.5">✓ Activity completed</p>}
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
