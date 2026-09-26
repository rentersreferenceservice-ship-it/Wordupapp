// Daily health check for the Practitioner Portal's Stripe <-> Supabase pipeline.
// Run locally (via Windows Task Scheduler) with: node scripts/subscription-health-check.mjs
// Only sends an email when something looks wrong; silent on a clean run.
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '..', '.env.local')
const statePath = join(__dirname, '.health-check-state.json')

const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    })
)

const stripe = new Stripe(env.STRIPE_SECRET_KEY)
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const problems = []

// Check A: did Stripe have subscription/checkout activity in the last 24h that
// never shows up as a recent write in our database? That's the webhook-silently-
// failing pattern we found today. (Doesn't require knowing the webhook secret,
// which drifts out of sync with production every time it's rolled.)
const since = Math.floor(Date.now() / 1000) - 24 * 60 * 60
const recentEvents = await stripe.events.list({
  created: { gte: since },
  types: ['checkout.session.completed', 'customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted'],
  limit: 100,
})

if (recentEvents.data.length > 0) {
  const { data: recentRows } = await supabase
    .from('practitioner_subscriptions')
    .select('user_id, created_at')
    .gte('created_at', new Date(since * 1000).toISOString())

  if (!recentRows || recentRows.length === 0) {
    problems.push(
      `Stripe had ${recentEvents.data.length} subscription-related event(s) in the last 24h, but the database has zero new/updated practitioner_subscriptions rows in that window. The webhook may be failing again (this is exactly what broke in July/August).`
    )
  }
}

// Check B: any customer with more than one active/trialing subscription at once
// (accidental double-billing, like the tpipho@hotmail.com case found on 2026-09-26).
const allSubs = await stripe.subscriptions.list({ status: 'all', limit: 100 })
const liveByCustomer = new Map()
for (const s of allSubs.data) {
  if (s.status === 'active' || s.status === 'trialing') {
    const list = liveByCustomer.get(s.customer) ?? []
    list.push(s.id)
    liveByCustomer.set(s.customer, list)
  }
}
for (const [customerId, subIds] of liveByCustomer) {
  if (subIds.length > 1) {
    const customer = await stripe.customers.retrieve(customerId)
    const email = customer.deleted ? customerId : customer.email
    problems.push(`Customer ${email} has ${subIds.length} active/trialing subscriptions at once (possible double billing): ${subIds.join(', ')}`)
  }
}

// Check C: growing drift between Stripe's live subscriber count and our database's.
const stripeActiveCustomers = liveByCustomer.size
const { data: dbActiveRows } = await supabase
  .from('practitioner_subscriptions')
  .select('user_id')
  .eq('is_active', true)
const dbActiveCount = dbActiveRows?.length ?? 0

if (stripeActiveCustomers > dbActiveCount) {
  problems.push(
    `Stripe shows ${stripeActiveCustomers} customers with an active/trialing subscription, but the database only has ${dbActiveCount} active rows. The database may be missing real subscribers.`
  )
}

console.log(new Date().toISOString(), '- health check ran.', problems.length === 0 ? 'All clear.' : `${problems.length} issue(s) found.`)

// Only email about problems not already seen in the previous run — avoids
// nagging daily about something already known and deliberately deferred
// (e.g. waiting on a customer to reach out about a double subscription).
const previouslySeen = existsSync(statePath) ? JSON.parse(readFileSync(statePath, 'utf8')) : []
const newProblems = problems.filter(p => !previouslySeen.includes(p))

if (newProblems.length > 0) {
  const resend = new Resend(env.RESEND_API_KEY)
  await resend.emails.send({
    from: 'Word Up Alerts <onboarding@resend.dev>',
    to: 'Wordups2c@gmail.com',
    subject: `Practitioner Portal health check: ${newProblems.length} new issue(s)`,
    html: `
      <h2>Subscription pipeline health check</h2>
      <p>Run at ${new Date().toLocaleString('en-US')}</p>
      <ul>${newProblems.map(p => `<li>${p}</li>`).join('')}</ul>
      ${problems.length > newProblems.length ? `<p><em>${problems.length - newProblems.length} previously-reported issue(s) still open but not repeated here.</em></p>` : ''}
    `,
  })
  console.log('Alert email sent for', newProblems.length, 'new issue(s).')
}

writeFileSync(statePath, JSON.stringify(problems, null, 2))
