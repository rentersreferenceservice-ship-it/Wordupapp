import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getPractitionerSubscription, getStudents, createStudent } from '@/lib/practitionerStore'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const sub = await getPractitionerSubscription(userId)
  if (!sub) return Response.json({ error: 'No practitioner subscription' }, { status: 403 })

  const students = await getStudents(userId)
  if (students.length >= sub.studentLimit) {
    return Response.json({ error: 'Student limit reached. Upgrade your plan.' }, { status: 403 })
  }

  const { name, ageGroup, notes } = await req.json()
  if (!name?.trim()) return Response.json({ error: 'Name required' }, { status: 400 })

  const student = await createStudent(userId, name.trim(), ageGroup, notes ?? '')
  return Response.json(student)
}
