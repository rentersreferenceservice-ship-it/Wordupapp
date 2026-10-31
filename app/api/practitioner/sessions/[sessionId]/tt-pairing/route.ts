import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { getOrCreatePairingForStudent } from '@/lib/ttPairingStore'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const supabase = getSupabase()

  const { data: session } = await supabase.from('sessions').select('practitioner_id, student_id').eq('id', sessionId).single()
  if (!session || session.practitioner_id !== userId) return Response.json({ error: 'Not found' }, { status: 404 })

  const result = await getOrCreatePairingForStudent(userId, session.student_id, sessionId)
  if ('error' in result) return Response.json({ error: result.error }, { status: 500 })
  return Response.json(result)
}
