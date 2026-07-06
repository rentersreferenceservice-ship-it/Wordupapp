import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']

export async function POST(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const supabase = getSupabase()

  const { data: session } = await supabase
    .from('sessions')
    .select('notes_images')
    .eq('id', sessionId)
    .eq('practitioner_id', userId)
    .single()
  if (!session) return Response.json({ error: 'Not found' }, { status: 404 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return Response.json({ error: 'No file provided' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json({ error: 'File must be an image' }, { status: 400 })
  }
  if (file.size > 10 * 1024 * 1024) {
    return Response.json({ error: 'File must be under 10 MB' }, { status: 400 })
  }

  const ext = file.type.split('/')[1].replace('jpeg', 'jpg')
  const path = `${userId}/${sessionId}/${Date.now()}.${ext}`
  const bytes = await file.arrayBuffer()

  const { error: uploadError } = await supabase.storage
    .from('session-images')
    .upload(path, bytes, { contentType: file.type, upsert: false })
  if (uploadError) return Response.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from('session-images').getPublicUrl(path)

  const existing: string[] = session.notes_images ?? []
  const { error: updateError } = await supabase
    .from('sessions')
    .update({ notes_images: [...existing, publicUrl] })
    .eq('id', sessionId)
    .eq('practitioner_id', userId)
  if (updateError) return Response.json({ error: updateError.message }, { status: 500 })

  return Response.json({ url: publicUrl })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const supabase = getSupabase()
  const { url } = await req.json()

  const { data: session } = await supabase
    .from('sessions')
    .select('notes_images')
    .eq('id', sessionId)
    .eq('practitioner_id', userId)
    .single()
  if (!session) return Response.json({ error: 'Not found' }, { status: 404 })

  const updated = (session.notes_images ?? []).filter((u: string) => u !== url)
  await supabase
    .from('sessions')
    .update({ notes_images: updated })
    .eq('id', sessionId)
    .eq('practitioner_id', userId)

  return Response.json({ ok: true })
}
