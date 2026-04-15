export async function GET() {
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
