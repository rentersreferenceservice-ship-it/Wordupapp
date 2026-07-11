import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ docId: string }> }) {
  const { docId } = await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const supabase = getSupabase()

  const { data: doc } = await supabase
    .from('student_documents')
    .select('file_url')
    .eq('id', docId)
    .eq('practitioner_id', userId)
    .single()
  if (!doc) return Response.json({ error: 'Not found' }, { status: 404 })

  // Extract storage path from public URL
  const parts = (doc as { file_url: string }).file_url.split('/student-documents/')
  if (parts.length === 2) {
    await supabase.storage.from('student-documents').remove([parts[1]])
  }

  await supabase.from('student_documents').delete().eq('id', docId).eq('practitioner_id', userId)

  return Response.json({ ok: true })
}
