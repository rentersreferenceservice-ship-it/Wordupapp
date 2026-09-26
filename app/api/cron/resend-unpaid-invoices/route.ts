import { NextRequest } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { sendConsolidatedReminderEmail } from '@/lib/invoiceEmail'

export const dynamic = 'force-dynamic'

// Runs on the 1st of each month (see vercel.json). Groups every invoice still
// marked unpaid by (practitioner, recipient) and sends ONE combined email per
// recipient — regardless of when the invoices were issued. The recipient is
// told about this policy on every invoice email, so a resend isn't a surprise.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = getSupabase()
  const { data: unpaidInvoices, error } = await supabase
    .from('invoices')
    .select('id, practitioner_id, funder_email, invoice_number')
    .eq('is_paid', false)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  type Group = { practitionerId: string; funderEmail: string; invoiceIds: string[] }
  const skipped: string[] = []
  const groups = new Map<string, Group>()

  for (const invoice of unpaidInvoices ?? []) {
    const funderEmail = invoice.funder_email?.trim()
    if (!funderEmail || !funderEmail.includes('@')) {
      skipped.push(invoice.invoice_number)
      continue
    }
    const key = `${invoice.practitioner_id}::${funderEmail}`
    const group: Group = groups.get(key) ?? { practitionerId: invoice.practitioner_id, funderEmail, invoiceIds: [] }
    group.invoiceIds.push(invoice.id)
    groups.set(key, group)
  }

  const results = []
  for (const group of groups.values()) {
    const result = await sendConsolidatedReminderEmail(group.practitionerId, group.funderEmail, group.invoiceIds)
    results.push({ funderEmail: group.funderEmail, invoiceCount: group.invoiceIds.length, ...result })
  }

  const failures = results.filter(r => 'error' in r)
  return Response.json({ ok: true, recipientsEmailed: results.length, failed: failures.length, skippedNoRecipient: skipped, results })
}
