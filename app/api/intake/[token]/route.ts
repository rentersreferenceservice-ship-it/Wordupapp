import { NextRequest } from 'next/server'
import { getIntakeRequestByToken, submitIntakeResponse } from '@/lib/intakeStore'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const info = await getIntakeRequestByToken(token)
  if (!info) return Response.json({ error: 'Invalid link' }, { status: 404 })
  return Response.json(info)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const body = await req.json()
  const answers = body.answers ?? {}
  const fieldsNeedingReview = Array.isArray(body.fieldsNeedingReview) ? body.fieldsNeedingReview : []

  const result = await submitIntakeResponse(token, answers, fieldsNeedingReview)
  if ('error' in result) return Response.json({ error: result.error }, { status: 400 })
  return Response.json(result)
}
