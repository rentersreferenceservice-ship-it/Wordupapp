import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getStudents, getSessions } from '@/lib/practitionerStore'
import Link from 'next/link'
import AccessCodeManager from './AccessCodeManager'

export const dynamic = 'force-dynamic'

export default async function PractitionerDashboard() {
  const { userId } = await auth()
  if (!userId) redirect('/practitioner/get-started')

  const [students, sessions] = await Promise.all([
    getStudents(userId),
    getSessions(userId),
  ])

  const recentSessions = sessions.slice(0, 5)

  return (
    <main className="min-h-screen px-6 py-8 max-w-5xl mx-auto">
      <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <img src="/word_up_clean.jpeg" alt="Word Up" style={{ width: 100 }} />
          <h1 className="text-2xl font-bold text-gray-900">Practitioner Dashboard</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/practitioner/generate" className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
            Lesson Generator
          </Link>
          <Link href="/practitioner/library" className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
            Lesson Library
          </Link>
          <Link href="/lessons" className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
            Public Library
          </Link>
          <Link href="/practitioner/submit" className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
            Upload Lesson
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
          <p className="text-3xl font-bold text-blue-600">{students.length}</p>
          <p className="text-sm text-gray-500 mt-1">Students</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
          <p className="text-3xl font-bold text-green-600">{sessions.length}</p>
          <p className="text-sm text-gray-500 mt-1">Total Sessions</p>
        </div>
      </div>

      <div className="mb-6">
        <AccessCodeManager />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Caseload */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">My Students</h2>
            <Link href="/practitioner/students/new" className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors">
              + Add Student
            </Link>
          </div>
          {students.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No students yet. Add your first student to get started.</p>
          ) : (
            <ul className="space-y-2">
              {students.map(s => (
                <li key={s.id}>
                  <Link href={`/practitioner/students/${s.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                    <div>
                      <p className="font-medium text-gray-900 group-hover:text-blue-600">{s.name}</p>
                      <p className="text-xs text-gray-400">{s.ageGroup}</p>
                    </div>
                    <span className="text-gray-300 group-hover:text-blue-400">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Sessions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Sessions</h2>
          {recentSessions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No sessions yet. Start a session from a student&apos;s profile.</p>
          ) : (
            <ul className="space-y-2">
              {recentSessions.map(s => (
                <li key={s.id}>
                  <Link href={`/practitioner/transcript/${s.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                    <div>
                      <p className="font-medium text-gray-900 text-sm group-hover:text-blue-600">{s.lessonTitle}</p>
                      <p className="text-xs text-gray-400">{new Date(s.sessionDate).toLocaleDateString()}</p>
                    </div>
                    <span className="text-xs text-blue-600 group-hover:underline">View</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  )
}
