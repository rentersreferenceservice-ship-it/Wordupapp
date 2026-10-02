import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) return Response.json({ error: 'No file provided' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json({ error: 'File must be an image (JPG, PNG, or WEBP)' }, { status: 400 })
  }
  if (file.size > 20 * 1024 * 1024) {
    return Response.json({ error: 'File must be under 20 MB' }, { status: 400 })
  }

  const supabase = getSupabase()
  await supabase.storage.createBucket('book-images', { public: true }).catch(() => {})

  const ext = file.type.split('/')[1].replace('jpeg', 'jpg')
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const bytes = await file.arrayBuffer()

  const { error: uploadError } = await supabase.storage
    .from('book-images')
    .upload(path, bytes, { contentType: file.type, upsert: false })
  if (uploadError) return Response.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from('book-images').getPublicUrl(path)
  return Response.json({ url: publicUrl })
}
