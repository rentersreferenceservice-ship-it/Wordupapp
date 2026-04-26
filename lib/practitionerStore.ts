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
  hunkNumber: number
  keyword?: string
  misspokeCount?: number
  questionType: string
  questionText: string
  expectedAnswer?: string
  capturedAnswer?: string
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
    createdAt: data.created_at,
  }
}

export async function createStudent(practitionerId: string, name: string, ageGroup: string, notes: string): Promise<Student> {
  const { data } = await getSupabase().from('students').insert({
    practitioner_id: practitionerId,
    name,
    age_group: ageGroup,
    notes,
  }).select().single()
  return {
    id: data.id,
    practitionerId: data.practitioner_id,
    name: data.name,
    ageGroup: data.age_group,
    notes: data.notes ?? '',
    createdAt: data.created_at,
  }
}

export async function updateStudent(id: string, name: string, ageGroup: string, notes: string): Promise<void> {
  await getSupabase().from('students').update({ name, age_group: ageGroup, notes }).eq('id', id)
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
  await getSupabase().from('session_responses').insert(
    responses.map(r => ({
      session_id: sessionId,
      hunk_number: r.hunkNumber,
      keyword: r.keyword,
      misspoke_count: r.misspokeCount,
      question_type: r.questionType,
      question_text: r.questionText,
      expected_answer: r.expectedAnswer,
      captured_answer: r.capturedAnswer,
    }))
  )
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
    hunkNumber: d.hunk_number,
    keyword: d.keyword,
    misspokeCount: d.misspoke_count,
    questionType: d.question_type,
    questionText: d.question_text,
    expectedAnswer: d.expected_answer,
    capturedAnswer: d.captured_answer,
  }))
}
