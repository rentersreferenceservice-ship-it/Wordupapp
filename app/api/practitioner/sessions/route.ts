import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getPractitionerSubscription, createSession } from '@/lib/practitionerStore'
import { getLesson } from '@/lib/lessonStore'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const sub = await getPractitionerSubscription(userId)
  if (!sub) return Response.json({ error: 'No practitioner subscription' }, { status: 403 })

  const { studentId, lessonId, sessionDate } = await req.json()
  const lesson = await getLesson(lessonId)
  if (!lesson) return Response.json({ error: 'Lesson not found' }, { status: 404 })

  const sessionId = await createSession(userId, studentId, lessonId, lesson.title, sessionDate)
  return Response.json({ sessionId })
}
