import { clerkClient } from '@clerk/nextjs/server'
import { Resend } from 'resend'
import { getSupabase } from './supabase'
import { getIntakeRequest } from './intakeStore'

export async function sendIntakeRequestEmail(
  intakeRequestId: string,
  practitionerId: string
): Promise<{ ok: true } | { error: string }> {
  const request = await getIntakeRequest(intakeRequestId, practitionerId)
  if (!request) return { error: 'Not found' }
  if (!request.recipientEmail) return { error: 'No recipient email on this request' }

  const clerk = await clerkClient()
  const user = await clerk.users.getUser(practitionerId)
  const practitionerEmail = user.emailAddresses[0]?.emailAddress ?? ''
  const practitionerName = [user.firstName, user.lastName].filter(Boolean).join(' ') || practitionerEmail

  let studentName: string | null = null
  if (request.studentId) {
    const { data: student } = await getSupabase().from('students').select('name').eq('id', request.studentId).single()
    studentName = student?.name ?? null
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wordups2c.com'
  const link = `${origin}/intake/${request.token}`
  const isUpdate = !!request.studentId

  const html = `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1f2937;background:#f9fafb;padding:24px;border-radius:12px">
  <div style="background:white;border-radius:10px;padding:28px;border:1px solid #e5e7eb">
    <p style="font-size:14px;line-height:1.6;margin:0 0 16px 0">Hi${studentName ? '' : ' there'},</p>
    ${isUpdate
      ? `<p style="font-size:14px;line-height:1.6;margin:0 0 16px 0">We're refreshing client files here at Word Up, and it's been a while since we asked for some of this directly from you. Could you take about 10 minutes to fill out an updated profile for ${studentName ?? 'your non-speaker'}?</p>
         <p style="font-size:14px;line-height:1.6;margin:0 0 16px 0">Nothing here replaces what's already on file automatically — we'll review what you share and update the record ourselves, so there's no risk of losing anything we already know.</p>`
      : `<p style="font-size:14px;line-height:1.6;margin:0 0 16px 0">Thanks for your interest in Word Up. Could you take about 10 minutes to fill out an intake form so we can get to know your non-speaker and plan a session that fits them?</p>`
    }
    ${request.quotedFee != null ? `<p style="font-size:14px;line-height:1.6;margin:0 0 16px 0">Quoted session fee: <strong>$${request.quotedFee}</strong></p>` : ''}
    <div style="text-align:center;margin:24px 0">
      <a href="${link}" style="display:inline-block;background:#1e3a5f;color:white;text-decoration:none;font-weight:600;font-size:14px;padding:12px 28px;border-radius:8px">
        Complete the form
      </a>
    </div>
    <p style="font-size:13px;color:#6b7280;margin:0">Thank you for taking the time.</p>
    <p style="font-size:13px;color:#6b7280;margin:8px 0 0 0">${practitionerName}<br/>Word Up</p>
  </div>
</div>`

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: 'Word Up <noreply@worduplessongenerator.com>',
    replyTo: practitionerEmail || undefined,
    to: [request.recipientEmail],
    bcc: [practitionerEmail, 'Wordups2c@gmail.com'].filter(e => e && e.includes('@')),
    subject: isUpdate ? `Updating our records for ${studentName ?? 'your non-speaker'}` : 'Word Up — client intake form',
    html,
  })

  if (error) return { error: error.message }
  return { ok: true }
}
