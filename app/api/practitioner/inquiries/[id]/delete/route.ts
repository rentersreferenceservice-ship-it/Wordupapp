import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { deleteIntakeRequest } from '@/lib/intakeStore'

export const dynamic = 'force-dynamic'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const result = await deleteIntakeRequest(id, userId)
  if ('error' in result) return Response.json({ error: result.error }, { status: 500 })
  return Response.json(result)
}
