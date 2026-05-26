import { auth, clerkClient } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  // Get all codes created by this practitioner
  const { data: codes } = await getSupabase()
    .from('access_codes')
    .select('code, is_active')
    .eq('created_by', userId)

  if (!codes || codes.length === 0) return Response.json({ redemptions: [] })

  const codeMap = new Map<string, boolean>(codes.map(c => [c.code, c.is_active]))
  const codeStrings = codes.map(c => c.code)

  // Get all redemptions for those codes
  const { data: rows } = await getSupabase()
    .from('code_redemptions')
    .select('user_id, code, created_at')
    .in('code', codeStrings)

  if (!rows || rows.length === 0) return Response.json({ redemptions: [] })

  // Look up Clerk user emails
  const client = await clerkClient()
  const userIds = rows.map(r => r.user_id)
  const { data: users } = await client.users.getUserList({ userId: userIds, limit: 100 })

  const redemptions = rows.map(row => {
    const user = users.find(u => u.id === row.user_id)
    const email = user?.emailAddresses?.[0]?.emailAddress ?? 'Unknown'
    const codeActive = codeMap.get(row.code) ?? false
    return {
      email,
      joinedAt: row.created_at ?? null,
      active: codeActive,
    }
  })

  return Response.json({ redemptions })
}
