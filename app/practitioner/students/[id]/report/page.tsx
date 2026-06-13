import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getStudent, getSavedReports } from '@/lib/practitionerStore'
import ReportClient from './ReportClient'

export const dynamic = 'force-dynamic'

export default async function ReportPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ load?: string }> }) {
  const { id } = await params
  const { load } = await searchParams
  const { userId } = await auth()
  if (!userId) redirect('/practitioner/get-started')

  const student = await getStudent(id)
  if (!student || student.practitionerId !== userId) redirect('/practitioner/dashboard')

  const savedReports = await getSavedReports(id, userId)
  const loadedReport = load ? (savedReports.find(r => r.id === load) ?? null) : null

  return <ReportClient studentId={id} studentName={student.name} savedReports={savedReports} loadedReport={loadedReport} />
}
