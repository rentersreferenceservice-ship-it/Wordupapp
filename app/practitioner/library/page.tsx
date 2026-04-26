import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getPractitionerSubscription } from '@/lib/practitionerStore'
import { listLessons } from '@/lib/lessonStore'
import PractitionerLessonBrowser from './PractitionerLessonBrowser'

export const dynamic = 'force-dynamic'

export default async function PractitionerLibraryPage() {
  const { userId } = await auth()
  if (!userId) redirect('/practitioner/pricing')

  const sub = await getPractitionerSubscription(userId)
  if (!sub) redirect('/practitioner/pricing')

  const lessons = await listLessons()

  return <PractitionerLessonBrowser lessons={lessons} />
}
