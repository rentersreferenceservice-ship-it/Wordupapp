import { randomBytes } from 'crypto'
import { getSupabase } from './supabase'
import { createStudent, updateStudent } from './practitionerStore'

export type IntakeChannel = 'email' | 'text'
export type IntakeStatus = 'sent' | 'submitted' | 'approved' | 'dismissed'

export interface IntakeRequest {
  id: string
  token: string
  practitionerId: string
  studentId: string | null
  channel: IntakeChannel
  recipientEmail: string | null
  recipientPhone: string | null
  quotedFee: number | null
  status: IntakeStatus
  submittedData: Record<string, unknown> | null
  fieldsNeedingReview: string[] | null
  sentAt: string
  submittedAt: string | null
  approvedAt: string | null
  reviewedBy: string | null
  createdStudentId: string | null
}

function mapRow(d: Record<string, unknown>): IntakeRequest {
  return {
    id: d.id as string,
    token: d.token as string,
    practitionerId: d.practitioner_id as string,
    studentId: (d.student_id as string | null) ?? null,
    channel: d.channel as IntakeChannel,
    recipientEmail: (d.recipient_email as string | null) ?? null,
    recipientPhone: (d.recipient_phone as string | null) ?? null,
    quotedFee: (d.quoted_fee as number | null) ?? null,
    status: d.status as IntakeStatus,
    submittedData: (d.submitted_data as Record<string, unknown> | null) ?? null,
    fieldsNeedingReview: (d.fields_needing_review as string[] | null) ?? null,
    sentAt: d.sent_at as string,
    submittedAt: (d.submitted_at as string | null) ?? null,
    approvedAt: (d.approved_at as string | null) ?? null,
    reviewedBy: (d.reviewed_by as string | null) ?? null,
    createdStudentId: (d.created_student_id as string | null) ?? null,
  }
}

export async function createIntakeRequest(practitionerId: string, opts: {
  studentId?: string | null
  channel: IntakeChannel
  recipientEmail?: string | null
  recipientPhone?: string | null
  quotedFee?: number | null
}): Promise<IntakeRequest> {
  const token = randomBytes(16).toString('hex')
  const { data, error } = await getSupabase()
    .from('intake_requests')
    .insert({
      token,
      practitioner_id: practitionerId,
      student_id: opts.studentId ?? null,
      channel: opts.channel,
      recipient_email: opts.recipientEmail ?? null,
      recipient_phone: opts.recipientPhone ?? null,
      quoted_fee: opts.quotedFee ?? null,
    })
    .select()
    .single()
  if (error || !data) throw new Error(error?.message ?? 'Failed to create intake request')
  return mapRow(data)
}

export interface IntakeRequestPublicInfo {
  mode: 'new' | 'existing'
  studentName: string | null
  quotedFee: number | null
  status: IntakeStatus
}

export async function getIntakeRequestByToken(token: string): Promise<IntakeRequestPublicInfo | null> {
  const supabase = getSupabase()
  const { data } = await supabase.from('intake_requests').select('*').eq('token', token).single()
  if (!data) return null
  const req = mapRow(data)

  let studentName: string | null = null
  if (req.studentId) {
    const { data: student } = await supabase.from('students').select('name').eq('id', req.studentId).single()
    studentName = student?.name ?? null
  }

  return {
    mode: req.studentId ? 'existing' : 'new',
    studentName,
    quotedFee: req.quotedFee,
    status: req.status,
  }
}

export async function submitIntakeResponse(
  token: string,
  answers: Record<string, unknown>,
  fieldsNeedingReview: string[]
): Promise<{ ok: true } | { error: string }> {
  const supabase = getSupabase()
  const { data: existing } = await supabase.from('intake_requests').select('status').eq('token', token).single()
  if (!existing) return { error: 'This link was not found. Ask your practitioner for a new one.' }
  if (existing.status !== 'sent') return { error: 'This form has already been submitted.' }

  const { error } = await supabase
    .from('intake_requests')
    .update({
      status: 'submitted',
      submitted_data: answers,
      fields_needing_review: fieldsNeedingReview,
      submitted_at: new Date().toISOString(),
    })
    .eq('token', token)
    .eq('status', 'sent')

  if (error) return { error: error.message }
  return { ok: true }
}

export async function getPendingIntakeRequests(practitionerId: string): Promise<IntakeRequest[]> {
  const { data } = await getSupabase()
    .from('intake_requests')
    .select('*')
    .eq('practitioner_id', practitionerId)
    .order('sent_at', { ascending: false })
  return (data ?? []).map(mapRow)
}

export async function getIntakeRequest(id: string, practitionerId: string): Promise<IntakeRequest | null> {
  const { data } = await getSupabase()
    .from('intake_requests')
    .select('*')
    .eq('id', id)
    .eq('practitioner_id', practitionerId)
    .single()
  if (!data) return null
  return mapRow(data)
}

export interface StudentProfile {
  studentId: string
  dob: string | null
  nickname: string | null
  guardianName: string | null
  guardianRelationship: string | null
  guardianPhone: string | null
  otherGuardian: string | null
  siblings: string | null
  familyDynamics: string | null
  interests: string | null
  strengths: string | null
  communicationToday: string | null
  diagnosis: string | null
  priorAacHistory: string | null
  s2cDuration: string | null
  wordUpDuration: string | null
  otherPractitioner: string | null
  crpsSupporting: string | null
  schoolSetting: Record<string, unknown> | null
  motorProfile: Record<string, unknown> | null
  sensoryProfile: Record<string, unknown> | null
  regulationProfile: Record<string, unknown> | null
  allergies: string | null
  foodAversions: string | null
  emergencyContact: Record<string, unknown> | null
  fieldsNeedingReview: string[]
  updatedAt: string
}

function mapProfileRow(d: Record<string, unknown>): StudentProfile {
  return {
    studentId: d.student_id as string,
    dob: (d.dob as string | null) ?? null,
    nickname: (d.nickname as string | null) ?? null,
    guardianName: (d.guardian_name as string | null) ?? null,
    guardianRelationship: (d.guardian_relationship as string | null) ?? null,
    guardianPhone: (d.guardian_phone as string | null) ?? null,
    otherGuardian: (d.other_guardian as string | null) ?? null,
    siblings: (d.siblings as string | null) ?? null,
    familyDynamics: (d.family_dynamics as string | null) ?? null,
    interests: (d.interests as string | null) ?? null,
    strengths: (d.strengths as string | null) ?? null,
    communicationToday: (d.communication_today as string | null) ?? null,
    diagnosis: (d.diagnosis as string | null) ?? null,
    priorAacHistory: (d.prior_aac_history as string | null) ?? null,
    s2cDuration: (d.s2c_duration as string | null) ?? null,
    wordUpDuration: (d.wordup_duration as string | null) ?? null,
    otherPractitioner: (d.other_practitioner as string | null) ?? null,
    crpsSupporting: (d.crps_supporting as string | null) ?? null,
    schoolSetting: (d.school_setting as Record<string, unknown> | null) ?? null,
    motorProfile: (d.motor_profile as Record<string, unknown> | null) ?? null,
    sensoryProfile: (d.sensory_profile as Record<string, unknown> | null) ?? null,
    regulationProfile: (d.regulation_profile as Record<string, unknown> | null) ?? null,
    allergies: (d.allergies as string | null) ?? null,
    foodAversions: (d.food_aversions as string | null) ?? null,
    emergencyContact: (d.emergency_contact as Record<string, unknown> | null) ?? null,
    fieldsNeedingReview: (d.fields_needing_review as string[] | null) ?? [],
    updatedAt: d.updated_at as string,
  }
}

export async function getStudentProfile(studentId: string): Promise<StudentProfile | null> {
  const { data } = await getSupabase().from('student_profiles').select('*').eq('student_id', studentId).single()
  if (!data) return null
  return mapProfileRow(data)
}

// Column names shared between `student_profiles` and the submitted intake
// answers — used by both the diff-review screen and the approve/merge step
// so they stay in sync with exactly one list.
export const PROFILE_FIELDS = [
  'dob', 'nickname', 'guardianName', 'guardianRelationship', 'guardianPhone',
  'otherGuardian', 'siblings', 'familyDynamics', 'interests', 'strengths',
  'communicationToday', 'diagnosis', 'priorAacHistory', 's2cDuration', 'wordUpDuration',
  'otherPractitioner', 'crpsSupporting', 'schoolSetting', 'motorProfile', 'sensoryProfile',
  'regulationProfile', 'allergies', 'foodAversions', 'emergencyContact',
] as const
export type ProfileField = typeof PROFILE_FIELDS[number]

const FIELD_TO_COLUMN: Record<ProfileField, string> = {
  dob: 'dob', nickname: 'nickname', guardianName: 'guardian_name',
  guardianRelationship: 'guardian_relationship', guardianPhone: 'guardian_phone',
  otherGuardian: 'other_guardian', siblings: 'siblings', familyDynamics: 'family_dynamics',
  interests: 'interests', strengths: 'strengths', communicationToday: 'communication_today',
  diagnosis: 'diagnosis', priorAacHistory: 'prior_aac_history', s2cDuration: 's2c_duration',
  wordUpDuration: 'wordup_duration', otherPractitioner: 'other_practitioner',
  crpsSupporting: 'crps_supporting', schoolSetting: 'school_setting', motorProfile: 'motor_profile',
  sensoryProfile: 'sensory_profile', regulationProfile: 'regulation_profile',
  allergies: 'allergies', foodAversions: 'food_aversions', emergencyContact: 'emergency_contact',
}

// Applies only the fields the practitioner explicitly resolved on the
// diff-review screen — never a blind overwrite of the whole submission.
export async function approveExistingClientIntake(
  intakeRequestId: string,
  practitionerId: string,
  resolvedFields: Partial<Record<ProfileField, unknown>>
): Promise<{ ok: true } | { error: string }> {
  const supabase = getSupabase()
  const request = await getIntakeRequest(intakeRequestId, practitionerId)
  if (!request || !request.studentId) return { error: 'Request not found' }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const field of Object.keys(resolvedFields) as ProfileField[]) {
    update[FIELD_TO_COLUMN[field]] = resolvedFields[field]
  }

  const { error: upsertError } = await supabase
    .from('student_profiles')
    .upsert({ student_id: request.studentId, ...update }, { onConflict: 'student_id' })
  if (upsertError) return { error: upsertError.message }

  const remainingReview = (request.fieldsNeedingReview ?? []).filter(f => !(f in resolvedFields))
  await supabase.from('student_profiles').update({ fields_needing_review: remainingReview }).eq('student_id', request.studentId)

  const { error: reqError } = await supabase
    .from('intake_requests')
    .update({ status: 'approved', approved_at: new Date().toISOString(), reviewed_by: practitionerId })
    .eq('id', intakeRequestId)
  if (reqError) return { error: reqError.message }

  return { ok: true }
}

export async function approveNewInquiryIntake(
  intakeRequestId: string,
  practitionerId: string,
  studentFields: { name: string; ageGroup: string; sessionRate?: number | null },
  profileFields: Partial<Record<ProfileField, unknown>>,
  fieldsNeedingReview: string[]
): Promise<{ ok: true; studentId: string } | { error: string }> {
  const supabase = getSupabase()
  const request = await getIntakeRequest(intakeRequestId, practitionerId)
  if (!request) return { error: 'Request not found' }
  if (request.studentId) return { error: 'This request is already linked to an existing student' }

  const student = await createStudent(practitionerId, studentFields.name, studentFields.ageGroup, '', request.recipientEmail ?? '')
  if (studentFields.sessionRate != null) {
    await updateStudent(student.id, student.name, student.ageGroup, student.notes, student.guardianEmail, '', '', studentFields.sessionRate, null)
  }

  const update: Record<string, unknown> = { student_id: student.id, updated_at: new Date().toISOString(), fields_needing_review: fieldsNeedingReview }
  for (const field of Object.keys(profileFields) as ProfileField[]) {
    update[FIELD_TO_COLUMN[field]] = profileFields[field]
  }
  const { error: profileError } = await supabase.from('student_profiles').insert(update)
  if (profileError) return { error: profileError.message }

  const { error: reqError } = await supabase
    .from('intake_requests')
    .update({ status: 'approved', approved_at: new Date().toISOString(), reviewed_by: practitionerId, created_student_id: student.id })
    .eq('id', intakeRequestId)
  if (reqError) return { error: reqError.message }

  return { ok: true, studentId: student.id }
}

export async function dismissIntakeRequest(id: string, practitionerId: string): Promise<{ ok: true } | { error: string }> {
  const { error } = await getSupabase()
    .from('intake_requests')
    .update({ status: 'dismissed' })
    .eq('id', id)
    .eq('practitioner_id', practitionerId)
  if (error) return { error: error.message }
  return { ok: true }
}
