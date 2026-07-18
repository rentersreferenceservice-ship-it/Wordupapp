import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  // scope=single (default) | series (all in series) | future (this + future in series)
  const { searchParams } = new URL(req.url)
  const scope = searchParams.get('scope') ?? 'single'

  const body = await req.json()
  const update: Record<string, unknown> = {}
  if ('studentName' in body) update.student_name = body.studentName
  if ('studentId' in body) update.student_id = body.studentId
  if ('time' in body) update.appointment_time = body.time
  if ('durationMinutes' in body) update.duration_minutes = body.durationMinutes
  if ('travelBefore' in body) update.travel_before = body.travelBefore
  if ('travelAfter' in body) update.travel_after = body.travelAfter
  if ('notes' in body) update.notes = body.notes || null
  if ('skipped' in body) update.skipped = body.skipped
  if ('skipNotes' in body) update.skip_notes = body.skipNotes || null

  const supabase = getSupabase()
  const { data: existing } = await supabase
    .from('appointments')
    .select('practitioner_id, series_id, appointment_date')
    .eq('id', id).single()
  if (!existing || existing.practitioner_id !== userId)
    return Response.json({ error: 'Not found' }, { status: 404 })

  if (scope === 'series' && existing.series_id) {
    const { error } = await supabase.from('appointments')
      .update(update)
      .eq('series_id', existing.series_id)
      .eq('practitioner_id', userId)
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ scope: 'series' })
  }

  if (scope === 'future' && existing.series_id) {
    const { error } = await supabase.from('appointments')
      .update(update)
      .eq('series_id', existing.series_id)
      .eq('practitioner_id', userId)
      .gte('appointment_date', existing.appointment_date)
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ scope: 'future' })
  }

  // single
  const { data, error } = await supabase.from('appointments').update(update).eq('id', id).select().single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ appointment: data })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const deleteSeries = searchParams.get('series') === 'true'
  const endFromHere = searchParams.get('future') === 'true' // delete this + all future in series

  const supabase = getSupabase()
  const { data: existing } = await supabase
    .from('appointments')
    .select('practitioner_id, series_id, appointment_date')
    .eq('id', id).single()

  if (!existing || existing.practitioner_id !== userId)
    return Response.json({ error: 'Not found' }, { status: 404 })

  if (endFromHere && existing.series_id) {
    // Delete this appointment and all future ones in the series
    await supabase.from('appointments')
      .delete()
      .eq('series_id', existing.series_id)
      .eq('practitioner_id', userId)
      .gte('appointment_date', existing.appointment_date)
  } else if (deleteSeries && existing.series_id) {
    await supabase.from('appointments').delete().eq('series_id', existing.series_id).eq('practitioner_id', userId)
  } else {
    await supabase.from('appointments').delete().eq('id', id)
  }

  return Response.json({ ok: true })
}
