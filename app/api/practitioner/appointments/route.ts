import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month') // "YYYY-MM"

  let query = getSupabase()
    .from('appointments')
    .select('*')
    .eq('practitioner_id', userId)
    .order('appointment_date')
    .order('appointment_time')

  if (month) {
    const [year, m] = month.split('-').map(Number)
    const start = `${year}-${String(m).padStart(2, '0')}-01`
    const lastDay = new Date(year, m, 0).getDate()
    const end = `${year}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    query = query.gte('appointment_date', start).lte('appointment_date', end)
  }

  const { data, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ appointments: data ?? [] })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const {
    studentId, studentName, date, time,
    durationMinutes, travelBefore, travelAfter,
    notes, recurrence,
  } = await req.json()

  if (!studentName?.trim() || !date || !time)
    return Response.json({ error: 'Student name, date, and time are required' }, { status: 400 })

  const supabase = getSupabase()
  const isRecurring = recurrence === 'weekly' || recurrence === 'biweekly'
  const seriesId = isRecurring ? crypto.randomUUID() : null
  const stepDays = recurrence === 'biweekly' ? 14 : 7

  // Generate 2 years of occurrences — user ends the series by deleting future entries
  const count = isRecurring ? (recurrence === 'biweekly' ? 52 : 104) : 1

  const rows = []
  const base = new Date(date + 'T00:00:00')
  for (let i = 0; i < count; i++) {
    const d = new Date(base)
    d.setDate(d.getDate() + i * stepDays)
    rows.push({
      practitioner_id: userId,
      student_id: studentId ?? null,
      student_name: studentName.trim(),
      appointment_date: d.toISOString().split('T')[0],
      appointment_time: time,
      duration_minutes: durationMinutes ?? 50,
      travel_before: travelBefore ?? 0,
      travel_after: travelAfter ?? 0,
      notes: notes?.trim() || null,
      series_id: seriesId,
      skipped: false,
      skip_notes: null,
    })
  }

  const { data, error } = await supabase.from('appointments').insert(rows).select()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ appointments: data })
}
