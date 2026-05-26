import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const supabase = getSupabase()

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .eq('practitioner_id', userId)
    .single()
  if (!invoice) return Response.json({ error: 'Not found' }, { status: 404 })

  const [{ data: student }, { data: session }, { data: settings }, { data: unpaid }] = await Promise.all([
    supabase.from('students').select('name').eq('id', invoice.student_id).single(),
    invoice.session_id
      ? supabase.from('sessions').select('lesson_title, session_date').eq('id', invoice.session_id).single()
      : Promise.resolve({ data: null }),
    supabase.from('practitioner_settings').select('*').eq('practitioner_id', userId).single(),
    supabase.from('invoices')
      .select('amount, amount_paid')
      .eq('practitioner_id', userId)
      .eq('student_id', invoice.student_id)
      .eq('is_paid', false)
      .neq('id', invoiceId),
  ])

  const outstandingBalance = (unpaid ?? []).reduce((sum: number, inv: { amount: string; amount_paid: string }) => {
    return sum + Math.max(0, parseFloat(inv.amount) - parseFloat(inv.amount_paid ?? '0'))
  }, 0)

  return Response.json({
    invoice: {
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      amount: parseFloat(invoice.amount),
      amountPaid: parseFloat(invoice.amount_paid ?? '0'),
      isPaid: invoice.is_paid,
      invoiceDate: invoice.invoice_date,
      dueDate: invoice.due_date ?? null,
      funderName: invoice.funder_name ?? '',
      funderEmail: invoice.funder_email ?? '',
      guardianEmail: invoice.guardian_email ?? '',
      notes: invoice.notes ?? '',
    },
    student: { name: student?.name ?? '' },
    session: session ? { lessonTitle: session.lesson_title, sessionDate: session.session_date } : null,
    settings: settings ? {
      businessName: settings.business_name,
      businessAddress: settings.business_address,
      businessPhone: settings.business_phone,
      businessEmail: settings.business_email,
      paymentTerms: settings.payment_terms,
      logoUrl: settings.logo_url ?? '',
      websiteUrl: settings.website_url ?? '',
    } : null,
    outstandingBalance,
  })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const supabase = getSupabase()

  const { data: invoice } = await supabase
    .from('invoices')
    .select('id')
    .eq('id', invoiceId)
    .eq('practitioner_id', userId)
    .single()
  if (!invoice) return Response.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const updates: Record<string, unknown> = {}
  if (body.amountPaid != null) updates.amount_paid = parseFloat(String(body.amountPaid))
  if (body.isPaid != null) updates.is_paid = Boolean(body.isPaid)
  if (body.notes != null) updates.notes = body.notes

  const { error } = await supabase.from('invoices').update(updates).eq('id', invoiceId)
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ ok: true })
}
