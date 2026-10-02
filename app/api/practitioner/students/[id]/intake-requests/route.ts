import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { createIntakeRequest } from '@/lib/intakeStore'
import { sendIntakeRequestEmail } from '@/lib/intakeEmail'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: studentId } = await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const { data: student } = await getSupabase()
    .from('students')
    .select('id, guardian_email')
    .eq('id', studentId)
    .eq('practitioner_id', userId)
    .single()
  if (!student) return Response.json({ error: 'Student not found' }, { status: 404 })

  const body = await req.json()
  const channel: 'email' | 'text' = body.channel === 'text' ? 'text' : 'email'
  const recipientEmail: string = body.recipientEmail || student.guardian_email || ''
  const recipientPhone: string = body.recipientPhone || ''

  if (channel === 'email' && !recipientEmail.includes('@')) {
    return Response.json({ error: 'A valid recipient email is required' }, { status: 400 })
  }

  const request = await createIntakeRequest(userId, {
    studentId,
    channel,
    recipientEmail: recipientEmail || null,
    recipientPhone: recipientPhone || null,
  })

  if (channel === 'email') {
    const result = await sendIntakeRequestEmail(request.id, userId)
    if ('error' in result) return Response.json({ error: result.error }, { status: 500 })
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wordups2c.com'
  return Response.json({ ok: true, token: request.token, link: `${origin}/intake/${request.token}` })
}
