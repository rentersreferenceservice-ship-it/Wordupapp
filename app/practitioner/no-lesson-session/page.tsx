import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import NoLessonSessionForm from './NoLessonSessionForm'

export const dynamic = 'force-dynamic'

export default async function NoLessonSessionPage() {
  const { userId } = await auth()
  if (!userId) redirect('/practitioner/get-started')

  const clerk = await clerkClient()
  const user = await clerk.users.getUser(userId)
  const practitionerName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.emailAddresses[0]?.emailAddress || ''

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Nav */}
        <div className="flex gap-3 mb-6">
          <Link href="/practitioner/dashboard" className="bg-gray-100 text-gray-700 border-2 border-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
            ← Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <img src="/word_up_clean.jpeg" alt="Word Up" style={{ width: 100, marginBottom: 8 }} />
              <h1 className="text-2xl font-bold text-gray-900">No Lesson Session</h1>
              <p className="text-gray-600 mt-1">Session update without a lesson</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{practitionerName}</p>
              <p className="text-sm text-gray-500 mt-1">{today}</p>
            </div>
          </div>
        </div>

        <NoLessonSessionForm />
      </div>
    </div>
  )
}
