import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Stripe from 'stripe'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

async function getStripeKey(): Promise<string | null> {
  if (process.env.STRIPE_SECRET_KEY) return process.env.STRIPE_SECRET_KEY
  try {
    const supabase = getSupabase()
    const { data } = await supabase.from('config').select('value').eq('key', 'stripe_secret_key').single()
    return data?.value ?? null
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const stripeKey = await getStripeKey()
  if (!stripeKey) return Response.json({ error: 'Stripe not configured' }, { status: 500 })

  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const stripe = new Stripe(stripeKey)
  const { origin } = await req.json()

  // Find the Stripe customer by searching subscriptions for this Clerk user
  let customerId: string | null = null

  // First check user_usage table for a stored customer ID
  try {
    const supabase = getSupabase()
    const { data } = await supabase
      .from('user_usage')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single()
    if (data?.stripe_customer_id) customerId = data.stripe_customer_id
  } catch { /* not stored yet */ }

  // Fall back to searching Stripe subscriptions by metadata
  if (!customerId) {
    try {
      const results = await stripe.subscriptions.search({
        query: `metadata['clerkUserId']:'${userId}'`,
        limit: 1,
      })
      if (results.data.length > 0) {
        customerId = results.data[0].customer as string
      }
    } catch { /* search not available on all plans */ }
  }

  // Also check checkout sessions if still not found
  if (!customerId) {
    try {
      const sessions = await stripe.checkout.sessions.list({
        limit: 100,
      })
      const match = sessions.data.find(s => s.metadata?.clerkUserId === userId && s.customer)
      if (match) customerId = match.customer as string
    } catch { /* best effort */ }
  }

  if (!customerId) {
    return Response.json({ error: 'No active subscription found.' }, { status: 404 })
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: origin,
  })

  return Response.json({ url: portalSession.url })
}
