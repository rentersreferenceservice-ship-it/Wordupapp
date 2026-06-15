import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Stripe from 'stripe'
import { getSupabase } from '@/lib/supabase'
import { PLAN_PRICE, BillingPeriod } from '@/lib/practitionerStore'

export const dynamic = 'force-dynamic'

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

  const { billing, origin } = await req.json()
  if (!billing) return Response.json({ error: 'Missing billing period' }, { status: 400 })

  const billingPeriod = billing as BillingPeriod
  const unitAmount = billingPeriod === 'annual' ? PLAN_PRICE.annual : PLAN_PRICE.monthly
  const interval = billingPeriod === 'annual' ? 'year' : 'month'

  const stripe = new Stripe(stripeKey)
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        recurring: { interval },
        product_data: { name: 'Word Up S2C — Practitioner Portal' },
        unit_amount: unitAmount,
      },
      quantity: 1,
    }],
    subscription_data: { trial_period_days: 30 },
    metadata: { clerkUserId: userId, practitionerTier: 'standard', billingPeriod: billing },
    success_url: `${origin}/practitioner/welcome`,
    cancel_url: `${origin}/practitioner/subscribe`,
  })

  return Response.json({ url: session.url })
}
