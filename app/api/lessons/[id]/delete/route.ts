import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getLesson, deleteLesson } from '@/lib/lessonStore'

const ADMIN_USER_ID = 'user_3CDvdqpvQ2gtVYzPEzJZuleRX9p'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const lesson = await getLesson(id)
  if (!lesson) return Response.json({ error: 'Lesson not found' }, { status: 404 })

  const isAdmin = userId === ADMIN_USER_ID
  const isOwner = lesson.practitionerId === userId

  if (!isAdmin && !isOwner) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }

  await deleteLesson(id)
  return Response.json({ ok: true })
}
