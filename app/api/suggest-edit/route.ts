import { NextRequest } from 'next/server'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  const { lessonTitle, hunkNumber, whatToEdit, citation } = await req.json()
  if (!lessonTitle?.trim() || !whatToEdit?.trim()) {
    return Response.json({ error: 'Lesson name and suggested edit are required.' }, { status: 400 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: 'Word Up <onboarding@resend.dev>',
    to: 'Wordups2c@gmail.com',
    subject: `Suggest Edit — ${lessonTitle}`,
    html: `
      <h2>Lesson Edit Suggestion</h2>
      <p><strong>Lesson:</strong> ${lessonTitle}</p>
      ${hunkNumber ? `<p><strong>Hunk #:</strong> ${hunkNumber}</p>` : ''}
      <hr />
      <p><strong>What needs to be edited:</strong></p>
      <p>${whatToEdit.trim().replace(/\n/g, '<br />')}</p>
      ${citation ? `<hr /><p><strong>Supporting link / citation:</strong><br /><a href="${citation}">${citation}</a></p>` : ''}
    `,
  })

  return Response.json({ ok: true })
}
