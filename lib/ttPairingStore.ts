import { getSupabase } from './supabase'

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I

function generateCode(): string {
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  }
  return code
}

// One persistent code per student — reused for every session and for open family
// use, so a saved link never goes dead once a particular session ends.
export async function getOrCreatePairingForStudent(
  practitionerId: string,
  studentId: string,
  sessionId: string | null = null
): Promise<{ code: string } | { error: string }> {
  const supabase = getSupabase()

  const { data: existing } = await supabase.from('tt_session_pairings').select('code').eq('student_id', studentId).single()
  if (existing) {
    if (sessionId) await supabase.from('tt_session_pairings').update({ session_id: sessionId }).eq('student_id', studentId)
    return { code: existing.code }
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode()
    const { data: created, error } = await supabase
      .from('tt_session_pairings')
      .insert({ session_id: sessionId, code, practitioner_id: practitionerId, student_id: studentId })
      .select('code')
      .single()
    if (created) return { code: created.code }
    if (error?.code !== '23505') return { error: error?.message ?? 'Failed to create pairing' }
    // 23505 = unique_violation (code collision) — retry with a new code
  }

  return { error: 'Failed to generate a unique code' }
}
