import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import Link from 'next/link'
import InvoiceActions from './InvoiceActions'

export const dynamic = 'force-dynamic'

function fmt(n: number) {
  return `$${n.toFixed(2)}`
}

export default async function InvoicePage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await params
  const { userId } = await auth()
  if (!userId) redirect('/practitioner/get-started')

  const supabase = getSupabase()

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .eq('practitioner_id', userId)
    .single()
  if (!invoice) notFound()

  const [{ data: student }, { data: session }, { data: settings }, { data: unpaid }] = await Promise.all([
    supabase.from('students').select('name').eq('id', invoice.student_id).single(),
    invoice.session_id
      ? supabase.from('sessions').select('lesson_title, session_date, id').eq('id', invoice.session_id).single()
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

  const amount = parseFloat(invoice.amount)
  const amountPaid = parseFloat(invoice.amount_paid ?? '0')
  const balanceDue = Math.max(0, amount - amountPaid)
  const totalDue = balanceDue + outstandingBalance

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const isOverdue = !invoice.is_paid && invoice.due_date && new Date(invoice.due_date + 'T00:00:00') < today

  const invoiceDate = new Date(invoice.invoice_date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const sessionDate = session?.session_date
    ? new Date(session.session_date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  return (
    <div className="min-h-screen bg-white px-4 py-8">
      {/* Nav — hidden on print */}
      <div className="print:hidden flex gap-3 max-w-2xl mx-auto mb-6">
        {session?.id && (
          <Link href={`/practitioner/transcript/${session.id}`} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
            ← Transcript
          </Link>
        )}
        {!session?.id && (
          <Link href="/practitioner/dashboard" className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
            ← Dashboard
          </Link>
        )}
        <span className={`px-3 py-2 rounded-lg text-xs font-semibold ${invoice.is_paid ? 'bg-green-100 text-green-700' : isOverdue ? 'bg-red-600 text-white' : amountPaid > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'}`}>
          {invoice.is_paid ? 'Paid' : isOverdue ? 'Overdue' : amountPaid > 0 ? 'Partially Paid' : 'Unpaid'}
        </span>
      </div>

      {/* Invoice document */}
      <article className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 print:rounded-none print:shadow-none print:border-0 print:p-0" style={{ fontFamily: 'Arial, sans-serif' }}>

        {/* Header */}
        <div className="flex items-start justify-between mb-6 pb-6 border-b-2 border-gray-900">
          <div>
            {settings?.logo_url && (
              <img src={settings.logo_url} alt="Logo" className="h-12 object-contain mb-2" />
            )}
            <div className="text-xl font-bold text-gray-900">INVOICE</div>
            {settings?.business_name && <div className="text-sm text-gray-700 mt-1 font-semibold">{settings.business_name}</div>}
            {settings?.business_address && <div className="text-xs text-gray-500 whitespace-pre-line">{settings.business_address}</div>}
            {settings?.business_phone && <div className="text-xs text-gray-500">{settings.business_phone}</div>}
            {settings?.business_email && <div className="text-xs text-gray-500">{settings.business_email}</div>}
            {settings?.website_url && <div className="text-xs text-blue-600">{settings.website_url}</div>}
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Invoice #<span className="font-bold text-gray-900">{invoice.invoice_number}</span></div>
            <div className="text-sm text-gray-500 mt-1">Date: <span className="text-gray-800">{invoiceDate}</span></div>
            <div className="text-sm text-gray-500 mt-1">Terms: <span className="text-gray-800">{settings?.payment_terms ?? 'Due upon receipt'}</span></div>
          </div>
        </div>

        {/* Bill To / Student */}
        <div className="flex gap-12 mb-8">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Bill To</p>
            {invoice.funder_name && <p className="text-sm font-semibold text-gray-900">{invoice.funder_name}</p>}
            {invoice.funder_email && <p className="text-xs text-gray-500">{invoice.funder_email}</p>}
            {invoice.guardian_email && <p className="text-xs text-gray-400">CC: {invoice.guardian_email}</p>}
            {!invoice.funder_name && !invoice.funder_email && <p className="text-xs text-gray-300 italic">No billing info on file</p>}
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Student</p>
            <p className="text-sm font-semibold text-gray-900">{student?.name ?? ''}</p>
            {sessionDate && <p className="text-xs text-gray-500">Session: {sessionDate}</p>}
          </div>
        </div>

        {/* Line items */}
        <table className="w-full mb-2" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wide px-4 py-2">Description</th>
              <th className="text-right text-xs font-bold text-gray-500 uppercase tracking-wide px-4 py-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="px-4 py-3 text-sm text-gray-800">
                S2C Session{session?.lesson_title ? ` — ${session.lesson_title}` : ''}
                {sessionDate && <span className="text-gray-400 text-xs ml-2">({sessionDate})</span>}
              </td>
              <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{fmt(amount)}</td>
            </tr>
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-6">
          <div className="w-64">
            {amountPaid > 0 && (
              <div className="flex justify-between text-sm text-gray-500 py-1.5 border-b border-gray-100">
                <span>Amount Paid</span>
                <span className="text-green-600 font-semibold">−{fmt(amountPaid)}</span>
              </div>
            )}
            {outstandingBalance > 0 && (
              <div className="flex justify-between text-sm text-gray-500 py-1.5 border-b border-gray-100">
                <span>Prior Balance Due</span>
                <span className="font-semibold text-orange-600">{fmt(outstandingBalance)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-white bg-blue-800 rounded-lg px-4 py-2.5 mt-1 text-sm">
              <span>Total Due</span>
              <span>{fmt(totalDue)}</span>
            </div>
          </div>
        </div>

        {/* Payment terms note */}
        {settings?.payment_terms && (
          <p className="text-xs text-gray-400 border-t border-gray-100 pt-4">
            Payment terms: {settings.payment_terms}
          </p>
        )}

        <p className="text-xs text-gray-300 mt-2">Generated by Word Up S2C · worduplessongenerator.com</p>
      </article>

      {/* Interactive controls (hidden on print) */}
      <div className="max-w-2xl mx-auto">
        <InvoiceActions
          invoiceId={invoiceId}
          initialAmountPaid={amountPaid}
          initialIsPaid={invoice.is_paid}
          amount={amount}
          funderName={invoice.funder_name ?? ''}
          funderEmail={invoice.funder_email ?? ''}
          guardianEmail={invoice.guardian_email ?? ''}
        />
      </div>
    </div>
  )
}
