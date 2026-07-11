import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: studentId } = await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const supabase = getSupabase()

  // Verify practitioner owns this student
  const { data: student } = await supabase
    .from('students')
    .select('id, name')
    .eq('id', studentId)
    .eq('practitioner_id', userId)
    .single()
  if (!student) return Response.json({ error: 'Student not found' }, { status: 404 })

  // Return existing token or create one
  const { data: existing } = await supabase
    .from('family_form_tokens')
    .select('token')
    .eq('student_id', studentId)
    .eq('practitioner_id', userId)
    .single()

  if (existing) return Response.json({ token: existing.token })

  const { data: created, error } = await supabase
    .from('family_form_tokens')
    .insert({ student_id: studentId, practitioner_id: userId })
    .select('token')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ token: (created as { token: string }).token })
}
