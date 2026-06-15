import { auth } from '@clerk/nextjs/server'
import { getPractitionerSubscription } from '@/lib/practitionerStore'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ active: false })
  const sub = await getPractitionerSubscription(userId)
  return Response.json({ active: sub?.isActive ?? false })
}
