import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ybniybezkdpqkvhjrjdr.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlibml5YmV6a2RwcWt2aGpyamRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjA1NzkwOCwiZXhwIjoyMDkxNjMzOTA4fQ.hNjjxhJZYlFr1y5yKzEjagyjgH28Hf9HAcWK7tUAIrI'

export function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_KEY)
}
