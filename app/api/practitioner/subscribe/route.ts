import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Stripe from 'stripe'
import { getSupabase } from '@/lib/supabase'
import { TIER_PRICES, PractitionerTier } from '@/lib/practitionerStore'

export const dynamic = 'force-dynamic'

const TIER_NAMES: Record<PractitionerTier, string> = {
  starter: 'Practitioner Starter — Up to 10 Students',
  growing: 'Practitioner Growing — Up to 25 Students',
  established: 'Practitioner Established — Up to 50 Students',
  agency: 'Practitioner Agency — Up to 100 Students',
}

async function getStripeKey(): Promise<string | null> {
  if (process.env.STRIPE_SECRET_KEY) return process.env.STRIPE_SECRET_KEY
  try {
    const { data } = await getSupabase().from('config').select('value').eq('key', 'stripe_secret_key').single()
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

  const { tier, billing, origin } = await req.json()
  if (!tier || !billing) return Response.json({ error: 'Missing tier or billing' }, { status: 400 })

  const prices = TIER_PRICES[tier as PractitionerTier]
  if (!prices) return Response.json({ error: 'Invalid tier' }, { status: 400 })

  const stripe = new Stripe(stripeKey)
  const unitAmount = billing === 'annual' ? prices.annual : prices.monthly
  const interval = billing === 'annual' ? 'year' : 'month'

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        recurring: { interval },
        product_data: { name: TIER_NAMES[tier as PractitionerTier] },
        unit_amount: unitAmount,
      },
      quantity: 1,
    }],
    subscription_data: { trial_period_days: 5 },
    metadata: { clerkUserId: userId, practitionerTier: tier, billingPeriod: billing },
    success_url: `${origin}/practitioner/dashboard`,
    cancel_url: `${origin}/practitioner/pricing`,
  })

  return Response.json({ url: session.url })
}
