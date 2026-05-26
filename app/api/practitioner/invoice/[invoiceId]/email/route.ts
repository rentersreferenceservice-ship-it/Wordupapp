import { NextRequest } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const supabase = getSupabase()

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .eq('practitioner_id', userId)
    .single()
  if (!invoice) return Response.json({ error: 'Not found' }, { status: 404 })

  const [{ data: student }, { data: session }, { data: settings }] = await Promise.all([
    supabase.from('students').select('name').eq('id', invoice.student_id).single(),
    invoice.session_id
      ? supabase.from('sessions').select('lesson_title, session_date').eq('id', invoice.session_id).single()
      : Promise.resolve({ data: null }),
    supabase.from('practitioner_settings').select('*').eq('practitioner_id', userId).single(),
  ])

  const clerk = await clerkClient()
  const user = await clerk.users.getUser(userId)
  const practitionerEmail = user.emailAddresses[0]?.emailAddress ?? ''
  const practitionerName = [user.firstName, user.lastName].filter(Boolean).join(' ') || practitionerEmail

  const body = await req.json()
  const funderEmail: string = body.funderEmail || invoice.funder_email || ''
  const guardianEmail: string = body.guardianEmail || invoice.guardian_email || ''

  const to: string[] = [funderEmail].filter(e => e && e.includes('@'))
  if (to.length === 0) return Response.json({ error: 'No valid recipient email' }, { status: 400 })

  const cc: string[] = [guardianEmail].filter(e => e && e.includes('@'))

  const amount = parseFloat(invoice.amount)
  const amountPaid = parseFloat(invoice.amount_paid ?? '0')
  const invoiceDate = new Date(invoice.invoice_date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const sessionDate = session?.session_date
    ? new Date(session.session_date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  const fmt = (n: number) => `$${n.toFixed(2)}`

  const html = `
<div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;color:#1f2937;background:#f9fafb;padding:24px;border-radius:12px">
  <div style="background:white;border-radius:10px;padding:28px;border:1px solid #e5e7eb">

    ${settings?.logo_url ? `<img src="${settings.logo_url}" alt="Logo" style="height:48px;object-fit:contain;margin-bottom:16px;display:block" />` : ''}

    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:20px;border-bottom:2px solid #111">
      <div>
        <div style="font-size:22px;font-weight:700;color:#111">INVOICE</div>
        ${settings?.business_name ? `<div style="font-size:14px;color:#374151;margin-top:4px">${settings.business_name}</div>` : ''}
        ${settings?.business_address ? `<div style="font-size:12px;color:#6b7280;white-space:pre-line">${settings.business_address}</div>` : ''}
        ${settings?.business_phone ? `<div style="font-size:12px;color:#6b7280">${settings.business_phone}</div>` : ''}
        ${settings?.business_email ? `<div style="font-size:12px;color:#6b7280">${settings.business_email}</div>` : ''}
        ${settings?.website_url ? `<div style="font-size:12px;color:#2563eb">${settings.website_url}</div>` : ''}
      </div>
      <div style="text-align:right">
        <div style="font-size:13px;color:#6b7280">Invoice #<span style="font-weight:700;color:#111">${invoice.invoice_number}</span></div>
        <div style="font-size:13px;color:#6b7280;margin-top:2px">Date: <span style="color:#111">${invoiceDate}</span></div>
        <div style="font-size:13px;color:#6b7280;margin-top:2px">Terms: <span style="color:#111">${settings?.payment_terms ?? 'Due upon receipt'}</span></div>
      </div>
    </div>

    <div style="display:flex;gap:32px;margin-bottom:24px">
      <div>
        <div style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Bill To</div>
        ${invoice.funder_name ? `<div style="font-size:13px;font-weight:600">${invoice.funder_name}</div>` : ''}
        ${invoice.funder_email ? `<div style="font-size:12px;color:#6b7280">${invoice.funder_email}</div>` : ''}
        ${invoice.guardian_email ? `<div style="font-size:12px;color:#6b7280">CC: ${invoice.guardian_email}</div>` : ''}
      </div>
      <div>
        <div style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Student</div>
        <div style="font-size:13px;font-weight:600">${student?.name ?? ''}</div>
        ${sessionDate ? `<div style="font-size:12px;color:#6b7280">Session: ${sessionDate}</div>` : ''}
      </div>
    </div>

    <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
      <thead>
        <tr style="background:#f3f4f6">
          <th style="text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;padding:8px 12px">Description</th>
          <th style="text-align:right;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;padding:8px 12px">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom:1px solid #e5e7eb">
          <td style="padding:12px;font-size:13px">S2C Session${session?.lesson_title ? ` — ${session.lesson_title}` : ''}${sessionDate ? ` (${sessionDate})` : ''}</td>
          <td style="padding:12px;text-align:right;font-size:13px;font-weight:600">${fmt(amount)}</td>
        </tr>
      </tbody>
    </table>

    <div style="text-align:right">
      <div style="display:inline-block;min-width:240px">
        ${amountPaid > 0 ? `
        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#6b7280">
          <span>Amount Paid</span>
          <span style="color:#16a34a;font-weight:600">−${fmt(amountPaid)}</span>
        </div>` : ''}
        <div style="display:flex;justify-content:space-between;padding:10px 12px;background:#1e3a5f;border-radius:8px;color:white;font-weight:700;font-size:15px">
          <span>Balance Due</span>
          <span>${fmt(Math.max(0, amount - amountPaid))}</span>
        </div>
      </div>
    </div>

    <div style="margin-top:24px;text-align:center">
      <a href="https://worduplessongenerator.com/invoice/${invoiceId}"
         style="display:inline-block;background:#1e3a5f;color:white;text-decoration:none;font-weight:600;font-size:13px;padding:10px 24px;border-radius:8px">
        View &amp; Download Invoice
      </a>
    </div>

    <div style="margin-top:16px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;text-align:center">
      Sent by ${practitionerName} via Word Up S2C · worduplessongenerator.com
    </div>
  </div>
</div>`

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error: resendError } = await resend.emails.send({
    from: 'Word Up <noreply@worduplessongenerator.com>',
    replyTo: practitionerEmail || undefined,
    to,
    cc: cc.length ? cc : undefined,
    bcc: 'Wordups2c@gmail.com',
    subject: `Invoice #${invoice.invoice_number} — ${student?.name ?? 'Student'} — ${invoiceDate}`,
    html,
  })

  if (resendError) return Response.json({ error: resendError.message }, { status: 500 })
  return Response.json({ ok: true })
}
