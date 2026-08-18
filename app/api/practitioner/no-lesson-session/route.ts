import { NextRequest } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { Resend } from 'resend'
import { getSupabase } from '@/lib/supabase'

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
    const studentId: string | null = body.studentId ?? null

    const clerk = await clerkClient()
    const user = await clerk.users.getUser(userId)
    const practitionerEmail = user.emailAddresses[0]?.emailAddress ?? ''
    const practitionerName = [user.firstName, user.lastName].filter(Boolean).join(' ') || practitionerEmail

    const supabase = getSupabase()
    const [{ data: settings }, { data: student }] = await Promise.all([
      supabase
        .from('practitioner_settings')
        .select('*')
        .eq('practitioner_id', userId)
        .single(),
      studentId
        ? supabase.from('students').select('name').eq('id', studentId).eq('practitioner_id', userId).single()
        : Promise.resolve({ data: null }),
    ])
    const studentName = student?.name ?? null

    const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

    const normalizedVideo = video?.trim() || null
    const rawInvoice = invoice?.trim() || null
    const normalizedInvoice = rawInvoice
      ? rawInvoice.startsWith('/practitioner/invoice/')
        ? `https://worduplessongenerator.com/invoice/${rawInvoice.split('/').pop()}`
        : rawInvoice
      : null
    const ytMatch = normalizedVideo?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    const ytId = ytMatch?.[1] ?? null
    const ytThumb = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null

    const logoHtml = settings?.logo_url
      ? `<img src="${settings.logo_url}" alt="Practice Logo" style="height:52px;object-fit:contain;margin-bottom:12px;display:block" />`
      : `<div style="font-size:20px;font-weight:700;color:#111827;margin-bottom:12px">Word Up</div>`

    const businessDetails = [
      settings?.business_name,
      settings?.business_address,
      settings?.business_phone,
      settings?.business_email,
      settings?.website_url,
    ].filter(Boolean)

    const addressHtml = businessDetails.length
      ? businessDetails.map(item => `<div style="font-size:12px;line-height:1.5;color:#6b7280">${item}</div>`).join('')
      : '<div style="font-size:12px;line-height:1.5;color:#6b7280">worduplessongenerator.com</div>'

    const summaryHtml = `
<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#374151;background:#f5f5f4;padding:24px">
  <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:24px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;padding-bottom:18px;border-bottom:2px solid #111827">
      <div>
        ${logoHtml}
        ${addressHtml}
      </div>
      <div style="text-align:right">
        <div style="font-size:20px;font-weight:700;color:#111827;letter-spacing:0.04em">No Lesson Session</div>
        <div style="font-size:12px;color:#6b7280;margin-top:4px">${now}</div>
      </div>
    </div>

    <div style="margin-bottom:18px">
      ${studentName ? `<p style="margin:0 0 2px 0;font-size:18px;font-weight:700;color:#111827">${studentName}</p>` : ''}
      <p style="margin:0 0 2px 0;font-size:${studentName ? '13px' : '15px'};font-weight:${studentName ? '400' : '600'};color:${studentName ? '#6b7280' : '#111827'}">${practitionerName}</p>
      <p style="margin:0;font-size:13px;color:#6b7280">${now}</p>
    </div>

    ${note ? `
      <div style="margin-bottom:18px;padding:14px 16px;border-radius:10px;background:#f8fafc;border:1px solid #e5e7eb">
        <p style="margin:0 0 8px 0;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">Session Note</p>
        <div style="margin:0;white-space:pre-wrap;line-height:1.7;color:#374151;font-size:14px">${note}</div>
      </div>
    ` : ''}

    ${normalizedVideo ? `
      <div style="margin-bottom:18px">
        <p style="margin:0 0 6px 0;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">Session Video</p>
        ${ytThumb ? `
          <a href="${normalizedVideo}" target="_blank" rel="noopener noreferrer" style="display:block">
            <img src="${ytThumb}" alt="Session video" style="width:100%;max-width:100%;border-radius:8px;display:block" />
          </a>
        ` : `<a href="${normalizedVideo}" target="_blank" style="color:#2563eb;font-size:13px">${normalizedVideo}</a>`}
      </div>
    ` : ''}

    ${normalizedInvoice ? `
      <div style="margin-bottom:18px">
        <p style="margin:0 0 6px 0;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">Invoice</p>
        <a href="${normalizedInvoice}" target="_blank" style="display:inline-block;background:#1e3a5f;color:white;text-decoration:none;font-weight:600;font-size:13px;padding:10px 20px;border-radius:8px">View Invoice →</a>
      </div>
    ` : ''}

    ${!note && !normalizedVideo && !normalizedInvoice ? '<p style="margin:0;color:#6b7280;font-size:14px">No note, video, or invoice was provided for this update.</p>' : ''}

    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb">
      <p style="margin:0 0 6px 0;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em">Contact</p>
      ${settings?.business_phone ? `<p style="margin:0 0 4px 0;font-size:12px;color:#6b7280">${settings.business_phone}</p>` : ''}
      ${settings?.business_email ? `<p style="margin:0 0 4px 0;font-size:12px;color:#6b7280">${settings.business_email}</p>` : ''}
      ${settings?.website_url ? `<p style="margin:0;font-size:12px;color:#2563eb">${settings.website_url}</p>` : ''}
      <p style="margin:12px 0 0 0;font-size:12px;color:#9ca3af">Sent by ${practitionerName} via Word Up · worduplessongenerator.com</p>
    </div>
  </div>
</div>`

    const subject = `No Lesson Session — ${studentName ?? practitionerName} — ${now}`

    const resend = new Resend(process.env.RESEND_API_KEY)
    const { data: resendData, error: resendError } = await resend.emails.send({
      from: 'Word Up <noreply@worduplessongenerator.com>',
      replyTo: practitionerEmail || undefined,
      to,
      bcc: ['Wordups2c@gmail.com', practitionerEmail].filter(Boolean),
      subject,
      html: summaryHtml,
    })

    if (resendError) {
      console.error('Resend error:', resendError)
      return Response.json({ error: resendError.message }, { status: 500 })
    }

    console.log('No-lesson resend accepted:', resendData?.id, '→ to:', to)

    // Record this in the student's file the same way an Open Session does —
    // a sessions row plus session_responses — so it shows up in Session
    // History and is viewable via the existing transcript page.
    if (studentId && student) {
      try {
        const sessionDate = new Date().toISOString().split('T')[0]
        const { data: newSession, error: sessionError } = await supabase
          .from('sessions')
          .insert({
            practitioner_id: userId,
            student_id: studentId,
            lesson_id: null,
            lesson_title: 'No Lesson Session',
            session_date: sessionDate,
          })
          .select()
          .single()

        if (sessionError || !newSession) {
          console.error('No-lesson session record error:', sessionError)
        } else {
          const responses = [
            { session_id: newSession.id, hunk_number: 0, question_type: 'SESSION_NOTES', question_text: 'Session Notes', captured_answer: note ?? '', expected_answer: '', misspoke_count: 0 },
            ...(normalizedVideo ? [{ session_id: newSession.id, hunk_number: 0, question_type: 'SESSION_VIDEO', question_text: 'Session Video', captured_answer: normalizedVideo, expected_answer: '', misspoke_count: 0 }] : []),
            ...(rawInvoice ? [{ session_id: newSession.id, hunk_number: 0, question_type: 'SESSION_INVOICE', question_text: 'Invoice', captured_answer: rawInvoice, expected_answer: '', misspoke_count: 0 }] : []),
            { session_id: newSession.id, hunk_number: 0, question_type: 'SESSION_COMPLETE', question_text: 'Session Complete', captured_answer: 'true', expected_answer: '', misspoke_count: 0 },
          ]
          await supabase.from('session_responses').insert(responses)

          if (rawInvoice?.startsWith('/practitioner/invoice/')) {
            const invoiceId = rawInvoice.split('/').pop()
            if (invoiceId) {
              await supabase.from('invoices').update({ session_id: newSession.id }).eq('id', invoiceId).eq('practitioner_id', userId)
            }
          }
        }
      } catch (e) {
        console.error('No-lesson session record error:', e)
      }
    }

    return Response.json({ ok: true, messageId: resendData?.id })
  } catch (e) {
    console.error('No-lesson email route error:', e)
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
