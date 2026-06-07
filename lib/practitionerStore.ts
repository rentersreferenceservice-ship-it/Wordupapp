import { getSupabase } from './supabase'

export type PractitionerTier = 'starter' | 'growing' | 'established' | 'agency'
export type BillingPeriod = 'monthly' | 'annual'

export const TIER_LIMITS: Record<PractitionerTier, number> = {
  starter: 10,
  growing: 25,
  established: 50,
  agency: 100,
}

export const TIER_PRICES: Record<PractitionerTier, { monthly: number; annual: number }> = {
  starter:     { monthly: 2999,  annual: 30589 },  // $29.99/mo, $305.89/yr (~15% off)
  growing:     { monthly: 6999,  annual: 71389 },  // $69.99/mo, $713.89/yr
  established: { monthly: 12999, annual: 132589 }, // $129.99/mo, $1325.89/yr
  agency:      { monthly: 24999, annual: 254989 }, // $249.99/mo, $2549.89/yr
}

export interface PractitionerSubscription {
  userId: string
  tier: PractitionerTier
  studentLimit: number
  isActive: boolean
  billingPeriod: BillingPeriod
}

export interface Student {
  id: string
  practitionerId: string
  name: string
  ageGroup: string
  notes: string
  guardianEmail: string
  funderName: string
  funderEmail: string
  sessionRate: number | null
  createdAt: string
}

export interface Session {
  id: string
  practitionerId: string
  studentId: string
  lessonId: string
  lessonTitle: string
  sessionDate: string
  createdAt: string
}

export interface SessionResponse {
  id: string
  sessionId: string
  hunkNumber: number | null
  keyword?: string
  misspokeCount?: number
  questionType: string
  questionText: string
  expectedAnswer?: string
  capturedAnswer?: string
  spellerSentence?: string
}

const ADMIN_USER_ID = 'user_3CDvdqpvQ2gtVYzPEzJZuleRX9p'

export async function getPractitionerSubscription(userId: string): Promise<PractitionerSubscription | null> {
  if (userId === ADMIN_USER_ID) {
    return { userId, tier: 'agency', studentLimit: 100, isActive: true, billingPeriod: 'monthly' }
  }
  const { data } = await getSupabase()
    .from('practitioner_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single()
  if (!data) return null
  return {
    userId: data.user_id,
    tier: data.tier,
    studentLimit: data.student_limit,
    isActive: data.is_active,
    billingPeriod: data.billing_period,
  }
}

export async function setPractitionerSubscription(
  userId: string,
  tier: PractitionerTier,
  billingPeriod: BillingPeriod,
  active: boolean
): Promise<void> {
  await getSupabase().from('practitioner_subscriptions').upsert({
    user_id: userId,
    tier,
    student_limit: TIER_LIMITS[tier],
    is_active: active,
    billing_period: billingPeriod,
  })
}

export async function getStudents(practitionerId: string): Promise<Student[]> {
  const { data } = await getSupabase()
    .from('students')
    .select('*')
    .eq('practitioner_id', practitionerId)
    .order('name')
  return (data ?? []).map(d => ({
    id: d.id,
    practitionerId: d.practitioner_id,
    name: d.name,
    ageGroup: d.age_group,
    notes: d.notes ?? '',
    guardianEmail: d.guardian_email ?? '',
    funderName: d.funder_name ?? '',
    funderEmail: d.funder_email ?? '',
    sessionRate: d.session_rate ?? null,
    createdAt: d.created_at,
  }))
}

export async function getStudent(id: string): Promise<Student | null> {
  const { data } = await getSupabase().from('students').select('*').eq('id', id).single()
  if (!data) return null
  return {
    id: data.id,
    practitionerId: data.practitioner_id,
    name: data.name,
    ageGroup: data.age_group,
    notes: data.notes ?? '',
    guardianEmail: data.guardian_email ?? '',
    funderName: data.funder_name ?? '',
    funderEmail: data.funder_email ?? '',
    sessionRate: data.session_rate ?? null,
    createdAt: data.created_at,
  }
}

export async function createStudent(practitionerId: string, name: string, ageGroup: string, notes: string, guardianEmail = ''): Promise<Student> {
  const { data } = await getSupabase().from('students').insert({
    practitioner_id: practitionerId,
    name,
    age_group: ageGroup,
    notes,
    guardian_email: guardianEmail,
  }).select().single()
  return {
    id: data.id,
    practitionerId: data.practitioner_id,
    name: data.name,
    ageGroup: data.age_group,
    notes: data.notes ?? '',
    guardianEmail: data.guardian_email ?? '',
    funderName: data.funder_name ?? '',
    funderEmail: data.funder_email ?? '',
    sessionRate: data.session_rate ?? null,
    createdAt: data.created_at,
  }
}

export async function updateStudent(id: string, name: string, ageGroup: string, notes: string, guardianEmail = '', funderName = '', funderEmail = '', sessionRate: number | null = null): Promise<void> {
  await getSupabase().from('students').update({
    name,
    age_group: ageGroup,
    notes,
    guardian_email: guardianEmail,
    funder_name: funderName || null,
    funder_email: funderEmail || null,
    session_rate: sessionRate,
  }).eq('id', id)
}

export async function deleteStudent(id: string): Promise<void> {
  await getSupabase().from('students').delete().eq('id', id)
}

export async function getSessions(practitionerId: string, studentId?: string): Promise<Session[]> {
  let query = getSupabase().from('sessions').select('*').eq('practitioner_id', practitionerId)
  if (studentId) query = query.eq('student_id', studentId)
  const { data } = await query.order('session_date', { ascending: false })
  return (data ?? []).map(d => ({
    id: d.id,
    practitionerId: d.practitioner_id,
    studentId: d.student_id,
    lessonId: d.lesson_id,
    lessonTitle: d.lesson_title,
    sessionDate: d.session_date,
    createdAt: d.created_at,
  }))
}

export async function createSession(
  practitionerId: string,
  studentId: string,
  lessonId: string,
  lessonTitle: string,
  sessionDate: string
): Promise<string> {
  const { data } = await getSupabase().from('sessions').insert({
    practitioner_id: practitionerId,
    student_id: studentId,
    lesson_id: lessonId,
    lesson_title: lessonTitle,
    session_date: sessionDate,
  }).select().single()
  return data.id
}

export async function saveSessionResponses(sessionId: string, responses: Omit<SessionResponse, 'id' | 'sessionId'>[]): Promise<void> {
  if (responses.length === 0) return

  // Deduplicate EXTRA_SPELLING rows — the Edit Transcript client historically sent
  // each extra keyword twice (once from the main response loop, once from the
  // extraKeywords loop), causing the count to double on every save.
  const seenExtra = new Set<string>()
  const deduped = responses.filter(r => {
    if (r.questionType !== 'EXTRA_SPELLING') return true
    const word = (r.keyword ?? '').trim()
    if (!word) return false
    const key = `${r.hunkNumber}:${word.toUpperCase()}`
    if (seenExtra.has(key)) return false
    seenExtra.add(key)
    return true
  })

  // Separate special session-level records (hunkNumber 0) from regular hunk responses.
  // Insert regular records first, then special ones — so a constraint on hunk_number
  // doesn't wipe the session data.
  const regularRows = deduped.filter(r => (r.hunkNumber ?? 0) > 0)
  const specialRows = deduped.filter(r => (r.hunkNumber ?? 0) === 0)

  const toRow = (r: Omit<SessionResponse, 'id' | 'sessionId'>) => ({
    session_id: sessionId,
    hunk_number: (r.hunkNumber ?? 0) > 0 ? r.hunkNumber : -1,
    keyword: r.keyword ?? null,
    misspoke_count: r.misspokeCount ?? 0,
    question_type: r.questionType,
    question_text: r.questionText,
    expected_answer: r.expectedAnswer ?? null,
    captured_answer: r.capturedAnswer ?? null,
    speller_sentence: r.spellerSentence ?? null,
  })

  const { error: deleteError } = await getSupabase()
    .from('session_responses').delete().eq('session_id', sessionId)
  if (deleteError) throw new Error(`Delete failed: ${deleteError.message}`)

  if (regularRows.length > 0) {
    const { error } = await getSupabase().from('session_responses').insert(regularRows.map(toRow))
    if (error) throw new Error(`Insert failed: ${error.message}`)
  }

  if (specialRows.length > 0) {
    const { error } = await getSupabase().from('session_responses').insert(specialRows.map(toRow))
    if (error) throw new Error(`Notes/state save failed: ${error.message}`)
  }
}

export async function getCompletedSessionIds(sessionIds: string[]): Promise<Set<string>> {
  if (sessionIds.length === 0) return new Set()
  const { data } = await getSupabase()
    .from('session_responses')
    .select('session_id')
    .in('session_id', sessionIds)
    .eq('question_type', 'SESSION_COMPLETE')
  return new Set((data ?? []).map((d: { session_id: string }) => d.session_id))
}

export interface CRP {
  id: string
  studentId: string
  practitionerId: string
  name: string
  color: string
  createdAt: string
}

export const CRP_COLORS = ['#16a34a', '#ea580c', '#7c3aed', '#db2777', '#0891b2', '#ca8a04']

export async function getCrps(studentId: string, practitionerId: string): Promise<CRP[]> {
  const { data } = await getSupabase()
    .from('crps')
    .select('*')
    .eq('student_id', studentId)
    .eq('practitioner_id', practitionerId)
    .order('created_at')
  return (data ?? []).map(d => ({
    id: d.id,
    studentId: d.student_id,
    practitionerId: d.practitioner_id,
    name: d.name,
    color: d.color,
    createdAt: d.created_at,
  }))
}

export async function createCrp(studentId: string, practitionerId: string, name: string, color: string): Promise<CRP> {
  const { data } = await getSupabase().from('crps').insert({
    student_id: studentId,
    practitioner_id: practitionerId,
    name,
    color,
  }).select().single()
  return {
    id: data.id,
    studentId: data.student_id,
    practitionerId: data.practitioner_id,
    name: data.name,
    color: data.color,
    createdAt: data.created_at,
  }
}

export async function deleteCrp(id: string): Promise<void> {
  await getSupabase().from('crps').delete().eq('id', id)
}

export interface SessionAccuracy {
  sessionId: string
  date: string
  accuracy: number
  lessonTitle: string
  regulationArrival: string | null
  regulationDeparture: string | null
  crpId: string | null
  crpName: string | null
  crpColor: string | null
}

export async function getStudentAccuracyHistory(studentId: string, practitionerId: string): Promise<SessionAccuracy[]> {
  const cutoff = new Date()
  cutoff.setFullYear(cutoff.getFullYear() - 1)

  const { data: sessions } = await getSupabase()
    .from('sessions')
    .select('id, session_date, lesson_title, regulation_arrival, regulation_departure, crp_id')
    .eq('student_id', studentId)
    .eq('practitioner_id', practitionerId)
    .gte('session_date', cutoff.toISOString().split('T')[0])
    .order('session_date')

  if (!sessions?.length) return []

  const sessionIds = sessions.map(s => s.id)

  const { data: responses } = await getSupabase()
    .from('session_responses')
    .select('session_id, question_type, keyword, misspoke_count, expected_answer, captured_answer')
    .in('session_id', sessionIds)
    .in('question_type', ['KEYWORD', 'KNOWN'])
    .gt('hunk_number', 0)

  const crpIds = [...new Set((sessions ?? []).map(s => s.crp_id).filter(Boolean))]
  const crpMap: Record<string, { name: string; color: string }> = {}
  if (crpIds.length > 0) {
    const { data: crpRows } = await getSupabase().from('crps').select('id, name, color').in('id', crpIds)
    for (const c of crpRows ?? []) crpMap[c.id] = { name: c.name, color: c.color }
  }

  type RawResponse = { session_id: string; question_type: string; keyword: string | null; misspoke_count: number | null; expected_answer: string | null; captured_answer: string | null }
  const bySession: Record<string, RawResponse[]> = {}
  for (const r of responses ?? []) {
    if (!bySession[r.session_id]) bySession[r.session_id] = []
    bySession[r.session_id].push(r as RawResponse)
  }

  return sessions!.flatMap(s => {
    const rs = bySession[s.id] ?? []
    const kw = rs.filter(r => r.question_type === 'KEYWORD' && r.captured_answer !== 'SKIPPED')
    const kn = rs.filter(r => r.question_type === 'KNOWN' && r.captured_answer !== 'NOT_ASKED')
    const letters =
      kw.reduce((sum, k) => sum + (k.keyword ?? '').replace(/\s/g, '').length, 0) +
      kn.reduce((sum, q) => sum + (q.expected_answer ?? '').split('/').reduce((acc: number, a: string) => acc + a.trim().replace(/\s/g, '').length, 0), 0)
    const misspokes = [...kw, ...kn].reduce((sum, r) => sum + (r.misspoke_count ?? 0), 0)
    const pokes = letters + misspokes
    if (pokes === 0) return []
    const crp = s.crp_id ? crpMap[s.crp_id] : null
    return [{ sessionId: s.id, date: s.session_date, accuracy: Math.round((letters / pokes) * 100), lessonTitle: s.lesson_title, regulationArrival: s.regulation_arrival ?? null, regulationDeparture: s.regulation_departure ?? null, crpId: s.crp_id ?? null, crpName: crp?.name ?? null, crpColor: crp?.color ?? null }]
  })
}

export async function getSessionResponses(sessionId: string): Promise<SessionResponse[]> {
  const { data } = await getSupabase()
    .from('session_responses')
    .select('*')
    .eq('session_id', sessionId)
    .order('hunk_number')
  return (data ?? []).map(d => ({
    id: d.id,
    sessionId: d.session_id,
    hunkNumber: d.hunk_number < 0 ? null : d.hunk_number,
    keyword: d.keyword,
    misspokeCount: d.misspoke_count,
    questionType: d.question_type,
    questionText: d.question_text,
    expectedAnswer: d.expected_answer,
    capturedAnswer: d.captured_answer,
    spellerSentence: d.speller_sentence ?? undefined,
  }))
}

export async function updateSpellerSentence(sessionId: string, responseId: string, sentence: string): Promise<void> {
  const { error } = await getSupabase()
    .from('session_responses')
    .update({ speller_sentence: sentence || null })
    .eq('id', responseId)
    .eq('session_id', sessionId)
  if (error) throw new Error(`Update failed: ${error.message}`)
}
