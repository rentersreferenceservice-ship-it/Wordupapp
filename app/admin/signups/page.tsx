import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const ADMIN_USER_ID = 'user_3CDvdqpvQ2gtVYzPEzJZuleRX9p'

export default async function AdminSignupsPage() {
  const { userId } = await auth()
  if (!userId || userId !== ADMIN_USER_ID) redirect('/')

  const clerk = await clerkClient()
  const supabase = getSupabase()

  const [clerkResult, { data: practRows }, { data: leadRows }] = await Promise.all([
    clerk.users.getUserList({ limit: 200 }).catch(() => ({ data: [] })),
    supabase.from('practitioner_subscriptions').select('user_id, is_active, billing_period'),
    supabase.from('practitioner_leads').select('email, name, organization, role, created_at').order('created_at', { ascending: false }).catch(() => ({ data: [] })),
  ])

  const allUsers = (clerkResult.data ?? []).sort((a, b) => b.createdAt - a.createdAt)
  const practMap: Record<string, { is_active: boolean; billing_period: string }> = Object.fromEntries(
    (practRows ?? []).map(r => [r.user_id, r])
  )

  const rows = allUsers.map(u => {
    const email = u.emailAddresses[0]?.emailAddress ?? '—'
    const name = [u.firstName, u.lastName].filter(Boolean).join(' ') || '—'
    const pract = practMap[u.id]
    const joined = new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    let status = 'No subscription'
    if (pract?.is_active) status = `Active — ${pract.billing_period}`
    else if (pract) status = 'Inactive'
    return { id: u.id, name, email, joined, status, hasActive: pract?.is_active ?? false }
  })

  const activeCount = rows.filter(r => r.hasActive).length
  const noSub = rows.filter(r => r.status === 'No subscription')
  const inactive = rows.filter(r => r.status === 'Inactive')

  return (
    <main className="min-h-screen bg-white px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Signup Funnel</h1>
          <Link href="/admin/subscribers" className="text-sm text-blue-600 hover:underline">Subscribers →</Link>
        </div>

        <div className="flex flex-wrap gap-4 mb-8">
          {[
            { label: 'Total accounts', value: rows.length, bg: 'bg-blue-50', text: 'text-blue-700' },
            { label: 'Active subscribers', value: activeCount, bg: 'bg-green-50', text: 'text-green-700' },
            { label: 'Signed up, no sub', value: noSub.length, bg: 'bg-yellow-50', text: 'text-yellow-700' },
            { label: 'Inactive / cancelled', value: inactive.length, bg: 'bg-red-50', text: 'text-red-700' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl px-5 py-3 text-center min-w-[120px]`}>
              <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {noSub.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-bold text-yellow-700 uppercase tracking-wide mb-3">
              Signed up — no subscription ({noSub.length}) — follow up with these people
            </h2>
            <div className="rounded-xl border border-yellow-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-yellow-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-yellow-100">
                  {noSub.map(r => (
                    <tr key={r.id} className="hover:bg-yellow-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                      <td className="px-4 py-3 text-gray-700">{r.email}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{r.joined}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">All accounts ({rows.length})</h2>
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                    <td className="px-4 py-3 text-gray-700">{r.email}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{r.joined}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.hasActive ? 'bg-green-100 text-green-700' : r.status === 'Inactive' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {(leadRows ?? []).length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Access request form submissions ({(leadRows ?? []).length})</h2>
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Org</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(leadRows ?? []).map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                      <td className="px-4 py-3 text-gray-700">{r.email}</td>
                      <td className="px-4 py-3 text-gray-500">{r.organization}</td>
                      <td className="px-4 py-3 text-gray-500">{r.role}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
