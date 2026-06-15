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

  const [{ data: paidInvoices }, { data: expenses }, { data: mileageRaw }] = await Promise.all([
    supabase
      .from('invoices')
      .select('amount, amount_paid, extra_items')
      .eq('practitioner_id', userId)
      .eq('is_paid', true)
      .gte('invoice_date', startDate)
      .lte('invoice_date', endDate),
    supabase
      .from('expenses')
      .select('*')
      .eq('practitioner_id', userId)
      .order('date', { ascending: false }),
    supabase
      .from('mileage_log')
      .select('miles, trip_date, students(name)')
      .eq('practitioner_id', userId)
      .gte('trip_date', startDate)
      .lte('trip_date', endDate)
      .order('trip_date', { ascending: false }),
  ])

  const yearlyIncome = (paidInvoices ?? []).reduce((sum, inv) => {
    const base = parseFloat(String(inv.amount_paid)) || 0
    return sum + base
  }, 0)

  type MileageRow = { miles: unknown; trip_date: string; students: { name: string }[] | null }
  const mileageEntries = (mileageRaw ?? []).map((m: MileageRow) => ({
    miles: parseFloat(String(m.miles)),
    trip_date: m.trip_date,
    student_name: Array.isArray(m.students) ? (m.students[0]?.name ?? null) : null,
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
        year={year}
      />
    </main>
  )
}
