import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { createSession, getUnfinishedLessonStartHunks, saveSessionResponses } from '@/lib/practitionerStore'

export const dynamic = 'force-dynamic'

// "Finish lesson": start a new session of the same lesson, picking up at the
// first page the earlier session didn't get to. Pages before that are marked
// skipped, so this session's accuracy counts only the pages done today.
export async function POST(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const { sessionDate } = await req.json().catch(() => ({}))
  const supabase = getSupabase()
  const { data: old } = await supabase
    .from('sessions')
    .select('practitioner_id, student_id, lesson_id, lesson_title, board_level, custom_hunks')
    .eq('id', sessionId)
    .single()
  if (!old || old.practitioner_id !== userId || !old.lesson_id) return Response.json({ error: 'Not found' }, { status: 404 })

  const startHunk = (await getUnfinishedLessonStartHunks([sessionId]))[sessionId]
  if (!startHunk) return Response.json({ error: 'This lesson was already finished.' }, { status: 400 })

  const date = typeof sessionDate === 'string' && sessionDate ? sessionDate : new Date().toISOString().split('T')[0]
  const newId = await createSession(userId, old.student_id, old.lesson_id, old.lesson_title, date, old.board_level ?? null, old.custom_hunks ?? null)

  await saveSessionResponses(newId, Array.from({ length: startHunk - 1 }, (_, i) => ({
    hunkNumber: i + 1,
    questionType: 'HUNK_SKIPPED',
    questionText: 'Hunk Skipped',
    capturedAnswer: 'true',
    expectedAnswer: '',
    misspokeCount: 0,
  })))

  return Response.json({ sessionId: newId, startHunk })
}
