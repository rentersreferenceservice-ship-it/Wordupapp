import { NextRequest } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params

  const { data } = await getSupabase()
    .from('tt_session_pairings')
    .select('session_id')
    .eq('code', code.toUpperCase())
    .single()

  if (!data) return Response.json({ error: 'Code not found' }, { status: 404 })

  return Response.json({ sessionId: data.session_id })
}
