import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getIntakeRequest, approveExistingClientIntake, approveNewInquiryIntake } from '@/lib/intakeStore'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const request = await getIntakeRequest(id, userId)
  if (!request) return Response.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()

  if (request.studentId) {
    const result = await approveExistingClientIntake(id, userId, body.resolvedFields ?? {})
    if ('error' in result) return Response.json({ error: result.error }, { status: 500 })
    return Response.json(result)
  }

  if (!body.name?.trim()) return Response.json({ error: 'A student name is required' }, { status: 400 })
  const result = await approveNewInquiryIntake(
    id,
    userId,
    { name: body.name, ageGroup: body.ageGroup, sessionRate: body.sessionRate ?? null },
    body.profileFields ?? {},
    body.fieldsNeedingReview ?? []
  )
  if ('error' in result) return Response.json({ error: result.error }, { status: 500 })
  return Response.json(result)
}
