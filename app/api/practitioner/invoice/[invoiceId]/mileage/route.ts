import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Replace the mileage logged for this invoice — used to switch between a
// student's regular and second trip, or log none.
export async function POST(req: NextRequest, { params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const { miles } = await req.json()
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

  await supabase.from('mileage_log').delete().eq('invoice_id', invoiceId).eq('practitioner_id', userId)
  const value = miles != null ? parseFloat(miles) : 0
  if (value > 0) {
    const { error } = await supabase.from('mileage_log').insert({
      practitioner_id: userId,
      student_id: invoice.student_id,
      invoice_id: invoiceId,
      miles: value,
      trip_date: tripDate ?? invoice.invoice_date,
    })
    if (error) return Response.json({ error: error.message }, { status: 500 })
  }
  return Response.json({ ok: true })
}
