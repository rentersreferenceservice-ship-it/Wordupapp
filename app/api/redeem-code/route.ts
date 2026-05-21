import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { redeemCode } from '@/lib/accessCodeStore'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })
  const { code } = await req.json()
  if (!code?.trim()) return Response.json({ error: 'No code provided' }, { status: 400 })
  const result = await redeemCode(code, userId)
  if (!result.ok) return Response.json({ error: result.error }, { status: 400 })
  return Response.json({ ok: true })
}
