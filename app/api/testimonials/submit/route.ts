import { NextRequest } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const nameDisplay = (formData.get('nameDisplay') as string ?? '').trim()
  const roleDescription = (formData.get('roleDescription') as string ?? '').trim()
  const testimonialText = (formData.get('testimonialText') as string ?? '').trim()
  const photo = formData.get('photo') as File | null

  if (!nameDisplay || !testimonialText) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = getSupabase()
  let photoUrl: string | null = null

  if (photo && photo.size > 0) {
    const ext = photo.name.split('.').pop() ?? 'jpg'
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const bytes = await photo.arrayBuffer()
    const { error } = await supabase.storage
      .from('testimonials')
      .upload(fileName, Buffer.from(bytes), { contentType: photo.type })
    if (!error) {
      const { data } = supabase.storage.from('testimonials').getPublicUrl(fileName)
      photoUrl = data.publicUrl
    }
  }

  await supabase.from('testimonials').insert({
    name_display: nameDisplay,
    role_description: roleDescription || null,
    testimonial_text: testimonialText,
    photo_url: photoUrl,
    approved: false,
  })

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'Word Up <onboarding@resend.dev>',
      to: 'Wordups2c@gmail.com',
      subject: `New family testimonial — ${nameDisplay}`,
      html: `
        <h2 style="color:#2a1f17">New Family Testimonial</h2>
        <p><strong>Name:</strong> ${nameDisplay}</p>
        ${roleDescription ? `<p><strong>Role:</strong> ${roleDescription}</p>` : ''}
        <blockquote style="border-left:3px solid #C9A435;padding-left:14px;margin:12px 0;color:#5a4a3a;font-style:italic">
          ${testimonialText}
        </blockquote>
        ${photoUrl ? `<p><a href="${photoUrl}">View submitted photo</a></p>` : '<p><em>No photo submitted</em></p>'}
        <p style="margin-top:20px">
          <a href="https://worduplessongenerator.com/practitioner/testimonials"
            style="background:#C9A435;color:#2a1f17;padding:10px 22px;border-radius:20px;text-decoration:none;font-weight:bold">
            Review &amp; Approve →
          </a>
        </p>
      `,
    })
  } catch {
    // email failure shouldn't block the submission
  }

  return Response.json({ ok: true })
}
