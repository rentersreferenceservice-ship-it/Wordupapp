import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getSessionResponses } from '@/lib/practitionerStore'
import { getSupabase } from '@/lib/supabase'
import EditTranscriptClient from './EditTranscriptClient'

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

  const responses = await getSessionResponses(sessionId)

  return (
    <div className="min-h-screen bg-gray-50">
      <EditTranscriptClient
        sessionId={sessionId}
        studentId={session.student_id}
        responses={responses}
      />
    </div>
  )
}
