import { NextRequest } from 'next/server'
import { generateLesson } from '@/lib/generateLesson'
import { saveLesson } from '@/lib/lessonStore'
import { auth } from '@clerk/nextjs/server'
import {
  getUserUsage,
  incrementLessons,
  MONTHLY_LIMIT,
  FREE_LESSON_LIMIT,
} from '@/lib/usageStore'

export async function POST(request: NextRequest) {
  try {
    const { topic, ageGroup } = await request.json()

    if (!topic || !ageGroup) {
      return Response.json({ error: 'Topic and age group are required' }, { status: 400 })
    }

    const { userId } = await auth()

    // Non-logged-in users: allow freely — free lesson count tracked client-side via localStorage
    if (!userId) {
      const lesson = await generateLesson(topic, ageGroup)
      await saveLesson(lesson)
      return Response.json(lesson)
    }

    const ADMIN_USER_ID = 'user_3CDvdqpvQ2gtVYzPEzJZuleRX9p'
    const isAdmin = userId === ADMIN_USER_ID
    const usage = await getUserUsage(userId)

    if (!isAdmin && !usage.isSubscribed) {
      if (usage.lessonsThisMonth >= FREE_LESSON_LIMIT) {
        return Response.json({ error: 'SUBSCRIBE_REQUIRED' }, { status: 403 })
      }
    }
    if (!isAdmin && usage.isSubscribed && usage.lessonsThisMonth + usage.printsThisMonth >= MONTHLY_LIMIT) {
      return Response.json({ error: 'LESSON_LIMIT_REACHED' }, { status: 403 })
    }

    const lesson = await generateLesson(topic, ageGroup)
    await saveLesson(lesson)
    await incrementLessons(userId)
    return Response.json(lesson)

  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.error('Generate error:', e)
    return Response.json({ error: message }, { status: 500 })
  }
}
