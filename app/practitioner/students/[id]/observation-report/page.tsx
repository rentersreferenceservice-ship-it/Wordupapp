import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { getStudent } from '@/lib/practitionerStore'
import ObservationReportClient from './ObservationReportClient'

export const dynamic = 'force-dynamic'

export default async function ObservationReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ start?: string; end?: string }>
}) {
  const { id } = await params
  const sp = await searchParams
  const { userId } = await auth()
  if (!userId) redirect('/practitioner/get-started')

  const student = await getStudent(id)
  if (!student || student.practitionerId !== userId) redirect('/practitioner/dashboard')

  // Default: last 90 days
  const today = new Date()
  const defaultEnd = today.toISOString().split('T')[0]
  const defaultStart = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const start = sp.start ?? defaultStart
  const end = sp.end ?? defaultEnd

  const { data: submissions } = await getSupabase()
    .from('form_submissions')
    .select('*')
    .eq('student_id', id)
    .eq('practitioner_id', userId)
    .gte('submitted_at', start + 'T00:00:00')
    .lte('submitted_at', end + 'T23:59:59')
    .order('submitted_at', { ascending: true })

  return (
    <ObservationReportClient
      studentId={id}
      studentName={student.name}
      start={start}
      end={end}
      submissions={submissions ?? []}
    />
  )
}
