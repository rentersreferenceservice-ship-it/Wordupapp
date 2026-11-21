import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Two kinds of mileage per invoice:
// - the trip there ({ miles }): switch between a student's regular and
//   second trip, or none
// - the drive home ({ home: true|false }): the student's miles home, logged
//   as its own row so switching the trip there doesn't remove it
export async function POST(req: NextRequest, { params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const body = await req.json()
  const isHome = typeof body.home === 'boolean'
  const supabase = getSupabase()

  const { data: invoice } = await supabase
    .from('invoices')
    .select('id, student_id, session_id, invoice_date')
    .eq('id', invoiceId)
    .eq('practitioner_id', userId)
    .single()
  if (!invoice) return Response.json({ error: 'Not found' }, { status: 404 })

  const { data: existing } = await supabase.from('mileage_log').select('trip_date').eq('invoice_id', invoiceId).limit(1)
  let tripDate: string | null = existing?.[0]?.trip_date ?? null
  if (!tripDate && invoice.session_id) {
    const { data: session } = await supabase.from('sessions').select('session_date').eq('id', invoice.session_id).single()
    tripDate = session?.session_date ?? null
  }

  let value: number
  if (isHome) {
    const { data: student } = await supabase.from('students').select('*').eq('id', invoice.student_id).single()
    value = body.home && student?.home_mileage ? parseFloat(student.home_mileage) : 0
  } else {
    value = body.miles != null ? parseFloat(body.miles) : 0
  }

  const { error: deleteError } = await supabase.from('mileage_log').delete()
    .eq('invoice_id', invoiceId).eq('practitioner_id', userId).eq('is_trip_home', isHome)
  if (deleteError) return Response.json({ error: deleteError.message }, { status: 500 })

  if (value > 0) {
    const { error } = await supabase.from('mileage_log').insert({
      practitioner_id: userId,
      student_id: invoice.student_id,
      invoice_id: invoiceId,
      miles: value,
      trip_date: tripDate ?? invoice.invoice_date,
      is_trip_home: isHome,
    })
    if (error) return Response.json({ error: error.message }, { status: 500 })
  }
  return Response.json({ ok: true })
}
