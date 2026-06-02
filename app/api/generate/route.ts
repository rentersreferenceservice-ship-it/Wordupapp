import { NextRequest } from 'next/server'
import { generateLesson } from '@/lib/generateLesson'
import { saveLesson } from '@/lib/lessonStore'
import { auth } from '@clerk/nextjs/server'
import {
  getUserUsage,
  incrementLessons,
  MONTHLY_LIMIT,
  FREE_LESSON_LIMIT,
  getFreeActionsUsed,
} from '@/lib/usageStore'
import { getSupabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { topic, ageGroup, style, genre, email } = await request.json()

    if (!topic || !ageGroup) {
      return Response.json({ error: 'Topic and age group are required' }, { status: 400 })
    }

    const { userId } = await auth()

    // Non-logged-in users: gate by email, enforced server-side
    if (!userId) {
      const cleanEmail = (email ?? '').trim().toLowerCase()
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return Response.json({ error: 'Email is required to generate a free lesson' }, { status: 400 })
      }

      const supabase = getSupabase()
      const { data: freeUser } = await supabase
        .from('free_users')
        .select('lessons_used')
        .eq('email', cleanEmail)
        .single()

      const lessonsUsed = freeUser?.lessons_used ?? 0
      if (lessonsUsed >= 2) {
        return Response.json({ error: 'SUBSCRIBE_REQUIRED' }, { status: 403 })
      }

      const lesson = await generateLesson(topic, ageGroup, style, genre)
      await saveLesson(lesson)

      await supabase.from('free_users').upsert(
        { email: cleanEmail, lessons_used: lessonsUsed + 1 },
        { onConflict: 'email' }
      )

      return Response.json(lesson)
    }

    const ADMIN_USER_ID = 'user_3CDvdqpvQ2gtVYzPEzJZuleRX9p'
    const isAdmin = userId === ADMIN_USER_ID
    const usage = await getUserUsage(userId)

    if (!isAdmin && !usage.isSubscribed) {
      if (getFreeActionsUsed(usage.lessonsThisMonth, usage.printsThisMonth) >= FREE_LESSON_LIMIT) {
        return Response.json({ error: 'SUBSCRIBE_REQUIRED' }, { status: 403 })
      }
    }
    if (!isAdmin && usage.isSubscribed && usage.lessonsThisMonth + usage.printsThisMonth >= MONTHLY_LIMIT) {
      return Response.json({ error: 'LESSON_LIMIT_REACHED' }, { status: 403 })
    }

    const lesson = await generateLesson(topic, ageGroup, style, genre)
    await saveLesson(lesson)
    await incrementLessons(userId)
    return Response.json(lesson)

  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.error('Generate error:', e)
    return Response.json({ error: message }, { status: 500 })
  }
}
