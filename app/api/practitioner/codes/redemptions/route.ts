import { auth, clerkClient } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { getPractitionerCode } from '@/lib/accessCodeStore'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  // Get this practitioner's current code using the proven function
  const code = await getPractitionerCode(userId)
  if (!code) return Response.json({ redemptions: [] })

  // Get all redemptions for this code directly
  const { data: rows, error } = await getSupabase()
    .from('code_redemptions')
    .select('user_id, created_at')
    .eq('code', code.code)

  if (error || !rows || rows.length === 0) {
    return Response.json({ redemptions: [] })
  }

  // Try to look up emails from Clerk — fall back to showing user IDs if it fails
  try {
    const client = await clerkClient()
    const userIds = rows.map((r: { user_id: string }) => r.user_id)
    const { data: users } = await client.users.getUserList({ userId: userIds, limit: 100 })

    const redemptions = rows.map((row: { user_id: string; created_at: string | null }) => {
      const user = users.find(u => u.id === row.user_id)
      const email = user?.emailAddresses?.[0]?.emailAddress ?? row.user_id
      return { email, joinedAt: row.created_at ?? null, active: code.is_active }
    })

    return Response.json({ redemptions })
  } catch {
    // Clerk lookup failed — still show families using their user IDs
    const redemptions = rows.map((row: { user_id: string; created_at: string | null }) => ({
      email: row.user_id,
      joinedAt: row.created_at ?? null,
      active: code.is_active,
    }))
    return Response.json({ redemptions })
  }
}
