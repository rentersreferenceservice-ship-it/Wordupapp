import { listLessons } from '@/lib/lessonStore'
import LessonBrowser from './LessonBrowser'
import { auth } from '@clerk/nextjs/server'
import { getUserUsage } from '@/lib/usageStore'

export const dynamic = 'force-dynamic'

const ADMIN_USER_ID = 'user_3CDvdqpvQ2gtVYzPEzJZuleRX9p'

export default async function LessonsPage() {
  // Determine subscription status — guests and non-subscribers get preview mode
  let isSubscribed = false
  try {
    const { userId } = await auth()
    if (userId === ADMIN_USER_ID) {
      isSubscribed = true
    } else if (userId) {
      const usage = await getUserUsage(userId)
      isSubscribed = usage.isSubscribed
    }
  } catch {
    // unauthenticated or auth error — treat as guest
  }

  let lessons: Awaited<ReturnType<typeof listLessons>> = []
  try {
    lessons = await listLessons()
  } catch {
    // show empty library rather than crashing
  }

  return <LessonBrowser lessons={lessons} isSubscribed={isSubscribed} />
}
