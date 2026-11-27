import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createIntakeRequest } from '@/lib/intakeStore'
import { sendIntakeRequestEmail } from '@/lib/intakeEmail'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const body = await req.json()
  const channel: 'email' | 'text' = body.channel === 'text' ? 'text' : 'email'
  const recipientEmail: string = body.recipientEmail || ''
  const recipientPhone: string = body.recipientPhone || ''
  const quotedFee: number | null = body.quotedFee ? parseFloat(body.quotedFee) : null

  if (channel === 'email' && !recipientEmail.includes('@')) {
    return Response.json({ error: 'A valid recipient email is required' }, { status: 400 })
  }
  if (channel === 'text' && !recipientPhone.trim()) {
    return Response.json({ error: 'A recipient phone number is required' }, { status: 400 })
  }

  // If this email already belongs to exactly one of the practitioner's
  // spellers, attach the form to them — otherwise approving it created a
  // duplicate speller and the answers never reached the existing profile.
  // (Siblings can share a parent's email; then it stays unattached.)
  let studentId: string | null = null
  let linkedStudentName: string | null = null
  if (recipientEmail.includes('@')) {
    const { data: matches } = await getSupabase()
      .from('students')
      .select('id, name')
      .eq('practitioner_id', userId)
      .ilike('guardian_email', recipientEmail.trim())
    if (matches?.length === 1) { studentId = matches[0].id; linkedStudentName = matches[0].name }
  }

  const request = await createIntakeRequest(userId, {
    studentId,
    channel,
    recipientEmail: recipientEmail || null,
    recipientPhone: recipientPhone || null,
    quotedFee,
  })

  if (channel === 'email') {
    const result = await sendIntakeRequestEmail(request.id, userId)
    if ('error' in result) return Response.json({ error: result.error }, { status: 500 })
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wordups2c.com'
  return Response.json({ ok: true, token: request.token, link: `${origin}/intake/${request.token}`, linkedStudentName })
}
