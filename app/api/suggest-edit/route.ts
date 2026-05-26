import { NextRequest } from 'next/server'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  const { lessonId, lessonTitle, suggestion } = await req.json()
  if (!suggestion?.trim()) return Response.json({ error: 'No suggestion provided' }, { status: 400 })

  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: 'Word Up <onboarding@resend.dev>',
    to: 'Wordups2c@gmail.com',
    subject: `Lesson suggestion — ${lessonTitle}`,
    html: `
      <h2>Lesson Suggestion / Correction</h2>
      <p><strong>Lesson:</strong> ${lessonTitle}</p>
      <p><strong>Lesson ID:</strong> ${lessonId}</p>
      <hr />
      <p>${suggestion.trim().replace(/\n/g, '<br />')}</p>
    `,
  })

  return Response.json({ ok: true })
}
