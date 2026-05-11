import { NextRequest } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { getSessionResponses } from '@/lib/practitionerStore'
import { getSupabase } from '@/lib/supabase'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params
    const { userId } = await auth()
    if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

    const { to } = await req.json()
    if (!to || !to.includes('@')) return Response.json({ error: 'Invalid recipient email' }, { status: 400 })

    const { data: session } = await getSupabase()
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('practitioner_id', userId)
      .single()
    if (!session) return Response.json({ error: 'Session not found' }, { status: 404 })

    const { data: student } = await getSupabase()
      .from('students')
      .select('name, age_group')
      .eq('id', session.student_id)
      .single()

    const clerk = await clerkClient()
    const user = await clerk.users.getUser(userId)
    const practitionerEmail = user.emailAddresses[0]?.emailAddress ?? ''
    const practitionerName = [user.firstName, user.lastName].filter(Boolean).join(' ') || practitionerEmail

    const responses = await getSessionResponses(sessionId)

    const keywords = responses.filter(r => r.questionType === 'KEYWORD' && r.capturedAnswer !== 'SKIPPED' && r.hunkNumber != null && r.hunkNumber > 0)
    const known = responses.filter(r => r.questionType === 'KNOWN' && r.capturedAnswer !== 'NOT_ASKED' && r.hunkNumber != null && r.hunkNumber > 0)
    const totalLetters =
      keywords.reduce((s, k) => s + (k.keyword ?? '').replace(/\s/g, '').length, 0) +
      known.reduce((s, q) => s + (q.expectedAnswer ?? '').split('/').reduce((a, x) => a + x.trim().replace(/\s/g, '').length, 0), 0)
    const totalMisspokes = [...keywords, ...known].reduce((s, r) => s + (r.misspokeCount ?? 0), 0)
    const totalPokes = totalLetters + totalMisspokes
    const accuracy = totalPokes > 0 ? Math.round((totalLetters / totalPokes) * 100) : null

    const notesRecord = responses.find(r => r.questionType === 'SESSION_NOTES')
    const videoRecord = responses.find(r => r.questionType === 'SESSION_VIDEO')
    const invoiceRecord = responses.find(r => r.questionType === 'SESSION_INVOICE')

    const sessionDate = new Date(session.session_date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    const transcriptUrl = `https://worduplessongenerator.com/practitioner/transcript/${sessionId}`

    const statsHtml = accuracy !== null ? `
      <table style="border-collapse:collapse;margin:16px 0;width:100%;">
        <tr>
          <td style="background:#eff6ff;padding:12px 16px;border-radius:8px;text-align:center;width:33%">
            <div style="font-size:28px;font-weight:700;color:#2563eb">${totalLetters}</div>
            <div style="font-size:11px;font-weight:600;color:#3b82f6;margin-top:2px">Letters to Poke</div>
          </td>
          <td style="width:8px"></td>
          <td style="background:#fef2f2;padding:12px 16px;border-radius:8px;text-align:center;width:33%">
            <div style="font-size:28px;font-weight:700;color:#ef4444">${totalMisspokes}</div>
            <div style="font-size:11px;font-weight:600;color:#f87171;margin-top:2px">Misspokes</div>
          </td>
          <td style="width:8px"></td>
          <td style="background:#f0fdf4;padding:12px 16px;border-radius:8px;text-align:center;width:33%">
            <div style="font-size:28px;font-weight:700;color:#16a34a">${accuracy}%</div>
            <div style="font-size:11px;font-weight:600;color:#22c55e;margin-top:2px">Accuracy</div>
          </td>
        </tr>
      </table>
    ` : ''

    const notesHtml = notesRecord?.capturedAnswer ? `
      <div style="margin:16px 0;">
        <div style="font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Session Notes</div>
        <p style="font-size:14px;color:#374151;white-space:pre-wrap;margin:0">${notesRecord.capturedAnswer}</p>
      </div>
    ` : ''

    const videoHtml = videoRecord?.capturedAnswer ? `
      <div style="margin:12px 0;">
        <div style="font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Session Video</div>
        <a href="${videoRecord.capturedAnswer}" style="font-size:14px;color:#2563eb">${videoRecord.capturedAnswer}</a>
      </div>
    ` : ''

    const invoiceHtml = invoiceRecord?.capturedAnswer ? `
      <div style="margin:12px 0;">
        <div style="font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Invoice</div>
        <a href="${invoiceRecord.capturedAnswer}" style="font-size:14px;color:#2563eb">${invoiceRecord.capturedAnswer}</a>
      </div>
    ` : ''

    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#111827">
        <div style="margin-bottom:20px">
          <img src="https://worduplessongenerator.com/word_up_clean.jpeg" alt="Word Up" style="width:80px" />
        </div>
        <h1 style="font-size:22px;font-weight:700;margin:0 0 4px">Session Transcript</h1>
        <p style="font-size:14px;color:#6b7280;margin:0 0 16px">Sent by ${practitionerName}</p>
        <div style="background:#f9fafb;border-radius:10px;padding:16px;margin-bottom:16px">
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="font-size:13px;color:#6b7280;padding:3px 0;width:90px">Student</td>
              <td style="font-size:13px;font-weight:600;color:#111827">${student?.name ?? '—'}</td>
            </tr>
            <tr>
              <td style="font-size:13px;color:#6b7280;padding:3px 0">Age Group</td>
              <td style="font-size:13px;color:#374151">${student?.age_group ?? '—'}</td>
            </tr>
            <tr>
              <td style="font-size:13px;color:#6b7280;padding:3px 0">Lesson</td>
              <td style="font-size:13px;color:#374151">${session.lesson_title}</td>
            </tr>
            <tr>
              <td style="font-size:13px;color:#6b7280;padding:3px 0">Date</td>
              <td style="font-size:13px;color:#374151">${sessionDate}</td>
            </tr>
          </table>
        </div>
        ${statsHtml}
        ${notesHtml}
        ${videoHtml}
        ${invoiceHtml}
        <div style="margin-top:24px">
          <a href="${transcriptUrl}" style="display:inline-block;background:#1d4ed8;color:white;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none">
            View Full Transcript
          </a>
        </div>
        <p style="font-size:12px;color:#9ca3af;margin-top:24px">Word Up S2C · worduplessongenerator.com</p>
      </div>
    `

    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error: resendError } = await resend.emails.send({
      from: 'Word Up <onboarding@resend.dev>',
      replyTo: practitionerEmail || undefined,
      to,
      subject: `Session Transcript — ${student?.name ?? 'Student'} — ${sessionDate}`,
      html,
    })

    if (resendError) {
      console.error('Resend error:', resendError)
      return Response.json({ error: resendError.message }, { status: 500 })
    }

    return Response.json({ ok: true })
  } catch (e) {
    console.error('Email route error:', e)
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
