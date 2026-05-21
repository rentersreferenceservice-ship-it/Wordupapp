import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getPractitionerCode, createAccessCode, toggleAccessCode } from '@/lib/accessCodeStore'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })
  const code = await getPractitionerCode(userId)
  return Response.json({ code })
}

export async function POST() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })
  const code = await createAccessCode(userId)
  return Response.json({ code })
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })
  const { codeId, isActive } = await req.json()
  await toggleAccessCode(codeId, isActive)
  return Response.json({ ok: true })
}
