import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return Response.json({ error: 'No file provided' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json({ error: 'File must be an image (JPG, PNG, GIF, WebP, or SVG)' }, { status: 400 })
  }
  if (file.size > 2 * 1024 * 1024) {
    return Response.json({ error: 'File must be under 2 MB' }, { status: 400 })
  }

  const ext = file.type === 'image/svg+xml' ? 'svg' : file.type.split('/')[1]
  const supabase = getSupabase()

  // Create bucket if it doesn't exist yet (no-op if already exists)
  await supabase.storage.createBucket('practitioner-logos', { public: true }).catch(() => {})

  const path = `${userId}/logo.${ext}`
  const bytes = await file.arrayBuffer()

  const { error } = await supabase.storage
    .from('practitioner-logos')
    .upload(path, bytes, { contentType: file.type, upsert: true })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage
    .from('practitioner-logos')
    .getPublicUrl(path)

  // Bust the CDN cache by appending a timestamp so the new image shows immediately
  const url = `${publicUrl}?t=${Date.now()}`

  return Response.json({ url })
}
