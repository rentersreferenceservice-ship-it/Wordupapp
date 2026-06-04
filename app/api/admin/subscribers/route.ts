import { auth, clerkClient } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const ADMIN_USER_ID = 'user_3CDvdqpvQ2gtVYzPEzJZuleRX9p'

export async function GET() {
  const { userId } = await auth()
  if (!userId || userId !== ADMIN_USER_ID) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const supabase = getSupabase()

  const { data: rows } = await supabase
    .from('user_usage')
    .select('user_id, is_subscribed, stripe_customer_id, updated_at')
    .eq('is_subscribed', true)
    .order('updated_at', { ascending: false })

  if (!rows?.length) return Response.json({ subscribers: [] })

  const clerk = await clerkClient()
  const users = await Promise.all(
    rows.map(async row => {
      try {
        const u = await clerk.users.getUser(row.user_id)
        return {
          userId: row.user_id,
          name: [u.firstName, u.lastName].filter(Boolean).join(' ') || '—',
          email: u.emailAddresses[0]?.emailAddress ?? '—',
          stripeCustomerId: row.stripe_customer_id ?? null,
          updatedAt: row.updated_at,
        }
      } catch {
        return {
          userId: row.user_id,
          name: '(unknown)',
          email: '—',
          stripeCustomerId: row.stripe_customer_id ?? null,
          updatedAt: row.updated_at,
        }
      }
    })
  )

  return Response.json({ subscribers: users })
}

