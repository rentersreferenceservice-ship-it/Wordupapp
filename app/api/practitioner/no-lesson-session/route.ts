import { NextRequest } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

    const body = await req.json()
    const toRaw: unknown = body.to
    const to: string[] = Array.isArray(toRaw) ? toRaw : (typeof toRaw === 'string' ? [toRaw] : [])
    if (to.length === 0 || to.some(e => !e.includes('@'))) return Response.json({ error: 'Invalid recipient email' }, { status: 400 })

    const note: string | null = body.note ?? null
    const video: string | null = body.video ?? null
    const invoice: string | null = body.invoice ?? null

    const clerk = await clerkClient()
    const user = await clerk.users.getUser(userId)
    const practitionerEmail = user.emailAddresses[0]?.emailAddress ?? ''
    const practitionerName = [user.firstName, user.lastName].filter(Boolean).join(' ') || practitionerEmail

    const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

    const summaryHtml = `
<div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#374151">
  <h2 style="margin:0 0 8px 0;font-size:20px">Session Update</h2>
  <p style="margin:0 0 2px 0;font-size:15px;font-weight:600">No Lesson Session</p>
  <p style="margin:0 0 16px 0;font-size:13px;color:#6b7280">${now}</p>
  ${note ? `<div style="margin-bottom:18px;padding:14px 16px;border-radius:10px;background:#f8fafc;border:1px solid #e5e7eb"><p style="margin:0 0 8px 0;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">Note</p><p style="margin:0;white-space:pre-wrap;line-height:1.6;color:#374151">${note}</p></div>` : ''}
  ${video ? `
  <div style="margin-bottom:18px">
    <p style="margin:0 0 6px 0;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">Video</p>
    <a href="${video}" style="color:#2563eb;font-size:13px">${video}</a>
  </div>` : ''}
  ${invoice ? `
  <div style="margin-bottom:18px">
    <p style="margin:0 0 6px 0;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">Invoice</p>
    <a href="${invoice}" target="_blank" style="display:inline-block;background:#1e3a5f;color:white;text-decoration:none;font-weight:600;font-size:13px;padding:10px 20px;border-radius:8px">View Invoice →</a>
  </div>` : ''}
  ${!note && !video && !invoice ? '<p style="margin:0;color:#6b7280">No note, video, or invoice was provided for this update.</p>' : ''}
  <p style="margin:0;font-size:12px;color:#9ca3af">Sent by ${practitionerName} via Word Up · worduplessongenerator.com</p>
</div>`

    const subject = `No Lesson Session — ${practitionerName} — ${now}`

    const resend = new Resend(process.env.RESEND_API_KEY)
    const { data: resendData, error: resendError } = await resend.emails.send({
      from: 'Word Up <noreply@worduplessongenerator.com>',
      replyTo: practitionerEmail || undefined,
      to,
      bcc: 'Wordups2c@gmail.com',
      subject,
      html: summaryHtml,
    })

    if (resendError) {
      console.error('Resend error:', resendError)
      return Response.json({ error: resendError.message }, { status: 500 })
    }

    console.log('No-lesson resend accepted:', resendData?.id, '→ to:', to)
    return Response.json({ ok: true, messageId: resendData?.id })
  } catch (e) {
    console.error('No-lesson email route error:', e)
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
