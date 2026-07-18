import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// POST — bulk-mark all sessions for a student as ACCURACY_EXCLUDED
// Body: { from?: 'YYYY-MM-DD' }  (if omitted, affects all sessions)
// POST again with { undo: true } to remove all ACCURACY_EXCLUDED records for the student
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: studentId } = await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const fromDate: string | undefined = body.from   // e.g. "2025-05-28"
  const undo: boolean = body.undo === true

  const supabase = getSupabase()

  // Fetch all session IDs for this student owned by this practitioner
  let sessionQuery = supabase
    .from('sessions')
    .select('id')
    .eq('student_id', studentId)
    .eq('practitioner_id', userId)

  if (fromDate) {
    sessionQuery = sessionQuery.gte('session_date', fromDate)
  }

  const { data: sessionRows, error: sessErr } = await sessionQuery
  if (sessErr) return Response.json({ error: sessErr.message }, { status: 500 })
  if (!sessionRows?.length) return Response.json({ updated: 0 })

  const sessionIds = sessionRows.map(s => s.id as string)

  if (undo) {
    // Remove all ACCURACY_EXCLUDED records for these sessions
    const { error } = await supabase
      .from('session_responses')
      .delete()
      .in('session_id', sessionIds)
      .eq('question_type', 'ACCURACY_EXCLUDED')
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ updated: sessionIds.length, undo: true })
  }

  // For each session, upsert an ACCURACY_EXCLUDED record (delete old + insert new to avoid duplicates)
  await supabase
    .from('session_responses')
    .delete()
    .in('session_id', sessionIds)
    .eq('question_type', 'ACCURACY_EXCLUDED')

  const rows = sessionIds.map(sid => ({
    session_id: sid,
    hunk_number: -1,
    question_type: 'ACCURACY_EXCLUDED',
    question_text: 'Accuracy Excluded',
    captured_answer: 'true',
    expected_answer: null,
    misspoke_count: 0,
    keyword: null,
    speller_sentence: null,
  }))

  const { error: insErr } = await supabase.from('session_responses').insert(rows)
  if (insErr) return Response.json({ error: insErr.message }, { status: 500 })

  return Response.json({ updated: sessionIds.length })
}
