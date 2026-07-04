import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getPractitionerSubscription } from '@/lib/practitionerStore'
import { getSupabase } from '@/lib/supabase'
import Link from 'next/link'
import ExpensesManager from './ExpensesManager'

export const dynamic = 'force-dynamic'

export default async function FinancesPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const { userId } = await auth()
  if (!userId) redirect('/practitioner/get-started')

  const subscription = await getPractitionerSubscription(userId)
  if (!subscription?.isActive) redirect('/practitioner/subscribe')

  const { year: yearParam } = await searchParams
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear()
  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31`

  const supabase = getSupabase()

  const [{ data: allInvoices }, { data: expenses }, { data: mileageRaw }] = await Promise.all([
    supabase
      .from('invoices')
      .select('id, invoice_number, amount, amount_paid, extra_items, is_paid')
      .eq('practitioner_id', userId)
      .gte('invoice_date', startDate)
      .lte('invoice_date', endDate),
    supabase
      .from('expenses')
      .select('*')
      .eq('practitioner_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false }),
    supabase
      .from('mileage_log')
      .select('miles, trip_date, invoice_id')
      .eq('practitioner_id', userId)
      .gte('trip_date', startDate)
      .lte('trip_date', endDate)
      .order('trip_date', { ascending: false }),
  ])

  const invoiceTotal = (inv: { amount: unknown; extra_items: unknown }) => {
    const base = parseFloat(String(inv.amount)) || 0
    const extras = ((inv.extra_items ?? []) as Array<{ amount: number }>).reduce((s, e) => s + (e.amount || 0), 0)
    return base + extras
  }

  const paidInvoices = (allInvoices ?? []).filter(i => i.is_paid)
  const unpaidInvoices = (allInvoices ?? []).filter(i => !i.is_paid)

  const yearlyIncome = paidInvoices.reduce((sum, inv) => sum + invoiceTotal(inv), 0)
  const yearlyOutstanding = unpaidInvoices.reduce((sum, inv) => {
    const paid = parseFloat(String(inv.amount_paid)) || 0
    return sum + Math.max(0, invoiceTotal(inv) - paid)
  }, 0)

  const invoiceNumberMap: Record<string, string> = {}
  for (const inv of allInvoices ?? []) {
    if (inv.id && inv.invoice_number) invoiceNumberMap[inv.id] = String(inv.invoice_number)
  }

  type MileageRow = { miles: unknown; trip_date: string; invoice_id: string | null }
  const mileageEntries = (mileageRaw ?? []).map((m: MileageRow) => ({
    miles: parseFloat(String(m.miles)),
    trip_date: m.trip_date,
    invoice_number: m.invoice_id ? (invoiceNumberMap[m.invoice_id] ?? null) : null,
  }))

  const prevYear = year - 1
  const nextYear = year + 1
  const currentYear = new Date().getFullYear()

  return (
    <main className="min-h-screen px-6 py-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/practitioner/dashboard" className="text-sm text-blue-600 hover:underline">← Dashboard</Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Finances</h1>
        <div className="flex items-center gap-2 text-sm">
          <Link href={`/practitioner/finances?year=${prevYear}`} className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors">
            ← {prevYear}
          </Link>
          <span className="font-semibold text-gray-900 px-2">{year}</span>
          {year < currentYear && (
            <Link href={`/practitioner/finances?year=${nextYear}`} className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors">
              {nextYear} →
            </Link>
          )}
        </div>
      </div>

      <ExpensesManager
        initialExpenses={(expenses ?? []).map(e => ({
          id: e.id,
          date: e.date,
          category: e.category,
          description: e.description,
          amount: parseFloat(String(e.amount)),
          receipt_url: e.receipt_url ?? null,
          is_recurring: e.is_recurring ?? false,
          recurring_period: e.recurring_period ?? null,
        }))}
        mileageEntries={mileageEntries}
        yearlyIncome={yearlyIncome}
        yearlyOutstanding={yearlyOutstanding}
        year={year}
      />
    </main>
  )
}
