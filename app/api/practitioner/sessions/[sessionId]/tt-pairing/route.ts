import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I

function generateCode(): string {
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  }
  return code
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const supabase = getSupabase()

  const { data: session } = await supabase.from('sessions').select('practitioner_id, student_id').eq('id', sessionId).single()
  if (!session || session.practitioner_id !== userId) return Response.json({ error: 'Not found' }, { status: 404 })

  // One persistent code per student — reused across every session, so a family's
  // saved link keeps working instead of going dead when that day's session ends.
  const { data: existing } = await supabase.from('tt_session_pairings').select('code').eq('student_id', session.student_id).single()
  if (existing) {
    await supabase.from('tt_session_pairings').update({ session_id: sessionId }).eq('student_id', session.student_id)
    return Response.json({ code: existing.code })
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode()
    const { data: created, error } = await supabase
      .from('tt_session_pairings')
      .insert({ session_id: sessionId, code, practitioner_id: userId, student_id: session.student_id })
      .select('code')
      .single()
    if (created) return Response.json({ code: created.code })
    if (error?.code !== '23505') return Response.json({ error: error?.message ?? 'Failed to create pairing' }, { status: 500 })
    // 23505 = unique_violation (code collision) — retry with a new code
  }

  return Response.json({ error: 'Failed to generate a unique code' }, { status: 500 })
}
