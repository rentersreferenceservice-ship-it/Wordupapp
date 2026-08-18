import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getStudent, getSessions, getCompletedSessionIds, getStudentAccuracyHistory, getCrps, getSavedReports, getStudentDocuments, getFormSubmissions } from '@/lib/practitionerStore'
import { listAllPractitionerLessons, listLessons } from '@/lib/lessonStore'
import { getSupabase } from '@/lib/supabase'
import Link from 'next/link'
import StartSessionButton from './StartSessionButton'
import DeleteStudentButton from './DeleteStudentButton'
import DeleteSessionButton from './DeleteSessionButton'
import AccuracyChart from '@/app/AccuracyChart'
import AccuracyExcludeButton from './AccuracyExcludeButton'
import CrpManager from './CrpManager'
import BoardLevelPills from './BoardLevelPills'
import DeleteReportButton from './DeleteReportButton'
import InvoicesCollapsible from './InvoicesCollapsible'
import StudentDocumentsManager from './StudentDocumentsManager'
import FormSubmissionsSection from './FormSubmissionsSection'

export const dynamic = 'force-dynamic'

export default async function StudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) redirect('/practitioner/get-started')

  const [student, sessions, practitionerLessons, publicLessons] = await Promise.all([
    getStudent(id),
    getSessions(userId, id),
    listAllPractitionerLessons(),
    listLessons(),
  ])
  const lessons = [...practitionerLessons, ...publicLessons]

  const [completedIds, accuracyHistory, invoicesResult, crps, savedReports, studentDocs, formSubmissions] = await Promise.all([
    getCompletedSessionIds(sessions.map(s => s.id)),
    getStudentAccuracyHistory(id, userId),
    getSupabase()
      .from('invoices')
      .select('id, invoice_number, invoice_date, due_date, amount, amount_paid, is_paid, extra_items')
      .eq('student_id', id)
      .eq('practitioner_id', userId)
      .order('invoice_date', { ascending: false }),
    getCrps(id, userId),
    getSavedReports(id, userId),
    getStudentDocuments(id, userId).catch(() => []),
    getFormSubmissions(id, userId).catch(() => []),
  ])
  const invoices = invoicesResult.data ?? []
  const todayStr = new Date().toISOString().split('T')[0]

  if (!student || student.practitionerId !== userId) redirect('/practitioner/dashboard')

  // Compute suggested board levels: scan sessions oldest→newest, carry last known
  const oldestFirst = [...sessions].reverse()
  let lastKnown: string | null = null
  const suggested: Record<string, string | null> = {}
  for (const s of oldestFirst) {
    if (s.boardLevel) {
      lastKnown = s.boardLevel
    } else {
      suggested[s.id] = lastKnown
    }
  }

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
          <Link href={`/practitioner/students/${id}/edit`} className="bg-gray-100 text-gray-700 border-2 border-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
            Edit
          </Link>
          <Link href={`/practitioner/students/${id}/observation-report`} className="bg-white text-indigo-700 border-2 border-indigo-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors">
            Observation Report
          </Link>
          <Link href={`/practitioner/students/${id}/report`} className="bg-blue-600 text-white border-2 border-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            Progress Report
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

      {/* Accuracy trend — featured */}
      <div className="rounded-2xl overflow-hidden shadow-xl mb-6" style={{ background: '#1a1410' }}>
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] font-bold mb-2" style={{ color: '#C9A435' }}>
                Objective Data · Real Progress
              </p>
              <h2 className="text-lg font-bold text-white leading-tight">Accuracy History</h2>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Spelling accuracy across completed sessions
              </p>
            </div>
            <AccuracyExcludeButton studentId={id} sessionCount={sessions.length} />
          </div>
        </div>

        {/* Chart — clean white panel */}
        <div className="mx-4 rounded-xl bg-white px-4 pt-4 pb-2">
          <AccuracyChart data={accuracyHistory} />
        </div>

        {/* Annotation */}
        <div className="px-6 py-4">
          <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>
            <span style={{ color: '#C9A435' }}>✦</span> Dips in accuracy often reflect dysregulation events — not regression. The climb back up is what we watch for.
          </p>
        </div>
      </div>

      {/* Saved Progress Reports — always visible under the graph */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Progress Reports</h2>
          <Link href={`/practitioner/students/${id}/report`} className="text-xs font-semibold text-blue-600 hover:underline">
            + New Report
          </Link>
        </div>
        {savedReports.length === 0 ? (
          <p className="text-sm text-gray-400">No reports saved yet. <Link href={`/practitioner/students/${id}/report`} className="text-blue-600 hover:underline">Generate one →</Link></p>
        ) : (
          <ul className="space-y-2">
            {savedReports.map(r => {
              const periodLabel = `${new Date(r.startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – ${new Date(r.endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
              const savedDate = new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              return (
                <li key={r.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{periodLabel}</p>
                    <p className="text-xs text-gray-400">Saved {savedDate}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link href={`/practitioner/students/${id}/report?load=${r.id}`} className="text-xs font-semibold text-blue-600 hover:underline">
                      Open →
                    </Link>
                    <DeleteReportButton studentId={id} reportId={r.id} />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* CRP Management */}
      <CrpManager studentId={id} initialCrps={crps} />

      {/* Invoices */}
      <InvoicesCollapsible invoices={invoices} todayStr={todayStr} studentId={id} />

      {/* Online Form Submissions */}
      <FormSubmissionsSection studentId={id} initialSubmissions={formSubmissions} />

      {/* Assessment Forms & Documents */}
      <StudentDocumentsManager studentId={id} initialDocs={studentDocs} />

      {/* Session History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Session History</h2>
        {sessions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No sessions yet for {student.name}.</p>
        ) : (
          <ul className="space-y-3">
            {sessions.map(s => {
              const isComplete = completedIds.has(s.id)
              return (
                <li key={s.id} className="p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{s.lessonTitle}</p>
                      <p className="text-xs text-gray-400">{new Date(s.sessionDate + 'T00:00:00').toLocaleDateString()}</p>
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
                  </div>
                  <BoardLevelPills
                    sessionId={s.id}
                    boardLevel={s.boardLevel}
                    suggestedLevel={suggested[s.id] ?? null}
                  />
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </main>
  )
}
