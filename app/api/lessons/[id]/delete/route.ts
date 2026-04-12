import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { deleteLesson } from '@/lib/lessonStore'

const ADMIN_USER_ID = 'user_3CDvdqpvQ2gtVYzPEzJZuleRX9p'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (userId !== ADMIN_USER_ID) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id } = await params
  const deleted = deleteLesson(id)
  if (!deleted) {
    return Response.json({ error: 'Lesson not found' }, { status: 404 })
  }

  return Response.json({ ok: true })
}
