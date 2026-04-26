import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { saveSessionResponses } from '@/lib/practitionerStore'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const { responses } = await req.json()
  await saveSessionResponses(sessionId, responses)
  return Response.json({ ok: true })
}
