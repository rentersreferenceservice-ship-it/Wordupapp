import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { listAllPractitionerLessons, listLessons } from '@/lib/lessonStore'
import PractitionerLessonBrowser from './PractitionerLessonBrowser'

export const dynamic = 'force-dynamic'

export default async function PractitionerLibraryPage() {
  const { userId } = await auth()
  if (!userId) redirect('/practitioner/get-started')


  const [practitionerLessons, publicLessons] = await Promise.all([
    listAllPractitionerLessons(),
    listLessons(),
  ])

  const lessons = [...practitionerLessons, ...publicLessons]

  return <PractitionerLessonBrowser lessons={lessons} />
}
