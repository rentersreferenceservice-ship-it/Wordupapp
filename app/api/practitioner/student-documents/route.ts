import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const studentId = formData.get('studentId') as string | null
  const label = ((formData.get('label') as string) || '').trim() || 'Untitled'
  const formType = (formData.get('formType') as string | null) || null

  if (!file) return Response.json({ error: 'No file provided' }, { status: 400 })
  if (!studentId) return Response.json({ error: 'Missing studentId' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json({ error: 'File must be an image (JPG, PNG, HEIC) or PDF' }, { status: 400 })
  }
  if (file.size > 20 * 1024 * 1024) {
    return Response.json({ error: 'File must be under 20 MB' }, { status: 400 })
  }

  const supabase = getSupabase()

  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('id', studentId)
    .eq('practitioner_id', userId)
    .single()
  if (!student) return Response.json({ error: 'Student not found' }, { status: 404 })

  await supabase.storage.createBucket('student-documents', { public: true }).catch(() => {})

  const ext = file.type === 'application/pdf' ? 'pdf' : file.type.split('/')[1].replace('jpeg', 'jpg')
  const path = `${userId}/${studentId}/${Date.now()}.${ext}`
  const bytes = await file.arrayBuffer()

  const { error: uploadError } = await supabase.storage
    .from('student-documents')
    .upload(path, bytes, { contentType: file.type, upsert: false })
  if (uploadError) return Response.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from('student-documents').getPublicUrl(path)

  const { data: doc, error: dbError } = await supabase
    .from('student_documents')
    .insert({
      student_id: studentId,
      practitioner_id: userId,
      file_url: publicUrl,
      label,
      form_type: formType,
    })
    .select()
    .single()
  if (dbError) return Response.json({ error: dbError.message }, { status: 500 })

  return Response.json({
    doc: {
      id: (doc as { id: string }).id,
      studentId: (doc as { student_id: string }).student_id,
      practitionerId: (doc as { practitioner_id: string }).practitioner_id,
      fileUrl: (doc as { file_url: string }).file_url,
      label: (doc as { label: string }).label ?? '',
      formType: (doc as { form_type: string | null }).form_type ?? null,
      uploadedAt: (doc as { uploaded_at: string }).uploaded_at,
    }
  })
}
