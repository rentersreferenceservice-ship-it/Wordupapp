import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getSessionResponses } from '@/lib/practitionerStore'
import { getSupabase } from '@/lib/supabase'
import EditTranscriptClient from './EditTranscriptClient'
import type { Hunk } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function EditTranscriptPage({ params }: { params: Promise<{ sessionId: string }> }) {
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

  const [responses, lessonRow] = await Promise.all([
    getSessionResponses(sessionId),
    session.lesson_id
      ? getSupabase().from('lessons').select('hunks').eq('id', session.lesson_id).single().then(r => r.data)
      : Promise.resolve(null),
  ])

  const lessonHunks: Hunk[] | undefined = lessonRow?.hunks ?? undefined

  return (
    <div className="min-h-screen bg-gray-50">
      <EditTranscriptClient
        sessionId={sessionId}
        studentId={session.student_id}
        responses={responses}
        lessonHunks={lessonHunks}
      />
    </div>
  )
}
