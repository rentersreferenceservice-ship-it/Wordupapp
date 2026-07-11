import { NextRequest } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = getSupabase()

  const { data: row } = await supabase
    .from('family_form_tokens')
    .select('student_id, practitioner_id')
    .eq('token', token)
    .single()

  if (!row) return Response.json({ error: 'Invalid link' }, { status: 404 })

  const { data: student } = await supabase
    .from('students')
    .select('name')
    .eq('id', (row as { student_id: string }).student_id)
    .single()

  return Response.json({ studentName: (student as { name: string } | null)?.name ?? 'Student' })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = getSupabase()

  const { data: row } = await supabase
    .from('family_form_tokens')
    .select('student_id, practitioner_id')
    .eq('token', token)
    .single()

  if (!row) return Response.json({ error: 'Invalid link' }, { status: 404 })

  const formData = await req.json()

  const { error } = await supabase.from('form_submissions').insert({
    student_id: (row as { student_id: string }).student_id,
    practitioner_id: (row as { practitioner_id: string }).practitioner_id,
    form_type: 'family_event_log',
    form_data: formData,
    submitted_by: 'family',
  })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
