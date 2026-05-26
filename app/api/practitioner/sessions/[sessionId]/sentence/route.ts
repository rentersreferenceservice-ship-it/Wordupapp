import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { updateSpellerSentence } from '@/lib/practitionerStore'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const { data: session } = await getSupabase()
    .from('sessions').select('practitioner_id').eq('id', sessionId).single()
  if (!session || session.practitioner_id !== userId)
    return Response.json({ error: 'Not found' }, { status: 404 })

  const { responseId, sentence } = await req.json()
  if (!responseId) return Response.json({ error: 'responseId required' }, { status: 400 })

  try {
    await updateSpellerSentence(sessionId, responseId, sentence ?? '')
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
