import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { listAllPractitionerLessons } from '@/lib/lessonStore'
import PractitionerLessonBrowser from './PractitionerLessonBrowser'

export const dynamic = 'force-dynamic'

export default async function PractitionerLibraryPage() {
  const { userId } = await auth()
  if (!userId) redirect('/practitioner/get-started')

  const lessons = await listAllPractitionerLessons()

  return <PractitionerLessonBrowser lessons={lessons} />
}
