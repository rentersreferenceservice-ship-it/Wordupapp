import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'

const ADMIN_USER_ID = 'user_3CDvdqpvQ2gtVYzPEzJZuleRX9p'

const TITLES = [
  'dhaka muslin',
  'photography capturing light and meaning',
  'math word problems',
  'the magic of pixar',
]

export async function POST() {
  const { userId } = await auth()
  if (!userId || userId !== ADMIN_USER_ID) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const supabase = getSupabase()
  const results: { title: string; updated: number }[] = []

  for (const title of TITLES) {
    const { data, error } = await supabase
      .from('lessons')
      .update({ practitioner_id: null })
      .ilike('title', `%${title}%`)
      .select('id, title')

    results.push({ title, updated: error ? 0 : (data?.length ?? 0) })
  }

  return Response.json({ results })
}
