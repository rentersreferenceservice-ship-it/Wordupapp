import { NextRequest } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { Resend } from 'resend'
import type { StudentReportData } from '@/lib/practitionerStore'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const { reportData, narrative, goals, emails, startDate, endDate } = await req.json() as {
    reportData: StudentReportData
    narrative: string
    goals: string
    emails: string[]
    startDate: string
    endDate: string
  }

  const validEmails = emails.filter(e => e && e.includes('@'))
  if (!validEmails.length) return Response.json({ error: 'No valid email addresses' }, { status: 400 })

  const clerk = await clerkClient()
  const user = await clerk.users.getUser(userId)
  const practitionerName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.emailAddresses[0]?.emailAddress ?? ''
  const practitionerEmail = user.emailAddresses[0]?.emailAddress ?? ''

  const { student, accuracyTrend, boardMilestones, questionTypeMilestones, regulationStats, topMisspokedKeywords } = reportData

  const fmt = (n: number | null) => n !== null ? `${n}%` : 'N/A'
  const periodLabel = `${new Date(startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} – ${new Date(endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`

  const html = `
<div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;color:#1f2937;background:#f9fafb;padding:24px;border-radius:12px">
  <div style="background:white;border-radius:10px;padding:28px;border:1px solid #e5e7eb">

    <div style="margin-bottom:24px;padding-bottom:20px;border-bottom:2px solid #1e3a5f">
      <div style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">Progress Report</div>
      <div style="font-size:22px;font-weight:700;color:#1e3a5f">${student.name}</div>
      <div style="font-size:13px;color:#6b7280;margin-top:2px">${periodLabel}</div>
    </div>

    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:#f8faff;border-radius:8px">
      <tr>
        <td style="padding:12px 16px;text-align:center;border-right:1px solid #e5e7eb">
          <div style="font-size:24px;font-weight:700;color:#1e3a5f">${accuracyTrend.completedCount}</div>
          <div style="font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase">Sessions</div>
        </td>
        <td style="padding:12px 16px;text-align:center;border-right:1px solid #e5e7eb">
          <div style="font-size:24px;font-weight:700;color:#16a34a">${fmt(accuracyTrend.average)}</div>
          <div style="font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase">Avg Accuracy</div>
        </td>
        <td style="padding:12px 16px;text-align:center;border-right:1px solid #e5e7eb">
          <div style="font-size:24px;font-weight:700;color:#2563eb">${fmt(accuracyTrend.first)} → ${fmt(accuracyTrend.last)}</div>
          <div style="font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase">Progress</div>
        </td>
        <td style="padding:12px 16px;text-align:center">
          <div style="font-size:24px;font-weight:700;color:#7c3aed">${fmt(accuracyTrend.highest)}</div>
          <div style="font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase">Best Session</div>
        </td>
      </tr>
    </table>

    ${boardMilestones.length ? `
    <div style="margin-bottom:20px">
      <div style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">Board Milestones</div>
      ${boardMilestones.map(m => `<div style="font-size:13px;color:#1f2937;padding:4px 0">✓ Advanced to <strong>${m.board}</strong> — ${new Date(m.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</div>`).join('')}
    </div>` : ''}

    ${questionTypeMilestones.length ? `
    <div style="margin-bottom:20px">
      <div style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">New Question Types Introduced</div>
      ${questionTypeMilestones.map(m => `<div style="font-size:13px;color:#1f2937;padding:4px 0">✓ <strong>${m.type}</strong> — ${new Date(m.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</div>`).join('')}
    </div>` : ''}

    ${regulationStats.arrivedDysregulated > 0 ? `
    <div style="margin-bottom:20px">
      <div style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">Regulation</div>
      ${regulationStats.improvedByEnd > 0 ? `<div style="font-size:13px;color:#16a34a;padding:2px 0">✓ Self-regulated during session: ${regulationStats.improvedByEnd} times</div>` : ''}
      ${regulationStats.ongoingConcern > 0 ? `<div style="font-size:13px;color:#dc2626;padding:2px 0">⚑ Dysregulated full session: ${regulationStats.ongoingConcern} times</div>` : ''}
    </div>` : ''}

    <div style="margin-bottom:20px;padding:16px;background:#f0f7ff;border-radius:8px;border-left:4px solid #1e3a5f">
      <div style="font-size:11px;font-weight:700;color:#1e3a5f;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px">Progress Narrative</div>
      <div style="font-size:13px;color:#1f2937;line-height:1.7;white-space:pre-wrap">${narrative}</div>
    </div>

    <div style="margin-bottom:20px;padding:16px;background:#f0fdf4;border-radius:8px;border-left:4px solid #16a34a">
      <div style="font-size:11px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px">Recommended Goals</div>
      <div style="font-size:13px;color:#1f2937;line-height:1.7;white-space:pre-wrap">${goals}</div>
    </div>

    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;text-align:center">
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
    subject: `Progress Report — ${student.name} — ${periodLabel}`,
    html,
  })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
