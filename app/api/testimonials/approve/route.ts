import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'

const ADMIN_USER_ID = 'user_3CDvdqpvQ2gtVYzPEzJZuleRX9p'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (userId !== ADMIN_USER_ID) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const { id, approved } = await req.json()
  await getSupabase().from('testimonials').update({ approved }).eq('id', id)
  return Response.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth()
  if (userId !== ADMIN_USER_ID) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const { id } = await req.json()
  await getSupabase().from('testimonials').delete().eq('id', id)
  return Response.json({ ok: true })
}
