import { NextRequest } from 'next/server'
import { Resend } from 'resend'
import { storePendingVerification, verifyEmailCode } from '@/lib/usageStore'

const resend = new Resend(process.env.RESEND_API_KEY)

// POST /api/verify  { action: 'request', email }  — sends code
// POST /api/verify  { action: 'confirm', email, code }  — verifies code
export async function POST(req: NextRequest) {
  const body = await req.json()

  if (body.action === 'request') {
    const email = (body.email as string)?.trim().toLowerCase()
    if (!email || !email.includes('@')) {
      return Response.json({ error: 'Invalid email' }, { status: 400 })
    }

    const code = String(Math.floor(100000 + Math.random() * 900000)) // 6-digit code
    storePendingVerification(email, code)

    await resend.emails.send({
      from: 'Word Up <noreply@worduplessongenerator.com>',
      to: email,
      subject: 'Your Word Up verification code',
      html: `
        <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:24px;">
          <h2 style="color:#1e40af;">Word Up S2C Lesson Generator</h2>
          <p>Your verification code is:</p>
          <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1e40af;margin:16px 0;">${code}</div>
          <p style="color:#6b7280;font-size:13px;">This code expires in 10 minutes.</p>
        </div>
      `,
    })

    return Response.json({ ok: true })
  }

  if (body.action === 'confirm') {
    const email = (body.email as string)?.trim().toLowerCase()
    const code = (body.code as string)?.trim()
    if (!email || !code) {
      return Response.json({ error: 'Missing email or code' }, { status: 400 })
    }

    const valid = verifyEmailCode(email, code)
    if (!valid) {
      return Response.json({ error: 'Invalid or expired code' }, { status: 400 })
    }

    return Response.json({ ok: true })
  }

  return Response.json({ error: 'Invalid action' }, { status: 400 })
}
