import { NextRequest } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { Resend } from 'resend'
import { getPractitionerSettings } from '@/lib/practitionerStore'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const { startDate, endDate, emails, sections, studentName, reportId } = await req.json() as {
    startDate: string
    endDate: string
    emails: string[]
    studentName: string
    reportId?: string
    sections: {
      statSessions: string
      statAvg: string
      statProgress: string
      statBest: string
      milestonesText: string
      regulationText: string
      lettersText: string
      finSessions: string
      finFrequency: string
      finRate: string
      finTotal: string
      narrative: string
      goals: string
      show: Record<string, boolean>
      reportType?: string
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

  const periodLabel = `${new Date(startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} – ${new Date(endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
  const { show } = sections

  const html = `
<div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;color:#1f2937;background:#f9fafb;padding:24px;border-radius:12px">
  <div style="background:white;border-radius:10px;padding:28px;border:1px solid #e5e7eb">

    <table style="width:100%;margin-bottom:16px;padding-bottom:16px;border-bottom:2px solid #1e3a5f"><tr>
      <td style="vertical-align:top">
        ${settings.logoUrl ? `<img src="${settings.logoUrl}" alt="Logo" style="height:48px;object-fit:contain;display:block;margin-bottom:8px" />` : ''}
        <div style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">${sections.reportType ?? 'Progress Report'}</div>
        ${settings.businessName ? `<div style="font-size:15px;font-weight:700;color:#1f2937">${settings.businessName}</div>` : ''}
        ${settings.businessAddress ? `<div style="font-size:12px;color:#6b7280;white-space:pre-line">${settings.businessAddress}</div>` : ''}
        ${settings.businessPhone ? `<div style="font-size:12px;color:#6b7280">${settings.businessPhone}</div>` : ''}
        ${settings.businessEmail ? `<div style="font-size:12px;color:#6b7280">${settings.businessEmail}</div>` : ''}
        ${settings.websiteUrl ? `<div style="font-size:12px;color:#2563eb">${settings.websiteUrl}</div>` : ''}
      </td>
      <td style="vertical-align:top;text-align:right">
        <div style="font-size:18px;font-weight:700;color:#1e3a5f">${studentName}</div>
        <div style="font-size:13px;color:#6b7280;margin-top:2px">${periodLabel}</div>
        ${reportId ? `<a href="https://worduplessongenerator.com/report/${reportId}" style="display:inline-block;margin-top:8px;background:#1e3a5f;color:white;text-decoration:none;padding:7px 16px;border-radius:6px;font-size:12px;font-weight:700">View &amp; Print</a>` : ''}
      </td>
    </tr></table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid #e5e7eb;border-radius:8px">
      <tr>
        <td width="25%" style="padding:12px 8px;text-align:center;border-right:1px solid #e5e7eb">
          <div style="font-size:22px;font-weight:700;color:#1e3a5f">${sections.statSessions || '—'}</div>
          <div style="font-size:10px;color:#6b7280;font-weight:600;text-transform:uppercase">Sessions</div>
        </td>
        <td width="25%" style="padding:12px 8px;text-align:center;border-right:1px solid #e5e7eb">
          <div style="font-size:22px;font-weight:700;color:#16a34a">${sections.statAvg || '—'}</div>
          <div style="font-size:10px;color:#6b7280;font-weight:600;text-transform:uppercase">Avg Accuracy</div>
        </td>
        <td width="25%" style="padding:12px 8px;text-align:center;border-right:1px solid #e5e7eb">
          <div style="font-size:22px;font-weight:700;color:#2563eb">${sections.statProgress || '—'}</div>
          <div style="font-size:10px;color:#6b7280;font-weight:600;text-transform:uppercase">Progress</div>
        </td>
        <td width="25%" style="padding:12px 8px;text-align:center">
          <div style="font-size:22px;font-weight:700;color:#7c3aed">${sections.statBest || '—'}</div>
          <div style="font-size:10px;color:#6b7280;font-weight:600;text-transform:uppercase">Best Session</div>
        </td>
      </tr>
    </table>

    ${show.milestones !== false && sections.milestonesText ? `
    <div style="margin-bottom:20px">
      <div style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">Milestones This Period</div>
      <div style="font-size:13px;color:#1f2937;line-height:1.8;white-space:pre-wrap">${sections.milestonesText}</div>
    </div>` : ''}

    ${show.regulation !== false && sections.regulationText ? `
    <div style="margin-bottom:20px">
      <div style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">Regulation</div>
      <div style="font-size:13px;color:#1f2937;line-height:1.8;white-space:pre-wrap">${sections.regulationText}</div>
    </div>` : ''}

    ${show.letters !== false && sections.lettersText ? `
    <div style="margin-bottom:20px">
      <div style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">Most Misspoked Letters</div>
      <div style="font-size:16px;font-weight:700;color:#dc2626;letter-spacing:0.1em">${sections.lettersText}</div>
    </div>` : ''}

    ${show.financials !== false && (sections.finSessions || sections.finRate || sections.finTotal) ? `
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:#f8faff;border-radius:8px">
      <tr>
        <td style="padding:12px 16px;text-align:center;border-right:1px solid #e5e7eb">
          <div style="font-size:20px;font-weight:700;color:#1e3a5f">${sections.finSessions || '—'}</div>
          <div style="font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase">Sessions Completed</div>
        </td>
        <td style="padding:12px 16px;text-align:center;border-right:1px solid #e5e7eb">
          <div style="font-size:20px;font-weight:700;color:#1e3a5f">${sections.finFrequency ? sections.finFrequency + 'x / wk' : '—'}</div>
          <div style="font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase">Frequency</div>
        </td>
        <td style="padding:12px 16px;text-align:center;border-right:1px solid #e5e7eb">
          <div style="font-size:20px;font-weight:700;color:#1e3a5f">${sections.finRate ? '$' + sections.finRate : '—'}</div>
          <div style="font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase">Session Rate</div>
        </td>
        <td style="padding:12px 16px;text-align:center">
          <div style="font-size:20px;font-weight:700;color:#1e3a5f">${sections.finTotal ? '$' + sections.finTotal : '—'}</div>
          <div style="font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase">Annual Total</div>
        </td>
      </tr>
    </table>` : ''}

    ${show.narrative !== false && sections.narrative ? `
    <div style="margin-bottom:20px;padding:16px;background:#f0f7ff;border-radius:8px;border-left:4px solid #1e3a5f">
      <div style="font-size:11px;font-weight:700;color:#1e3a5f;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px">Progress Narrative</div>
      <div style="font-size:13px;color:#1f2937;line-height:1.7;white-space:pre-wrap">${sections.narrative}</div>
    </div>` : ''}

    ${show.goals !== false && sections.goals ? `
    <div style="margin-bottom:20px;padding:16px;background:#f0fdf4;border-radius:8px;border-left:4px solid #16a34a">
      <div style="font-size:11px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px">Recommended Goals</div>
      <div style="font-size:13px;color:#1f2937;line-height:1.7;white-space:pre-wrap">${sections.goals}</div>
    </div>` : ''}

    <div style="margin-top:12px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;text-align:center">
      Prepared by ${practitionerName} · Word Up S2C · worduplessongenerator.com
    </div>
  </div>
</div>`

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: 'Word Up <noreply@worduplessongenerator.com>',
    replyTo: practitionerEmail || undefined,
    to: validEmails,
    bcc: [practitionerEmail, 'Wordups2c@gmail.com'].filter(e => e && e.includes('@')),
    subject: `Progress Report — ${studentName} — ${periodLabel}`,
    html,
  })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
