import { getSupabase } from './supabase'

interface UserUsage {
  lessonsThisMonth: number
  printsThisMonth: number
  monthKey: string
  isSubscribed: boolean
}

function getMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export async function getUserUsage(userId: string): Promise<UserUsage> {
  const monthKey = getMonthKey()
  const { data } = await getSupabase().from('user_usage').select('*').eq('user_id', userId).single()
  if (!data || data.month_key !== monthKey) {
    return { lessonsThisMonth: 0, printsThisMonth: 0, monthKey, isSubscribed: data?.is_subscribed ?? false }
  }
  return {
    lessonsThisMonth: data.lessons_this_month,
    printsThisMonth: data.prints_this_month,
    monthKey: data.month_key,
    isSubscribed: data.is_subscribed,
  }
}

export async function incrementLessons(userId: string): Promise<void> {
  const monthKey = getMonthKey()
  const { data } = await getSupabase().from('user_usage').select('*').eq('user_id', userId).single()
  const isNewMonth = !data || data.month_key !== monthKey
  await getSupabase().from('user_usage').upsert({
    user_id: userId,
    lessons_this_month: isNewMonth ? 1 : data.lessons_this_month + 1,
    prints_this_month: isNewMonth ? 0 : data.prints_this_month,
    month_key: monthKey,
    is_subscribed: data?.is_subscribed ?? false,
  })
}

export async function incrementPrints(userId: string): Promise<void> {
  const monthKey = getMonthKey()
  const { data } = await getSupabase().from('user_usage').select('*').eq('user_id', userId).single()
  const isNewMonth = !data || data.month_key !== monthKey
  await getSupabase().from('user_usage').upsert({
    user_id: userId,
    lessons_this_month: isNewMonth ? 0 : data.lessons_this_month,
    prints_this_month: isNewMonth ? 1 : data.prints_this_month + 1,
    month_key: monthKey,
    is_subscribed: data?.is_subscribed ?? false,
  })
}

export async function setSubscribed(userId: string, subscribed: boolean): Promise<void> {
  const monthKey = getMonthKey()
  const { data } = await getSupabase().from('user_usage').select('*').eq('user_id', userId).single()
  const isNewMonth = !data || data.month_key !== monthKey
  await getSupabase().from('user_usage').upsert({
    user_id: userId,
    lessons_this_month: isNewMonth ? 0 : data.lessons_this_month,
    prints_this_month: isNewMonth ? 0 : data.prints_this_month,
    month_key: monthKey,
    is_subscribed: subscribed,
  })
}

export async function storePendingVerification(email: string, code: string): Promise<void> {
  await getSupabase().from('pending_verifications').upsert({
    email: email.toLowerCase(),
    code,
    expires: Date.now() + 10 * 60 * 1000,
  })
}

export async function verifyEmailCode(email: string, code: string): Promise<boolean> {
  const { data } = await getSupabase().from('pending_verifications').select('*').eq('email', email.toLowerCase()).single()
  if (!data) return false
  if (Date.now() > data.expires) return false
  if (data.code !== code) return false
  await getSupabase().from('pending_verifications').delete().eq('email', email.toLowerCase())
  const { data: existing } = await getSupabase().from('verified_emails').select('*').eq('email', email.toLowerCase()).single()
  if (!existing) {
    await getSupabase().from('verified_emails').insert({ email: email.toLowerCase(), lessons_used: 0 })
  }
  return true
}

export async function getVerifiedEmailUsage(email: string): Promise<number> {
  const { data } = await getSupabase().from('verified_emails').select('*').eq('email', email.toLowerCase()).single()
  if (!data) return -1
  return data.lessons_used
}

export async function incrementVerifiedEmailLesson(email: string): Promise<void> {
  const { data } = await getSupabase().from('verified_emails').select('*').eq('email', email.toLowerCase()).single()
  if (data) {
    await getSupabase().from('verified_emails').update({ lessons_used: data.lessons_used + 1 }).eq('email', email.toLowerCase())
  }
}

export const MONTHLY_LIMIT = 20
export const FREE_LESSON_LIMIT = 2
