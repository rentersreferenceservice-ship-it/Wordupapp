import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ybniybezkdpqkvhjrjdr.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_KEY)
}
