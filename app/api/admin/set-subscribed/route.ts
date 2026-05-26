import { auth } from '@clerk/nextjs/server'
import { setSubscribed } from '@/lib/usageStore'

const ADMIN_USER_ID = 'user_3CDvdqpvQ2gtVYzPEzJZuleRX9p'

export async function POST() {
  const { userId } = await auth()
  if (!userId || userId !== ADMIN_USER_ID) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }
  await setSubscribed(userId, true)
  return Response.json({ ok: true })
}
