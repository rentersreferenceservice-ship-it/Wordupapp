import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const ADMIN_USER_ID = 'user_3CDvdqpvQ2gtVYzPEzJZuleRX9p'

export default async function AdminSubscribersPage() {
  const { userId } = await auth()
  if (!userId || userId !== ADMIN_USER_ID) redirect('/')

  const supabase = getSupabase()

  const { data: rows } = await supabase
    .from('user_usage')
    .select('*')
    .eq('is_subscribed', true)

  const userIds = (rows ?? []).map(r => r.user_id)
  const clerk = await clerkClient()

  const clerkUsers = userIds.length > 0
    ? await clerk.users.getUserList({ userId: userIds, limit: 100 }).then(r => r.data).catch(() => [])
    : []

  const clerkMap = Object.fromEntries(clerkUsers.map(u => [u.id, u]))

  const subscribers = (rows ?? []).map(row => {
    const u = clerkMap[row.user_id]
    return {
      userId: row.user_id,
      name: u ? ([u.firstName, u.lastName].filter(Boolean).join(' ') || '—') : '—',
      email: u ? (u.emailAddresses[0]?.emailAddress ?? '—') : '—',
      lessonsThisMonth: row.lessons_this_month ?? 0,
      stripeCustomerId: row.stripe_customer_id ?? null,
    }
  })

  return (
    <main className="min-h-screen bg-white px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Subscribers</h1>
        <p className="text-sm text-gray-500 mb-6">{subscribers.length} active subscriber{subscribers.length !== 1 ? 's' : ''}</p>

        {subscribers.length === 0 ? (
          <p className="text-gray-500 text-sm">No active subscribers found.</p>
        ) : (
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Lessons</th>
                  <th className="px-5 py-3">Stripe ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subscribers.map(sub => (
                  <tr key={sub.userId} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{sub.name}</td>
                    <td className="px-5 py-3 text-gray-700">{sub.email}</td>
                    <td className="px-5 py-3 text-gray-500">{sub.lessonsThisMonth}</td>
                    <td className="px-5 py-3 text-gray-500 font-mono text-xs">
                      {sub.stripeCustomerId ? (
                        <a href={`https://dashboard.stripe.com/customers/${sub.stripeCustomerId}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {sub.stripeCustomerId}
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
