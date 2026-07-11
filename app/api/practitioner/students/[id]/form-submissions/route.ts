import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: studentId } = await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const supabase = getSupabase()

  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id')
    .eq('id', studentId)
    .eq('practitioner_id', userId)
    .single()

  if (studentError || !student) {
    return Response.json({ error: 'Student not found' }, { status: 404 })
  }

  const { formType, formData } = await req.json()
  if (!formType || !formData) {
    return Response.json({ error: 'Missing formType or formData' }, { status: 400 })
  }

  const { error: insertError } = await supabase.from('form_submissions').insert({
    student_id: studentId,
    practitioner_id: userId,
    form_type: formType,
    form_data: formData,
    submitted_by: 'practitioner',
  })

  if (insertError) {
    console.error('form_submissions insert error:', insertError)
    return Response.json({ error: 'Failed to save submission' }, { status: 500 })
  }

  return Response.json({ ok: true })
}
