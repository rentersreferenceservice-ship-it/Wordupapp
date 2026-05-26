import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createStudent } from '@/lib/practitionerStore'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })


  const { name, ageGroup, notes, guardianEmail } = await req.json()
  if (!name?.trim()) return Response.json({ error: 'Name required' }, { status: 400 })

  const student = await createStudent(userId, name.trim(), ageGroup, notes ?? '', guardianEmail ?? '')
  return Response.json(student)
}
