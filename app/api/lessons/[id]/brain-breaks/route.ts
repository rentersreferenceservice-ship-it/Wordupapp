import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getLesson } from '@/lib/lessonStore'
import { getSupabase } from '@/lib/supabase'
import { addBrainBreaks } from '@/lib/brainBreaks'

export const dynamic = 'force-dynamic'

const ADMIN_USER_ID = 'user_3CDvdqpvQ2gtVYzPEzJZuleRX9p'

// Adds the two brain breaks to a lesson made before breaks existed.
// Only the lesson's owner (or the admin, for public lessons) can do this.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const lesson = await getLesson(id)
  if (!lesson) return Response.json({ error: 'Lesson not found' }, { status: 404 })
  if (userId !== ADMIN_USER_ID && lesson.practitionerId !== userId) {
    return Response.json({ error: 'Only the lesson owner can add brain breaks' }, { status: 403 })
  }

  const withBreaks = await addBrainBreaks(lesson)
  const { error } = await getSupabase().from('lessons').update({ hunks: withBreaks.hunks }).eq('id', id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
