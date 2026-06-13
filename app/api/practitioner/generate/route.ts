import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { generateLesson } from '@/lib/generateLesson'
import { saveLesson } from '@/lib/lessonStore'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { getPractitionerSubscription } = await import('@/lib/practitionerStore')
    const sub = await getPractitionerSubscription(userId)
    if (!sub?.isActive) return Response.json({ error: 'Subscription required' }, { status: 403 })

    const { topic, ageGroup, style, genre } = await request.json()
    if (!topic || !ageGroup) return Response.json({ error: 'Topic and age group are required' }, { status: 400 })

    const lesson = await generateLesson(topic, ageGroup, style, genre)
    lesson.practitionerId = userId
    await saveLesson(lesson)

    return Response.json(lesson)
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.error('Practitioner generate error:', e)
    return Response.json({ error: message }, { status: 500 })
  }
}
