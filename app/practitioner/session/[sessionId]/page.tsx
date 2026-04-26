import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getPractitionerSubscription } from '@/lib/practitionerStore'
import { getSupabase } from '@/lib/supabase'
import { getLesson } from '@/lib/lessonStore'
import SessionPlayer from './SessionPlayer'

export const dynamic = 'force-dynamic'

export default async function SessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const { userId } = await auth()
  if (!userId) redirect('/practitioner/pricing')

  const sub = await getPractitionerSubscription(userId)
  if (!sub) redirect('/practitioner/pricing')

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

  const lesson = await getLesson(session.lesson_id)
  if (!lesson) redirect('/practitioner/dashboard')

  return (
    <SessionPlayer
      sessionId={sessionId}
      studentName={studentData?.name ?? 'Student'}
      sessionDate={session.session_date}
      lesson={lesson}
      lessonId={session.lesson_id}
    />
  )
}
