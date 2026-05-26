import { auth, clerkClient } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { getPractitionerCode } from '@/lib/accessCodeStore'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const code = await getPractitionerCode(userId)
  if (!code) return Response.json({ redemptions: [], debug: 'no_code' })

  const { data: rows, error } = await getSupabase()
    .from('code_redemptions')
    .select('*')
    .eq('code', code.code)

  if (error) return Response.json({ redemptions: [], debug: `db_error: ${error.message}` })
  if (!rows || rows.length === 0) return Response.json({ redemptions: [], debug: `empty_for_code_${code.code}` })

  try {
    const client = await clerkClient()
    const userIds = rows.map((r: Record<string, unknown>) => r.user_id as string)
    const { data: users } = await client.users.getUserList({ userId: userIds, limit: 100 })

    const redemptions = rows.map((row: Record<string, unknown>) => {
      const user = users.find(u => u.id === row.user_id)
      const email = user?.emailAddresses?.[0]?.emailAddress ?? String(row.user_id)
      return { email, joinedAt: row.created_at ?? null, active: code.is_active }
    })

    return Response.json({ redemptions })
  } catch (e) {
    const redemptions = rows.map((row: Record<string, unknown>) => ({
      email: String(row.user_id),
      joinedAt: row.created_at ?? null,
      active: code.is_active,
    }))
    return Response.json({ redemptions, debug: `clerk_error: ${e}` })
  }
}
