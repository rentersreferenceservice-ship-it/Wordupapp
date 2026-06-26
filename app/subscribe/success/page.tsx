import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { setSubscribed } from '@/lib/usageStore'

export const dynamic = 'force-dynamic'

async function activateFromSession(sessionId: string | null) {
  if (!sessionId) return
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) return
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(stripeKey)
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.payment_status === 'paid' || session.status === 'complete') {
      const clerkUserId = session.metadata?.clerkUserId
      if (clerkUserId) await setSubscribed(clerkUserId, true)
    }
  } catch {
    // non-fatal — webhook will handle it
  }
}

export default async function SubscribeSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id } = await searchParams

  // Activate immediately from the Stripe session as a backup to the webhook
  await activateFromSession(session_id ?? null)

  // Also activate from the logged-in user directly
  try {
    const { userId } = await auth()
    if (userId) await setSubscribed(userId, true)
  } catch {
    // guest or auth error — webhook will cover it
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re all set!</h1>
        <p className="text-gray-600 mb-6">
          Welcome to Word Up. Generate and print as many lessons as you need — your subscription is active now.
        </p>
        <Link
          href="/"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors inline-block"
        >
          Start Generating Lessons
        </Link>
      </div>
    </main>
  )
}
