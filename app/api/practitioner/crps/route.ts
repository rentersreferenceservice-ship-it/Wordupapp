import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getCrps, createCrp, CRP_COLORS } from '@/lib/practitionerStore'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })
  const studentId = req.nextUrl.searchParams.get('studentId')
  if (!studentId) return Response.json({ error: 'studentId required' }, { status: 400 })
  const crps = await getCrps(studentId, userId)
  return Response.json({ crps })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })
  const { studentId, name } = await req.json()
  if (!studentId || !name?.trim()) return Response.json({ error: 'studentId and name required' }, { status: 400 })
  const existing = await getCrps(studentId, userId)
  const color = CRP_COLORS[existing.length % CRP_COLORS.length]
  const crp = await createCrp(studentId, userId, name.trim(), color)
  return Response.json({ crp })
}
