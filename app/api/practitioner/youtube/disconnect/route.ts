import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'

export async function POST() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  await getSupabase()
    .from('practitioner_youtube_tokens')
    .delete()
    .eq('practitioner_id', userId)

  return Response.json({ ok: true })
}
