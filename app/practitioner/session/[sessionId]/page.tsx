import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getSessionResponses, getCrps } from '@/lib/practitionerStore'
import { getSupabase } from '@/lib/supabase'
import { getLesson } from '@/lib/lessonStore'
import SessionPlayer from './SessionPlayer'

export const dynamic = 'force-dynamic'

export default async function SessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const { userId } = await auth()
  if (!userId) redirect('/practitioner/get-started')


  const { data: session } = await getSupabase()
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('practitioner_id', userId)
    .single()

  if (!session) redirect('/practitioner/dashboard')

  const { data: studentData } = await getSupabase()
    .from('students')
    .select('name')
    .eq('id', session.student_id)
    .single()

  const [lesson, initialResponses, crps] = await Promise.all([
    getLesson(session.lesson_id),
    getSessionResponses(sessionId),
    getCrps(session.student_id, userId),
  ])
  if (!lesson) redirect('/practitioner/dashboard')

  // Use practitioner's custom hunks for this session if they exist
  const effectiveLesson = session.custom_hunks
    ? { ...lesson, hunks: session.custom_hunks }
    : lesson

  return (
    <SessionPlayer
      sessionId={sessionId}
      studentName={studentData?.name ?? 'Student'}
      sessionDate={session.session_date}
      lesson={effectiveLesson}
      lessonId={session.lesson_id}
      studentId={session.student_id}
      initialResponses={initialResponses}
      initialRegulationArrival={session.regulation_arrival ?? null}
      initialRegulationDeparture={session.regulation_departure ?? null}
      crps={crps}
      initialCrpId={session.crp_id ?? null}
    />
  )
}
