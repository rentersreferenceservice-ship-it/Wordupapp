import { listLessons } from '@/lib/lessonStore'
import LessonBrowser from './LessonBrowser'

export const dynamic = 'force-dynamic'

export default async function LessonsPage() {
  const lessons = await listLessons()
  return <LessonBrowser lessons={lessons} />
}
