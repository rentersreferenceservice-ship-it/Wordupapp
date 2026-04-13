import { NextRequest } from 'next/server'
import { generateLesson } from '@/lib/generateLesson'
import { saveLesson } from '@/lib/lessonStore'
import { auth } from '@clerk/nextjs/server'
import {
  getUserUsage,
  incrementLessons,
  getVerifiedEmailUsage,
  incrementVerifiedEmailLesson,
  MONTHLY_LIMIT,
  FREE_LESSON_LIMIT,
} from '@/lib/usageStore'

export async function POST(request: NextRequest) {
  try {
    const { topic, ageGroup, verifiedEmail } = await request.json()

    if (!topic || !ageGroup) {
      return Response.json({ error: 'Topic and age group are required' }, { status: 400 })
    }

    const { userId } = await auth()

    if (!userId) {
      if (!verifiedEmail) {
        return Response.json({ error: 'EMAIL_REQUIRED' }, { status: 403 })
      }

      const used = await getVerifiedEmailUsage(verifiedEmail)
      if (used === -1) {
        return Response.json({ error: 'EMAIL_REQUIRED' }, { status: 403 })
      }
      if (used >= FREE_LESSON_LIMIT) {
        return Response.json({ error: 'FREE_USED' }, { status: 403 })
      }

      const lesson = await generateLesson(topic, ageGroup)
      await saveLesson(lesson)
      await incrementVerifiedEmailLesson(verifiedEmail)
      return Response.json({ ...lesson, freeUsed: true })
    }

    const usage = await getUserUsage(userId)
    if (!usage.isSubscribed) {
      return Response.json({ error: 'SUBSCRIBE_REQUIRED' }, { status: 403 })
    }
    if (usage.lessonsThisMonth + usage.printsThisMonth >= MONTHLY_LIMIT) {
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
