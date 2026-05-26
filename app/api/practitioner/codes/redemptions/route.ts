import { NextRequest } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { toggleFamilyAccess } from '@/lib/accessCodeStore'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const { data: allCodes, error: codesError } = await getSupabase()
    .from('access_codes')
    .select('code, is_active')
    .eq('created_by', userId)

  if (codesError) return Response.json({ redemptions: [], debug: `codes_err: ${codesError.message}` })
  if (!allCodes || allCodes.length === 0) return Response.json({ redemptions: [], debug: 'no_codes' })

  const codeStrings = allCodes.map((c: { code: string }) => c.code)

  const { data: rows, error: rowsError } = await getSupabase()
    .from('code_redemptions')
    .select('*')
    .in('code', codeStrings)

  if (rowsError) return Response.json({ redemptions: [], debug: `rows_err: ${rowsError.message}` })
  if (!rows || rows.length === 0) return Response.json({ redemptions: [], debug: `no_rows_codes: ${codeStrings.join(',')}` })

  try {
    const client = await clerkClient()
    const userIds = rows.map((r: Record<string, unknown>) => r.user_id as string)
    const { data: users } = await client.users.getUserList({ userId: userIds, limit: 100 })

    const redemptions = rows.map((row: Record<string, unknown>) => {
      const user = users.find(u => u.id === row.user_id)
      const email = user?.emailAddresses?.[0]?.emailAddress ?? String(row.user_id)
      const active = row.is_active !== false
      return { userId: String(row.user_id), email, joinedAt: row.created_at ?? null, active }
    })

    return Response.json({ redemptions })
  } catch (e) {
    const redemptions = rows.map((row: Record<string, unknown>) => ({
      userId: String(row.user_id),
      email: String(row.user_id),
      joinedAt: row.created_at ?? null,
      active: row.is_active !== false,
    }))
    return Response.json({ redemptions, debug: `clerk_err: ${e}` })
  }
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })
  const { familyUserId, isActive } = await req.json()
  await toggleFamilyAccess(familyUserId, isActive)
  return Response.json({ ok: true })
}
