import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sendInvoiceEmail } from '@/lib/invoiceEmail'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const body = await req.json()
  const result = await sendInvoiceEmail(invoiceId, userId, {
    funderEmail: body.funderEmail,
    guardianEmail: body.guardianEmail,
  })

  if ('error' in result) {
    const status = result.error === 'Not found' ? 404 : result.error === 'No valid recipient email' ? 400 : 500
    return Response.json({ error: result.error }, { status })
  }
  return Response.json(result)
}
