import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getStudent, updateStudent, deleteStudent } from '@/lib/practitionerStore'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const student = await getStudent(id)
  if (!student || student.practitionerId !== userId) return Response.json({ error: 'Not found' }, { status: 404 })

  return Response.json({ student })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const student = await getStudent(id)
  if (!student || student.practitionerId !== userId) return Response.json({ error: 'Not found' }, { status: 404 })

  const { name, ageGroup, notes } = await req.json()
  await updateStudent(id, name, ageGroup, notes ?? '')
  return Response.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const student = await getStudent(id)
  if (!student || student.practitionerId !== userId) return Response.json({ error: 'Not found' }, { status: 404 })

  await deleteStudent(id)
  return Response.json({ ok: true })
}
