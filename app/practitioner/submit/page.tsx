import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import SubmitLessonForm from '@/app/submit/SubmitLessonForm'

export default async function PractitionerSubmitPage() {
  const { userId } = await auth()
  if (!userId) redirect('/practitioner/get-started')


  return <SubmitLessonForm practitionerMode backHref="/practitioner/library" />
}
