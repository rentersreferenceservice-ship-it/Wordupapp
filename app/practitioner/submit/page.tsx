import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getPractitionerSubscription } from '@/lib/practitionerStore'
import SubmitLessonForm from '@/app/submit/SubmitLessonForm'

export default async function PractitionerSubmitPage() {
  const { userId } = await auth()
  if (!userId) redirect('/practitioner/pricing')

  const sub = await getPractitionerSubscription(userId)
  if (!sub) redirect('/practitioner/pricing')

  return <SubmitLessonForm practitionerMode backHref="/practitioner/library" />
}
