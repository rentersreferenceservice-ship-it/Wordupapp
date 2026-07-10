import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getStudents, getPractitionerSubscription } from '@/lib/practitionerStore'
import OpenSessionForm from './OpenSessionForm'

export const dynamic = 'force-dynamic'

export default async function OpenSessionPage() {
  const { userId } = await auth()
  if (!userId) redirect('/practitioner/get-started')

  const subscription = await getPractitionerSubscription(userId)
  if (!subscription?.isActive) redirect('/practitioner/subscribe')

  const students = await getStudents(userId)

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <OpenSessionForm students={students} />
      </div>
    </main>
  )
}
