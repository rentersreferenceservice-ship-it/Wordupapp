import { getSupabase } from './supabase'

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateCode(): string {
  return Array.from({ length: 8 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('')
}

export async function getPractitionerCode(practitionerId: string) {
  const { data } = await getSupabase()
    .from('access_codes')
    .select('*')
    .eq('created_by', practitionerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  return data as { id: string; code: string; is_active: boolean; created_at: string } | null
}

export async function createAccessCode(practitionerId: string): Promise<string> {
  const code = generateCode()
  await getSupabase()
    .from('access_codes')
    .update({ is_active: false })
    .eq('created_by', practitionerId)
  await getSupabase()
    .from('access_codes')
    .insert({ code, created_by: practitionerId, is_active: true })
  return code
}

export async function toggleAccessCode(codeId: string, isActive: boolean): Promise<void> {
  await getSupabase()
    .from('access_codes')
    .update({ is_active: isActive })
    .eq('id', codeId)
}

export async function validateCode(code: string): Promise<boolean> {
  const { data } = await getSupabase()
    .from('access_codes')
    .select('is_active')
    .eq('code', code.toUpperCase().trim())
    .single()
  return data?.is_active === true
}

export async function redeemCode(code: string, userId: string): Promise<{ ok: boolean; error?: string }> {
  const valid = await validateCode(code)
  if (!valid) return { ok: false, error: 'This code is invalid or has been deactivated.' }
  const { error } = await getSupabase()
    .from('code_redemptions')
    .upsert({ code: code.toUpperCase().trim(), user_id: userId }, { onConflict: 'user_id' })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function hasActiveRedemption(userId: string): Promise<boolean> {
  const { data } = await getSupabase()
    .from('code_redemptions')
    .select('is_active')
    .eq('user_id', userId)
    .single()
  return data?.is_active !== false
}

export async function toggleFamilyAccess(userId: string, isActive: boolean): Promise<void> {
  await getSupabase()
    .from('code_redemptions')
    .update({ is_active: isActive })
    .eq('user_id', userId)
}
