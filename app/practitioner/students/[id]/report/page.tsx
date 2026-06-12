import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getStudent } from '@/lib/practitionerStore'
import ReportClient from './ReportClient'

export const dynamic = 'force-dynamic'

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) redirect('/practitioner/get-started')

  const student = await getStudent(id)
  if (!student || student.practitionerId !== userId) redirect('/practitioner/dashboard')

  return <ReportClient studentId={id} studentName={student.name} />
}
