import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const { studentId, sessionDate } = await req.json()
  if (!studentId) return Response.json({ error: 'Student required' }, { status: 400 })

  const supabase = getSupabase()
  const { data: session, error } = await supabase
    .from('sessions')
    .insert({
      practitioner_id: userId,
      student_id: studentId,
      lesson_id: null,
      lesson_title: 'Type to Talk Session',
      session_date: sessionDate,
    })
    .select()
    .single()

  if (error || !session) return Response.json({ error: error?.message ?? 'Failed to start session' }, { status: 500 })

  return Response.json({ sessionId: session.id })
}
