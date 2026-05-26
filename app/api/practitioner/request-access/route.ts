import { NextRequest } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  const { name, email, organization, role } = await req.json()

  await getSupabase().from('practitioner_leads').insert({
    name,
    email: email.toLowerCase().trim(),
    organization,
    role,
  })

  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: 'Word Up <onboarding@resend.dev>',
    to: 'Wordups2c@gmail.com',
    subject: `New practitioner access request — ${name}`,
    html: `
      <h2>New Access Request</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Organization:</strong> ${organization}</p>
      <p><strong>Role:</strong> ${role}</p>
    `,
  })

  return Response.json({ ok: true })
}
