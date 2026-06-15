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
    clerk.users.getUserList({ limit: 200, orderBy: '-created_at' }),
    supabase.from('practitioner_subscriptions').select('user_id, is_active, billing_period, created_at'),
    supabase.from('practitioner_leads').select('email, name, organization, role, created_at').order('created_at', { ascending: false }),
  ])

  const allUsers = clerkResult.data ?? []
  const practMap = Object.fromEntries((practRows ?? []).map((r: { user_id: string; is_active: boolean; billing_period: string }) => [r.user_id, r]))

  const rows = allUsers.map(u => {
    const email = u.emailAddresses[0]?.emailAddress ?? '—'
    const name = [u.firstName, u.lastName].filter(Boolean).join(' ') || '—'
    const pract = practMap[u.id]
    const joined = new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    let status = 'No subscription'
    if (pract?.is_active) status = `Active — ${pract.billing_period}`
    else if (pract) status = 'Inactive subscription'
    return { id: u.id, name, email, joined, status, hasActive: pract?.is_active ?? false }
  })

  const activeCount = rows.filter(r => r.hasActive).length
  const signedUpNoSub = rows.filter(r => r.status === 'No subscription')
  const inactiveSub = rows.filter(r => r.status === 'Inactive subscription')

  return (
    <main className="min-h-screen bg-white px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-2">
          <h1 className="text-2xl font-bold text-gray-900">Signup Funnel</h1>
          <Link href="/admin/subscribers" className="text-sm text-blue-600 hover:underline">View Subscribers →</Link>
        </div>
        <div className="flex gap-6 mb-8 text-sm">
          <div className="bg-blue-50 rounded-xl px-4 py-3 text-center">
            <p className="text-2xl font-bold text-blue-700">{rows.length}</p>
            <p className="text-xs text-gray-500">Total Clerk accounts</p>
          </div>
          <div className="bg-green-50 rounded-xl px-4 py-3 text-center">
            <p className="text-2xl font-bold text-green-700">{activeCount}</p>
            <p className="text-xs text-gray-500">Active subscribers</p>
          </div>
          <div className="bg-yellow-50 rounded-xl px-4 py-3 text-center">
            <p className="text-2xl font-bold text-yellow-700">{signedUpNoSub.length}</p>
            <p className="text-xs text-gray-500">Signed up, no subscription</p>
          </div>
          <div className="bg-red-50 rounded-xl px-4 py-3 text-center">
            <p className="text-2xl font-bold text-red-700">{inactiveSub.length}</p>
            <p className="text-xs text-gray-500">Inactive / cancelled</p>
          </div>
        </div>

        {/* People who signed up but never subscribed — highest priority to follow up */}
        {signedUpNoSub.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-bold text-yellow-700 uppercase tracking-wide mb-3">Signed up — no subscription ({signedUpNoSub.length})</h2>
            <div className="bg-white rounded-xl border border-yellow-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-yellow-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-yellow-100">
                  {signedUpNoSub.map(r => (
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

        {/* All accounts */}
        <div className="mb-8">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">All Clerk accounts</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.hasActive ? 'bg-green-100 text-green-700' : r.status === 'Inactive subscription' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lead form submissions */}
        {(leadRows ?? []).length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Access request form submissions ({leadRows!.length})</h2>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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
                  {(leadRows ?? []).map((r: { email: string; name: string; organization: string; role: string; created_at: string }, i: number) => (
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
