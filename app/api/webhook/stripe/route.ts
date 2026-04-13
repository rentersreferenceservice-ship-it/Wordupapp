import { NextRequest } from 'next/server'
import Stripe from 'stripe'
import { setSubscribed } from '@/lib/usageStore'

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

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
