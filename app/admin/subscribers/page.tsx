import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const ADMIN_USER_ID = 'user_3CDvdqpvQ2gtVYzPEzJZuleRX9p'

export default async function AdminSubscribersPage() {
  const { userId } = await auth()
  if (!userId || userId !== ADMIN_USER_ID) redirect('/')

  const supabase = getSupabase()

  const [{ data: usageRows }, { data: practRows }] = await Promise.all([
    supabase.from('user_usage').select('*').eq('is_subscribed', true),
    supabase.from('practitioner_subscriptions').select('*').eq('is_active', true),
  ])

  const practUserIds = (practRows ?? []).map((r: { user_id: string }) => r.user_id)
  const usageUserIds = (usageRows ?? []).map((r: { user_id: string }) => r.user_id)
  const allUserIds = [...new Set([...practUserIds, ...usageUserIds])]

  const clerk = await clerkClient()
  const clerkUsers = allUserIds.length > 0
    ? await clerk.users.getUserList({ userId: allUserIds, limit: 200 }).then(r => r.data).catch(() => [])
    : []

  const clerkMap = Object.fromEntries(clerkUsers.map(u => [u.id, u]))
  const usageMap = Object.fromEntries((usageRows ?? []).map((r: { user_id: string; lessons_this_month: number | null; stripe_customer_id: string | null }) => [r.user_id, r]))

  const practitioners = (practRows ?? []).map((row: { user_id: string; billing_period: string; created_at: string }) => {
    const u = clerkMap[row.user_id]
    const usage = usageMap[row.user_id]
    return {
      userId: row.user_id,
      type: 'Practitioner',
      name: u ? ([u.firstName, u.lastName].filter(Boolean).join(' ') || '—') : '—',
      email: u ? (u.emailAddresses[0]?.emailAddress ?? '—') : '—',
      detail: row.billing_period ?? '—',
      stripeCustomerId: usage?.stripe_customer_id ?? null,
      joinedAt: u?.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—',
    }
  })

  const familySubscribers = (usageRows ?? [])
    .filter((r: { user_id: string }) => !practUserIds.includes(r.user_id))
    .map((row: { user_id: string; lessons_this_month: number | null; stripe_customer_id: string | null }) => {
      const u = clerkMap[row.user_id]
      return {
        userId: row.user_id,
        type: 'Family',
        name: u ? ([u.firstName, u.lastName].filter(Boolean).join(' ') || '—') : '—',
        email: u ? (u.emailAddresses[0]?.emailAddress ?? '—') : '—',
        detail: `${row.lessons_this_month ?? 0} lessons`,
        stripeCustomerId: row.stripe_customer_id ?? null,
        joinedAt: u?.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—',
      }
    })

  const subscribers = [...practitioners, ...familySubscribers]

  return (
    <main className="min-h-screen bg-white px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Subscribers</h1>
        <p className="text-sm text-gray-500 mb-1">{practitioners.length} practitioner{practitioners.length !== 1 ? 's' : ''} · {familySubscribers.length} family subscriber{familySubscribers.length !== 1 ? 's' : ''}</p>
        <p className="text-xs text-gray-400 mb-6">{subscribers.length} total active</p>

        {subscribers.length === 0 ? (
          <p className="text-gray-500 text-sm">No active subscribers found.</p>
        ) : (
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Detail</th>
                  <th className="px-5 py-3">Joined</th>
                  <th className="px-5 py-3">Stripe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subscribers.map(sub => (
                  <tr key={sub.userId} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{sub.name}</td>
                    <td className="px-5 py-3 text-gray-700">{sub.email}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${sub.type === 'Practitioner' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {sub.type}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{sub.detail}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{sub.joinedAt}</td>
                    <td className="px-5 py-3 text-gray-500 font-mono text-xs">
                      {sub.stripeCustomerId ? (
                        <a
                          href={`https://dashboard.stripe.com/customers/${sub.stripeCustomerId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {sub.stripeCustomerId.slice(0, 14)}…
                        </a>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
