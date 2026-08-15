import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getStudents } from '@/lib/practitionerStore'
import NoLessonSessionForm from './NoLessonSessionForm'

export const dynamic = 'force-dynamic'

export default async function NoLessonSessionPage() {
  const { userId } = await auth()
  if (!userId) redirect('/practitioner/get-started')

  const [user, students] = await Promise.all([
    clerkClient().then(clerk => clerk.users.getUser(userId)),
    getStudents(userId),
  ])
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

        <NoLessonSessionForm
          students={students.map(s => ({ id: s.id, name: s.name, guardianEmail: s.guardianEmail }))}
          practitionerName={practitionerName}
          today={today}
        />
      </div>
    </div>
  )
}
