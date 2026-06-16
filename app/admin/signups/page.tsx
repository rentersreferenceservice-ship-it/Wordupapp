import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const ADMIN_USER_ID = 'user_3CDvdqpvQ2gtVYzPEzJZuleRX9p'

export default async function AdminSignupsPage() {
  const { userId } = await auth()
  if (!userId || userId !== ADMIN_USER_ID) redirect('/')

  const supabase = getSupabase()

  const [{ data: practRows }, { data: leadRows }] = await Promise.all([
    supabase.from('practitioner_subscriptions').select('user_id, is_active, billing_period, created_at').order('created_at', { ascending: false }),
    supabase.from('practitioner_leads').select('name, email, organization, role, created_at').order('created_at', { ascending: false }),
  ])

  const active = (practRows ?? []).filter(r => r.is_active)
  const inactive = (practRows ?? []).filter(r => !r.is_active)

  // Look up Clerk profiles for all known user IDs
  const allUserIds = (practRows ?? []).map(r => r.user_id).filter(Boolean)
  const clerk = await clerkClient()
  const clerkUsers = allUserIds.length > 0
    ? await clerk.users.getUserList({ userId: allUserIds, limit: 100 }).then(r => r.data).catch(() => [])
    : []
  const clerkMap = Object.fromEntries(clerkUsers.map(u => [u.id, u]))

  return (
    <main className="min-h-screen bg-white px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Practitioner Signups</h1>

        <div className="flex gap-4 mb-8">
          <div className="bg-green-50 rounded-xl px-5 py-3 text-center">
            <p className="text-2xl font-bold text-green-700">{active.length}</p>
            <p className="text-xs text-gray-500">Active subscribers</p>
          </div>
          <div className="bg-red-50 rounded-xl px-5 py-3 text-center">
            <p className="text-2xl font-bold text-red-700">{inactive.length}</p>
            <p className="text-xs text-gray-500">Inactive / cancelled</p>
          </div>
          <div className="bg-blue-50 rounded-xl px-5 py-3 text-center">
            <p className="text-2xl font-bold text-blue-700">{(leadRows ?? []).length}</p>
            <p className="text-xs text-gray-500">Access requests</p>
          </div>
        </div>

        {active.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Active Practitioner Subscriptions</h2>
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3">Since</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {active.map(r => {
                    const u = clerkMap[r.user_id]
                    const name = u ? [u.firstName, u.lastName].filter(Boolean).join(' ') || '—' : '—'
                    const email = u ? (u.emailAddresses[0]?.emailAddress ?? '—') : '—'
                    return (
                      <tr key={r.user_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{name}</td>
                        <td className="px-4 py-3 text-gray-700">{email}</td>
                        <td className="px-4 py-3 text-gray-600">{r.billing_period ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{r.created_at ? new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {inactive.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Inactive / Cancelled</h2>
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {inactive.map(r => {
                    const u = clerkMap[r.user_id]
                    const name = u ? [u.firstName, u.lastName].filter(Boolean).join(' ') || '—' : '—'
                    const email = u ? (u.emailAddresses[0]?.emailAddress ?? '—') : '—'
                    return (
                      <tr key={r.user_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500">{name}</td>
                        <td className="px-4 py-3 text-gray-500">{email}</td>
                        <td className="px-4 py-3 text-gray-400">{r.billing_period ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{r.created_at ? new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(leadRows ?? []).length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Access Request Form Submissions</h2>
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

        {active.length === 0 && (leadRows ?? []).length === 0 && (
          <p className="text-gray-400 text-sm">No signups yet.</p>
        )}
      </div>
    </main>
  )
}
