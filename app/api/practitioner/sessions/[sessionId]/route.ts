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
  try {
    await saveSessionResponses(sessionId, responses)
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
  return Response.json({ ok: true })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const body = await req.json()
  const update: Record<string, string | null> = {}
  if ('regulation_arrival' in body) update.regulation_arrival = body.regulation_arrival
  if ('regulation_departure' in body) update.regulation_departure = body.regulation_departure
  if ('crp_id' in body) update.crp_id = body.crp_id
  if (!Object.keys(update).length) return Response.json({ error: 'Nothing to update' }, { status: 400 })

  const { data: session } = await getSupabase().from('sessions').select('practitioner_id').eq('id', sessionId).single()
  if (!session || session.practitioner_id !== userId) return Response.json({ error: 'Not found' }, { status: 404 })

  await getSupabase().from('sessions').update(update).eq('id', sessionId)
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
