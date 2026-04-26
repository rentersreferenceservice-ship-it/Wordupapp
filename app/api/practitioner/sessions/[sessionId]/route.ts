import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { saveSessionResponses } from '@/lib/practitionerStore'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const { responses } = await req.json()
  await saveSessionResponses(sessionId, responses)
  return Response.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const { data: session } = await getSupabase()
    .from('sessions').select('practitioner_id').eq('id', sessionId).single()

  if (!session || session.practitioner_id !== userId)
    return Response.json({ error: 'Not found' }, { status: 404 })

  await getSupabase().from('session_responses').delete().eq('session_id', sessionId)
  await getSupabase().from('sessions').delete().eq('id', sessionId)

  return Response.json({ ok: true })
}
