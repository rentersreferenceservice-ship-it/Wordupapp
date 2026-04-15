import { NextRequest } from 'next/server'
import Stripe from 'stripe'
import { setSubscribed } from '@/lib/usageStore'
import { getSupabase } from '@/lib/supabase'

async function getConfig(key: string): Promise<string | null> {
  if (key === 'stripe_secret_key' && process.env.STRIPE_SECRET_KEY) return process.env.STRIPE_SECRET_KEY
  if (key === 'stripe_webhook_secret' && process.env.STRIPE_WEBHOOK_SECRET) return process.env.STRIPE_WEBHOOK_SECRET
  try {
    const supabase = getSupabase()
    const { data } = await supabase.from('config').select('value').eq('key', key).single()
    return data?.value ?? null
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const stripeKey = await getConfig('stripe_secret_key')
  const webhookSecret = await getConfig('stripe_webhook_secret')

  if (!stripeKey || !webhookSecret) {
    return new Response('Stripe not configured', { status: 500 })
  }

  const stripe = new Stripe(stripeKey)
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return new Response('Webhook Error', { status: 400 })
  }

  async function getClerkUserId(customerId: string): Promise<string | null> {
    try {
      const customer = await stripe.customers.retrieve(customerId)
      if (customer.deleted) return null
      return (customer as Stripe.Customer).metadata?.clerkUserId ?? null
    } catch {
      return null
    }
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const clerkUserId = session.metadata?.clerkUserId
      if (clerkUserId) {
        await setSubscribed(clerkUserId, true)
        console.log('Subscribed user:', clerkUserId)
      }
      break
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const clerkUserId = await getClerkUserId(sub.customer as string)
      if (clerkUserId) {
        const active = sub.status === 'active' || sub.status === 'trialing'
        await setSubscribed(clerkUserId, active)
      }
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const clerkUserId = await getClerkUserId(sub.customer as string)
      if (clerkUserId) {
        await setSubscribed(clerkUserId, false)
        console.log('Unsubscribed user:', clerkUserId)
      }
      break
    }
  }

  return new Response('OK', { status: 200 })
}
