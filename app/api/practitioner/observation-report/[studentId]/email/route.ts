import { NextRequest } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { Resend } from 'resend'
import { getPractitionerSettings, getStudent } from '@/lib/practitionerStore'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const student = await getStudent(studentId)
  if (!student || student.practitionerId !== userId) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  const { start, end, emails, studentName, summary } = await req.json() as {
    start: string
    end: string
    emails: string[]
    studentName: string
    summary: {
      eventCount: number
      familyCount: number
      energyCount: number
      totalObservations: number
      eventTrend: string | null
      eventTrendPositive: boolean
      eventTrendNegative: boolean
      familyTrend: string | null
      familyTrendPositive: boolean
      familyTrendNegative: boolean
      accuracyBlurb: string | null
    }
  }

  const validEmails = emails.filter(e => e && e.includes('@'))
  if (!validEmails.length) return Response.json({ error: 'No valid email addresses' }, { status: 400 })

  const [clerk_inst, settings] = await Promise.all([
    clerkClient(),
    getPractitionerSettings(userId),
  ])
  const user = await clerk_inst.users.getUser(userId)
  const practitionerName = ([user.firstName, user.lastName].filter(Boolean).join(' ') || user.emailAddresses[0]?.emailAddress) ?? ''
  const practitionerEmail = user.emailAddresses[0]?.emailAddress ?? ''

  const periodLabel = `${new Date(start + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} – ${new Date(end + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`

  const trendColor = (positive: boolean, negative: boolean) => positive ? '#15803d' : negative ? '#b91c1c' : '#374151'

  const html = `
<div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;color:#1f2937;background:#f9fafb;padding:24px;border-radius:12px">
  <div style="background:white;border-radius:10px;padding:28px;border:1px solid #e5e7eb">

    <table style="width:100%;margin-bottom:16px;padding-bottom:16px;border-bottom:2px solid #1e3a5f"><tr>
      <td style="vertical-align:top">
        ${settings.logoUrl ? `<img src="${settings.logoUrl}" alt="Logo" style="height:48px;object-fit:contain;display:block;margin-bottom:8px" />` : ''}
        <div style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Neurological Observation Report</div>
        ${settings.businessName ? `<div style="font-size:15px;font-weight:700;color:#1f2937">${settings.businessName}</div>` : ''}
        ${settings.businessAddress ? `<div style="font-size:12px;color:#6b7280;white-space:pre-line">${settings.businessAddress}</div>` : ''}
        ${settings.businessPhone ? `<div style="font-size:12px;color:#6b7280">${settings.businessPhone}</div>` : ''}
        ${settings.businessEmail ? `<div style="font-size:12px;color:#6b7280">${settings.businessEmail}</div>` : ''}
      </td>
      <td style="vertical-align:top;text-align:right">
        <div style="font-size:18px;font-weight:700;color:#1e3a5f">${studentName}</div>
        <div style="font-size:13px;color:#6b7280;margin-top:2px">${periodLabel}</div>
      </td>
    </tr></table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid #e5e7eb;border-radius:8px">
      <tr>
        <td width="25%" style="padding:12px 8px;text-align:center;border-right:1px solid #e5e7eb">
          <div style="font-size:22px;font-weight:700;color:#1e3a5f">${summary.eventCount}</div>
          <div style="font-size:10px;color:#6b7280;font-weight:600;text-transform:uppercase">Practitioner Events</div>
        </td>
        <td width="25%" style="padding:12px 8px;text-align:center;border-right:1px solid #e5e7eb">
          <div style="font-size:22px;font-weight:700;color:#6d28d9">${summary.familyCount}</div>
          <div style="font-size:10px;color:#6b7280;font-weight:600;text-transform:uppercase">Family Episodes</div>
        </td>
        <td width="25%" style="padding:12px 8px;text-align:center;border-right:1px solid #e5e7eb">
          <div style="font-size:22px;font-weight:700;color:#065f46">${summary.energyCount}</div>
          <div style="font-size:10px;color:#6b7280;font-weight:600;text-transform:uppercase">Energy Logs</div>
        </td>
        <td width="25%" style="padding:12px 8px;text-align:center">
          <div style="font-size:22px;font-weight:700;color:#374151">${summary.totalObservations}</div>
          <div style="font-size:10px;color:#6b7280;font-weight:600;text-transform:uppercase">Total Observations</div>
        </td>
      </tr>
    </table>

    ${summary.eventTrend ? `
    <div style="margin-bottom:12px;padding:10px 14px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;font-size:13px">
      <strong>Practitioner-observed event trend:</strong> ${summary.eventTrend}
      <span style="color:${trendColor(summary.eventTrendPositive, summary.eventTrendNegative)};font-weight:700">
        ${summary.eventTrendPositive ? ' — Positive trend' : summary.eventTrendNegative ? ' — Monitor closely' : ''}
      </span>
    </div>` : ''}

    ${summary.familyTrend ? `
    <div style="margin-bottom:12px;padding:10px 14px;background:#faf5ff;border:1px solid #e9d5ff;border-radius:8px;font-size:13px">
      <strong>Family-reported episode trend:</strong> ${summary.familyTrend}
      <span style="color:${trendColor(summary.familyTrendPositive, summary.familyTrendNegative)};font-weight:700">
        ${summary.familyTrendPositive ? ' — Positive trend' : summary.familyTrendNegative ? ' — Monitor closely' : ''}
      </span>
    </div>` : ''}

    ${summary.accuracyBlurb ? `
    <div style="margin-bottom:20px;padding:10px 14px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;font-size:13px">
      <strong>Spelling accuracy during events:</strong> ${summary.accuracyBlurb}
    </div>` : ''}

    <div style="margin-bottom:20px;padding:14px 16px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;font-size:12px;color:#92400e">
      This is a summary. Ask ${practitionerName || 'your practitioner'} for the full clinical report with individual event records if you'd like the complete detail.
    </div>

    <div style="margin-top:12px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;text-align:center">
      Prepared by ${practitionerName} · Word Up S2C · worduplessongenerator.com<br />
      This document is not a medical diagnosis.
    </div>
  </div>
</div>`

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: 'Word Up <noreply@worduplessongenerator.com>',
    replyTo: practitionerEmail || undefined,
    to: validEmails,
    bcc: [practitionerEmail, 'Wordups2c@gmail.com'].filter(e => e && e.includes('@')),
    subject: `Observation Report — ${studentName} — ${periodLabel}`,
    html,
  })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
