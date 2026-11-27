import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Saves the parent's phone number on a form request, for text reminders.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })
  const { phone } = await req.json()
  const clean = typeof phone === 'string' ? phone.trim() : ''
  const { error } = await getSupabase()
    .from('intake_requests')
    .update({ recipient_phone: clean || null })
    .eq('id', id)
    .eq('practitioner_id', userId)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
