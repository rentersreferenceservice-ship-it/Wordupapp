import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getIntakeRequest, getStudentProfile, type ProfileField } from '@/lib/intakeStore'
import { getSupabase } from '@/lib/supabase'
import ReviewExistingClient from './ReviewExistingClient'
import ReviewNewInquiry from './ReviewNewInquiry'

export const dynamic = 'force-dynamic'

export interface DiffEntry {
  field: ProfileField
  label: string
  oldValue: string
  newValue: string
}

function describe(value: unknown): string {
  if (value == null || value === '') return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).filter(Boolean).join(' · ')
  }
  return String(value)
}

const FIELD_LABELS: Record<ProfileField, string> = {
  dob: 'Date of birth', nickname: 'Nickname',
  guardianName: 'Guardian name', guardianRelationship: 'Relationship to child', guardianPhone: 'Guardian phone',
  otherGuardian: 'Other parent/guardian', siblings: 'Siblings', familyDynamics: 'Family dynamics',
  interests: 'Interests', strengths: 'Strengths',
  communicationToday: 'Communication today', diagnosis: 'Diagnosis', priorAacHistory: 'Prior AAC history',
  s2cDuration: 'Time using Spelling to Communicate', wordUpDuration: 'Time with Word Up',
  otherPractitioner: 'Other practitioner', crpsSupporting: 'CRPs supporting',
  schoolSetting: 'School & educational setting', motorProfile: 'Motor profile', sensoryProfile: 'Sensory profile',
  regulationProfile: 'Regulation', allergies: 'Allergies', foodAversions: 'Food aversions',
  emergencyContact: 'Emergency contact',
}

// Maps the flat answer keys from the public form into the grouped
// student_profiles columns they belong to.
function buildSubmittedProfileValues(answers: Record<string, unknown>): Partial<Record<ProfileField, unknown>> {
  return {
    dob: answers.dob || undefined,
    nickname: answers.nickname || undefined,
    guardianName: answers.guardianName || undefined,
    guardianRelationship: answers.guardianRelationship || undefined,
    guardianPhone: answers.guardianPhone || undefined,
    otherGuardian: answers.otherGuardian || undefined,
    siblings: answers.siblings || undefined,
    familyDynamics: answers.familyDynamics || undefined,
    interests: answers.interests || undefined,
    strengths: answers.strengths || undefined,
    communicationToday: answers.communicationToday || undefined,
    diagnosis: answers.diagnosis || undefined,
    priorAacHistory: answers.priorAacHistory || undefined,
    s2cDuration: answers.s2cDuration || undefined,
    wordUpDuration: answers.wordUpDuration || undefined,
    otherPractitioner: answers.otherPractitioner || undefined,
    crpsSupporting: answers.crpsSupporting || undefined,
    schoolSetting: {
      status: answers.schoolStatus, classroomSetting: answers.classroomSetting,
      oneOnOne: answers.oneOnOne, notes: answers.schoolNotes,
    },
    motorProfile: { fine: answers.motorFine, gross: answers.motorGross, planning: answers.motorPlanning },
    sensoryProfile: {
      seek: answers.sensorySeek, avoid: answers.sensoryAvoid,
      stimming: answers.stimming, triggers: answers.sensoryTriggers,
    },
    regulationProfile: { signs: answers.regSigns, helps: answers.regHelps, avoid: answers.regAvoid },
    allergies: answers.allergies || undefined,
    foodAversions: answers.foodAversions || undefined,
    emergencyContact: { name: answers.emergencyName, phone: answers.emergencyPhone },
  }
}

const FLAT_TO_GROUP: Record<string, ProfileField> = {
  dob: 'dob', guardianRelationship: 'guardianRelationship', guardianPhone: 'guardianPhone',
  otherGuardian: 'otherGuardian', siblings: 'siblings', familyDynamics: 'familyDynamics',
  interests: 'interests', strengths: 'strengths', communicationToday: 'communicationToday',
  diagnosis: 'diagnosis', priorAacHistory: 'priorAacHistory', s2cDuration: 's2cDuration',
  wordUpDuration: 'wordUpDuration', otherPractitioner: 'otherPractitioner', crpsSupporting: 'crpsSupporting',
  schoolStatus: 'schoolSetting', classroomSetting: 'schoolSetting', oneOnOne: 'schoolSetting',
  motorFine: 'motorProfile', motorGross: 'motorProfile', motorPlanning: 'motorProfile',
  sensorySeek: 'sensoryProfile', sensoryAvoid: 'sensoryProfile', stimming: 'sensoryProfile', sensoryTriggers: 'sensoryProfile',
  regSigns: 'regulationProfile', regHelps: 'regulationProfile', regAvoid: 'regulationProfile',
  allergies: 'allergies', foodAversions: 'foodAversions',
  emergencyName: 'emergencyContact', emergencyPhone: 'emergencyContact',
}

function groupFieldsNeedingReview(flatFields: string[]): string[] {
  return [...new Set(flatFields.map(f => FLAT_TO_GROUP[f]).filter(Boolean))]
}

export default async function ReviewInquiryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) redirect('/practitioner/get-started')

  const request = await getIntakeRequest(id, userId)
  if (!request || request.status !== 'submitted') redirect('/practitioner/inquiries')

  const answers = (request.submittedData ?? {}) as Record<string, unknown>
  const submittedProfile = buildSubmittedProfileValues(answers)

  if (request.studentId) {
    const [{ data: student }, currentProfile] = await Promise.all([
      getSupabase().from('students').select('name').eq('id', request.studentId).single(),
      getStudentProfile(request.studentId),
    ])

    const entries: DiffEntry[] = (Object.keys(submittedProfile) as ProfileField[]).map(field => {
      const newValue = describe(submittedProfile[field])
      const oldValue = describe(currentProfile ? (currentProfile as unknown as Record<string, unknown>)[field] : null)
      return { field, label: FIELD_LABELS[field], oldValue, newValue }
    }).filter(e => e.newValue || e.oldValue)

    return (
      <main className="min-h-screen px-6 py-8 max-w-2xl mx-auto">
        <Link href="/practitioner/inquiries" className="text-sm text-blue-600 hover:underline mb-4 block">← Pending Inquiries</Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Review update — {student?.name ?? 'Student'}</h1>
        <p className="text-sm text-gray-500 mb-6">For anything that already had a value, choose which to keep. Blank fields get filled in automatically.</p>
        <ReviewExistingClient requestId={id} entries={entries} submittedValues={submittedProfile} />
      </main>
    )
  }

  return (
    <main className="min-h-screen px-6 py-8 max-w-2xl mx-auto">
      <Link href="/practitioner/inquiries" className="text-sm text-blue-600 hover:underline mb-4 block">← Pending Inquiries</Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Review new inquiry</h1>
      <p className="text-sm text-gray-500 mb-6">Approving will create a new student record.</p>
      <ReviewNewInquiry
        requestId={id}
        answers={answers}
        submittedProfile={submittedProfile}
        quotedFee={request.quotedFee}
        fieldLabels={FIELD_LABELS}
        fieldsNeedingReview={groupFieldsNeedingReview(request.fieldsNeedingReview ?? [])}
      />
    </main>
  )
}
