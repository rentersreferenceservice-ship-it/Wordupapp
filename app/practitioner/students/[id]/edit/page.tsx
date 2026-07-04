import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { getStudent } from '@/lib/practitionerStore'
import EditStudentForm from './EditStudentForm'

export const dynamic = 'force-dynamic'

export default async function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) redirect('/practitioner/get-started')

  const student = await getStudent(id)
  if (!student || student.practitionerId !== userId) notFound()

  return <EditStudentForm student={student} />
}
