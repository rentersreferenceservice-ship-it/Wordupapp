import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const ADMIN_USER_ID = 'user_3CDvdqpvQ2gtVYzPEzJZuleRX9p'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const { data } = await getSupabase()
    .from('practitioner_settings')
    .select('*')
    .eq('practitioner_id', userId)
    .single()

  if (!data) {
    return Response.json({
      settings: {
        businessName: '',
        businessAddress: '',
        businessPhone: '',
        businessEmail: '',
        sessionRate: '',
        paymentTerms: 'Due upon receipt',
        nextInvoiceNumber: userId === ADMIN_USER_ID ? 501 : 101,
        logoUrl: '',
        websiteUrl: '',
      }
    })
  }

  return Response.json({
    settings: {
      businessName: data.business_name,
      businessAddress: data.business_address,
      businessPhone: data.business_phone,
      businessEmail: data.business_email,
      sessionRate: data.session_rate,
      paymentTerms: data.payment_terms,
      nextInvoiceNumber: data.next_invoice_number,
      logoUrl: data.logo_url ?? '',
      websiteUrl: data.website_url ?? '',
    }
  })
}

export async function PUT(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const { businessName, businessAddress, businessPhone, businessEmail, sessionRate, paymentTerms, nextInvoiceNumber, logoUrl, websiteUrl } = await req.json()

  const { error } = await getSupabase()
    .from('practitioner_settings')
    .upsert({
      practitioner_id: userId,
      business_name: businessName ?? '',
      business_address: businessAddress ?? '',
      business_phone: businessPhone ?? '',
      business_email: businessEmail ?? '',
      session_rate: parseFloat(sessionRate) || 0,
      payment_terms: paymentTerms ?? 'Due upon receipt',
      next_invoice_number: parseInt(nextInvoiceNumber) || 101,
      logo_url: logoUrl || null,
      website_url: websiteUrl || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'practitioner_id' })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
