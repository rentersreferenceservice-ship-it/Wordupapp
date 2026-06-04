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

  const clerk = await clerkClient()
  const subscribers = await Promise.all(
    (rows ?? []).map(async row => {
      try {
        const u = await clerk.users.getUser(row.user_id)
        return {
          userId: row.user_id,
          name: [u.firstName, u.lastName].filter(Boolean).join(' ') || '—',
          email: u.emailAddresses[0]?.emailAddress ?? '—',
          stripeCustomerId: row.stripe_customer_id ?? null,
          updatedAt: (row.updated_at ?? row.created_at ?? null) as string | null,
        }
      } catch {
        return {
          userId: row.user_id,
          name: '(unknown)',
          email: '—',
          stripeCustomerId: row.stripe_customer_id ?? null,
          updatedAt: (row.updated_at ?? row.created_at ?? null) as string | null,
        }
      }
    })
  )

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
                  <th className="px-5 py-3">Stripe ID</th>
                  <th className="px-5 py-3">Subscribed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subscribers.map(sub => (
                  <tr key={sub.userId} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{sub.name}</td>
                    <td className="px-5 py-3 text-gray-700">{sub.email}</td>
                    <td className="px-5 py-3 text-gray-500 font-mono text-xs">
                      {sub.stripeCustomerId ? (
                        <a
                          href={`https://dashboard.stripe.com/customers/${sub.stripeCustomerId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {sub.stripeCustomerId}
                        </a>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {sub.updatedAt
                        ? new Date(sub.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '—'}
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
