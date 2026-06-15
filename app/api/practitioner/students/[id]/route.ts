import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getStudent, updateStudent, deleteStudent } from '@/lib/practitionerStore'
import { getSupabase } from '@/lib/supabase'

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

  const { name, ageGroup, notes, guardianEmail, funderName, funderEmail, sessionRate, defaultMileage } = await req.json()
  await updateStudent(id, name, ageGroup, notes ?? '', guardianEmail ?? '', funderName ?? '', funderEmail ?? '', sessionRate != null ? parseFloat(sessionRate) : null, defaultMileage != null ? parseFloat(defaultMileage) : null)
  return Response.json({ ok: true })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const student = await getStudent(id)
  if (!student || student.practitionerId !== userId) return Response.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const updates: Record<string, unknown> = {}
  if (body.sessionRate != null) {
    const rate = parseFloat(String(body.sessionRate))
    updates.session_rate = isNaN(rate) ? null : rate
  }
  if (body.funderName != null) updates.funder_name = body.funderName || null
  if (body.funderEmail != null) updates.funder_email = body.funderEmail || null
  if (body.guardianEmail != null) updates.guardian_email = body.guardianEmail || null

  await getSupabase().from('students').update(updates).eq('id', id)
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
