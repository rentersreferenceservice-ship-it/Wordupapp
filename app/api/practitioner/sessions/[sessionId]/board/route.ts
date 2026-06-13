import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { BOARD_LEVELS } from '@/lib/practitionerStore'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const { boardLevel } = await req.json()
  if (boardLevel !== null && !(BOARD_LEVELS as readonly string[]).includes(boardLevel)) {
    return Response.json({ error: 'Invalid board level' }, { status: 400 })
  }

  const { data: session } = await getSupabase()
    .from('sessions')
    .select('practitioner_id')
    .eq('id', sessionId)
    .single()
  if (!session || session.practitioner_id !== userId) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  await getSupabase().from('sessions').update({ board_level: boardLevel }).eq('id', sessionId)
  return Response.json({ ok: true })
}
