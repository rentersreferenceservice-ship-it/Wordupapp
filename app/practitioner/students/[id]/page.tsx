import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getPractitionerSubscription, getStudent, getSessions, getCompletedSessionIds, getStudentAccuracyHistory } from '@/lib/practitionerStore'
import { listPractitionerLessons, listLessons } from '@/lib/lessonStore'
import Link from 'next/link'
import StartSessionButton from './StartSessionButton'
import DeleteStudentButton from './DeleteStudentButton'
import DeleteSessionButton from './DeleteSessionButton'
import AccuracyChart from '@/app/AccuracyChart'

export const dynamic = 'force-dynamic'

export default async function StudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) redirect('/practitioner/pricing')

  const sub = await getPractitionerSubscription(userId)
  if (!sub) redirect('/practitioner/pricing')

  const [student, sessions, privateLessons, publicLessons] = await Promise.all([
    getStudent(id),
    getSessions(userId, id),
    listPractitionerLessons(userId),
    listLessons(),
  ])
  const lessons = [...privateLessons, ...publicLessons]

  const [completedIds, accuracyHistory] = await Promise.all([
    getCompletedSessionIds(sessions.map(s => s.id)),
    getStudentAccuracyHistory(id, userId),
  ])

  if (!student || student.practitionerId !== userId) redirect('/practitioner/dashboard')

  return (
    <main className="min-h-screen px-6 py-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/practitioner/dashboard" className="text-sm text-blue-600 hover:underline mb-1 block">← Dashboard</Link>
          <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
          <p className="text-sm text-gray-500">{student.ageGroup}</p>
          {student.notes && <p className="text-sm text-gray-400 mt-1">{student.notes}</p>}
        </div>
        <div className="flex gap-2">
          <Link href={`/practitioner/students/${id}/edit`} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
            Edit
          </Link>
          <DeleteStudentButton studentId={id} />
        </div>
      </div>

      {/* Start New Session */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
        <h2 className="text-base font-semibold text-blue-900 mb-3">Start New Session</h2>
        <p className="text-sm text-blue-700 mb-4">Select a lesson from the library to run a live session with {student.name}.</p>
        <StartSessionButton studentId={id} studentName={student.name} lessons={lessons} />
      </div>

      {/* Accuracy trend */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Accuracy History</h2>
        <p className="text-xs text-gray-400 mb-4">Spelling accuracy across completed sessions</p>
        <AccuracyChart data={accuracyHistory} />
      </div>

      {/* Session History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Session History</h2>
        {sessions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No sessions yet for {student.name}.</p>
        ) : (
          <ul className="space-y-2">
            {sessions.map(s => {
              const isComplete = completedIds.has(s.id)
              return (
                <li key={s.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{s.lessonTitle}</p>
                    <p className="text-xs text-gray-400">{new Date(s.sessionDate).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-3 shrink-0">
                    {isComplete ? (
                      <Link href={`/practitioner/transcript/${s.id}`} className="text-xs text-blue-600 hover:underline">View Transcript</Link>
                    ) : (
                      <>
                        <Link href={`/practitioner/session/${s.id}`} className="text-xs font-semibold text-orange-600 hover:underline">▶ Resume</Link>
                        <Link href={`/practitioner/transcript/${s.id}`} className="text-xs text-gray-400 hover:underline">Transcript</Link>
                      </>
                    )}
                    <DeleteSessionButton sessionId={s.id} />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </main>
  )
}
