import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getStudents } from '@/lib/practitionerStore'
import { getSupabase } from '@/lib/supabase'
import CalendarClient from './CalendarClient'

export const dynamic = 'force-dynamic'

export default async function CalendarPage() {
  const { userId } = await auth()
  if (!userId) redirect('/practitioner/get-started')

  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth() + 1
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  const [students, { data: appointments }] = await Promise.all([
    getStudents(userId),
    getSupabase()
      .from('appointments')
      .select('*')
      .eq('practitioner_id', userId)
      .gte('appointment_date', start)
      .lte('appointment_date', end)
      .order('appointment_date')
      .order('appointment_time'),
  ])

  return (
    <CalendarClient
      students={students}
      initialAppointments={appointments ?? []}
      initialYear={year}
      initialMonth={month}
    />
  )
}
