import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ crpId: string }> }) {
  const { crpId } = await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })
  const { data } = await getSupabase().from('crps').select('practitioner_id').eq('id', crpId).single()
  if (!data || data.practitioner_id !== userId) return Response.json({ error: 'Not found' }, { status: 404 })
  await getSupabase().from('crps').delete().eq('id', crpId)
  return Response.json({ ok: true })
}
