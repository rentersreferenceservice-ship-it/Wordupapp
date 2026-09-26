import { NextRequest } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { sendInvoiceEmail } from '@/lib/invoiceEmail'

export const dynamic = 'force-dynamic'

// Runs on the 1st of each month (see vercel.json). Resends any invoice still
// marked unpaid, regardless of when it was issued — the recipient is told
// about this policy on every invoice email, so a resend isn't a surprise.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = getSupabase()
  const { data: unpaidInvoices, error } = await supabase
    .from('invoices')
    .select('id, practitioner_id, invoice_number')
    .eq('is_paid', false)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const results = []
  for (const invoice of unpaidInvoices ?? []) {
    const result = await sendInvoiceEmail(invoice.id, invoice.practitioner_id)
    results.push({ invoiceNumber: invoice.invoice_number, ...result })
  }

  const failures = results.filter(r => 'error' in r)
  return Response.json({ ok: true, total: results.length, failed: failures.length, results })
}
