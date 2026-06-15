import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const { data, error } = await getSupabase()
    .from('expenses')
    .select('*')
    .eq('practitioner_id', userId)
    .order('date', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ expenses: data ?? [] })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Not logged in' }, { status: 401 })

  const { date, category, description, amount, receiptUrl, isRecurring, recurringPeriod } = await req.json()
  if (!date || !category || !description || amount == null) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await getSupabase()
    .from('expenses')
    .insert({
      practitioner_id: userId,
      date,
      category,
      description,
      amount: parseFloat(String(amount)),
      receipt_url: receiptUrl ?? null,
      is_recurring: isRecurring ?? false,
      recurring_period: isRecurring ? (recurringPeriod ?? 'monthly') : null,
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ expense: data })
}
