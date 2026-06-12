import { auth } from '@clerk/nextjs/server'

const ADMIN_USER_ID = 'user_3CDvdqpvQ2gtVYzPEzJZuleRX9p'

export async function GET() {
  const { userId } = await auth()
  if (userId !== ADMIN_USER_ID) return Response.json({ error: 'Unauthorized' }, { status: 403 })
  return Response.json({
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasResendKey: !!process.env.RESEND_API_KEY,
    hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
    hasClerkSecret: !!process.env.CLERK_SECRET_KEY,
    hasStripeSecret: !!process.env.STRIPE_SECRET_KEY,
    hasBrowserlessKey: !!process.env.BROWSERLESS_API_KEY,
    nodeEnv: process.env.NODE_ENV,
  })
}
