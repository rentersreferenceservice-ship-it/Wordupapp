import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getStudent } from '@/lib/practitionerStore'
import { getOrCreatePairingForStudent } from '@/lib/ttPairingStore'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const student = await getStudent(id)
  if (!student || student.practitionerId !== userId) return Response.json({ error: 'Not found' }, { status: 404 })

  const result = await getOrCreatePairingForStudent(userId, id)
  if ('error' in result) return Response.json({ error: result.error }, { status: 500 })
  return Response.json(result)
}
