import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const number = new URL(req.url).searchParams.get('number')
  if (!number) return Response.json({ error: 'number required' }, { status: 400 })

  const supabase = getSupabase()
  const { data: invoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('practitioner_id', userId)
    .eq('invoice_number', parseInt(number, 10))
    .single()

  if (!invoice) return Response.json({ error: 'Not found' }, { status: 404 })

  const { data: student } = await supabase
    .from('students').select('name').eq('id', invoice.student_id).single()

  const extraItems = (invoice.extra_items ?? []) as Array<{ description: string; amount: number }>
  const extraTotal = extraItems.reduce((sum: number, item) => sum + (item.amount || 0), 0)

  return Response.json({
    id: invoice.id,
    invoiceNumber: invoice.invoice_number,
    studentName: student?.name ?? '',
    amount: parseFloat(invoice.amount),
    extraTotal,
    amountPaid: parseFloat(invoice.amount_paid ?? '0'),
    isPaid: invoice.is_paid,
    invoiceDate: invoice.invoice_date,
    dueDate: invoice.due_date ?? null,
    funderName: invoice.funder_name ?? '',
    notes: invoice.notes ?? '',
  })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const { sessionId, amount: amountOverride, studentId: studentIdInput, description, asSessionFee } = await req.json()
  if (!sessionId && !studentIdInput) {
    return Response.json({ error: 'sessionId or studentId required' }, { status: 400 })
  }

  const supabase = getSupabase()

  let session: { student_id: string; session_date?: string } | null = null
  let studentId: string = studentIdInput

  if (sessionId) {
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('practitioner_id', userId)
      .single()
    if (!data) return Response.json({ error: 'Session not found' }, { status: 404 })
    session = data
    studentId = data.student_id
  }

  const [{ data: student }, { data: settings }] = await Promise.all([
    supabase.from('students').select('name, guardian_email, funder_name, funder_email, session_rate, default_mileage').eq('id', studentId).eq('practitioner_id', userId).single(),
    supabase.from('practitioner_settings').select('*').eq('practitioner_id', userId).single(),
  ])
  if (!student) return Response.json({ error: 'Student not found' }, { status: 404 })

  const invoiceNumber = settings?.next_invoice_number ?? 101

  // Session-based invoices (and standalone invoices explicitly billed as a
  // session fee, e.g. from No Lesson Session) charge the base session-fee
  // line item; other standalone invoices instead charge a single named
  // extra-item line, since there's no session fee to attach the amount to.
  let amount: number
  let extraItems: Array<{ description: string; amount: number }> = []
  if (session || asSessionFee) {
    amount = amountOverride != null
      ? parseFloat(String(amountOverride))
      : (student?.session_rate != null ? parseFloat(String(student.session_rate)) : parseFloat(String(settings?.session_rate ?? 0)))
  } else {
    amount = 0
    extraItems = [{ description: description?.trim() || 'Charge', amount: parseFloat(String(amountOverride ?? 0)) }]
  }

  const today = new Date()
  const invoiceDate = today.toISOString().split('T')[0]
  // Due upon receipt — due date matches the invoice date.
  const dueDateStr = invoiceDate

  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      practitioner_id: userId,
      student_id: studentId,
      session_id: sessionId ?? null,
      invoice_number: invoiceNumber,
      amount,
      extra_items: extraItems,
      amount_paid: 0,
      is_paid: false,
      invoice_date: invoiceDate,
      due_date: dueDateStr,
      funder_name: student?.funder_name ?? null,
      funder_email: student?.funder_email ?? null,
      guardian_email: student?.guardian_email ?? null,
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  if (session) {
    // Update SESSION_INVOICE record in session_responses so transcript "View Invoice" link stays current
    await supabase.from('session_responses')
      .delete()
      .eq('session_id', sessionId)
      .eq('question_type', 'SESSION_INVOICE')
    await supabase.from('session_responses').insert({
      session_id: sessionId,
      hunk_number: -1,
      question_type: 'SESSION_INVOICE',
      question_text: 'Invoice',
      captured_answer: `/practitioner/invoice/${invoice.id}`,
    })

    // Auto-log mileage if student has a default trip mileage set
    if (student?.default_mileage) {
      await supabase.from('mileage_log').insert({
        practitioner_id: userId,
        student_id: studentId,
        invoice_id: invoice.id,
        miles: parseFloat(String(student.default_mileage)),
        trip_date: session.session_date ?? invoiceDate,
      })
    }
  }

  // Increment invoice number
  await supabase.from('practitioner_settings').upsert({
    practitioner_id: userId,
    next_invoice_number: invoiceNumber + 1,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'practitioner_id' })

  return Response.json({ invoiceId: invoice.id })
}
