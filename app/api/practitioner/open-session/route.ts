import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const {
    studentId, sessionDate, questions,
    sessionNotes, sessionVideo,
    regulationArrival, regulationDeparture, studentStates,
  } = await req.json()

  if (!studentId) return Response.json({ error: 'Student required' }, { status: 400 })
  if (!questions?.length) return Response.json({ error: 'At least one question required' }, { status: 400 })

  const supabase = getSupabase()

  const { data: session, error } = await supabase
    .from('sessions')
    .insert({
      practitioner_id: userId,
      student_id: studentId,
      lesson_id: null,
      lesson_title: 'Open Session',
      session_date: sessionDate,
      regulation_arrival: regulationArrival ?? null,
      regulation_departure: regulationDeparture ?? null,
    })
    .select()
    .single()

  if (error || !session) return Response.json({ error: error?.message ?? 'Failed to create session' }, { status: 500 })

  const responses = [
    { session_id: session.id, hunk_number: 0, question_type: 'SESSION_STATE', question_text: 'Student State', captured_answer: (studentStates ?? []).join(', '), expected_answer: '', misspoke_count: 0 },
    { session_id: session.id, hunk_number: 0, question_type: 'SESSION_NOTES', question_text: 'Session Notes', captured_answer: sessionNotes ?? '', expected_answer: '', misspoke_count: 0 },
    ...(sessionVideo?.trim() ? [{ session_id: session.id, hunk_number: 0, question_type: 'SESSION_VIDEO', question_text: 'Session Video', captured_answer: sessionVideo.trim(), expected_answer: '', misspoke_count: 0 }] : []),
    { session_id: session.id, hunk_number: 0, question_type: 'SESSION_COMPLETE', question_text: 'Session Complete', captured_answer: 'true', expected_answer: '', misspoke_count: 0 },
    ...questions.map((q: { question: string; response: string; misspokeCount: number }) => ({
      session_id: session.id,
      hunk_number: 1,
      question_type: 'OPEN',
      question_text: q.question,
      captured_answer: q.response,
      expected_answer: '',
      misspoke_count: q.misspokeCount,
    })),
  ]

  await supabase.from('session_responses').insert(responses)

  return Response.json({ sessionId: session.id })
}
