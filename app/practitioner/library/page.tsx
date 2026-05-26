import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { listPractitionerLessons, listLessons } from '@/lib/lessonStore'
import PractitionerLessonBrowser from './PractitionerLessonBrowser'

export const dynamic = 'force-dynamic'

export default async function PractitionerLibraryPage() {
  const { userId } = await auth()
  if (!userId) redirect('/practitioner/get-started')


  const [privateLessons, publicLessons] = await Promise.all([
    listPractitionerLessons(userId),
    listLessons(),
  ])

  const lessons = [...privateLessons, ...publicLessons]

  return <PractitionerLessonBrowser lessons={lessons} />
}
