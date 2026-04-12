import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: 'Not logged in' }, { status: 401 })
  }

  const { origin } = await req.json()

  // Create a Stripe checkout session with clerkUserId in metadata
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          recurring: { interval: 'month' },
          product_data: { name: 'Word Up Lesson Generator' },
          unit_amount: 999, // $9.99
        },
        quantity: 1,
      },
    ],
    metadata: { clerkUserId: userId },
    success_url: `${origin}/subscribe/success`,
    cancel_url: `${origin}/`,
  })

  return Response.json({ url: session.url })
}
