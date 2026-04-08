import { listLessons } from '@/lib/lessonStore'
import LessonBrowser from './LessonBrowser'

export const dynamic = 'force-dynamic'

export default function LessonsPage() {
  const lessons = listLessons()
  return <LessonBrowser lessons={lessons} />
}
