import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { setPractitionerSubscription } from '@/lib/practitionerStore'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const { code } = await req.json()
  const validCode = process.env.PRACTITIONER_PROMO_CODE
  if (!validCode || !code || code.trim().toUpperCase() !== validCode.toUpperCase()) {
    return Response.json({ error: 'Invalid access code' }, { status: 400 })
  }

  await setPractitionerSubscription(userId, 'monthly', true)
  return Response.json({ ok: true })
}
