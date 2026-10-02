import type { StudentProfile } from '@/lib/intakeStore'

function Badge() {
  return <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full ml-2">Needs review</span>
}

function Row({ label, value, needsReview }: { label: string; value: string | null | undefined; needsReview: boolean }) {
  if (!value && !needsReview) return null
  return (
    <div className="py-2 border-b border-gray-50 last:border-0">
      <div className="flex items-center">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        {needsReview && <Badge />}
      </div>
      <p className="text-sm text-gray-700 mt-0.5">{value || '—'}</p>
    </div>
  )
}

export default function StudentProfileSection({ profile }: { profile: StudentProfile | null }) {
  if (!profile) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Client Profile</h2>
        <p className="text-sm text-gray-400">No intake profile on file yet — use &quot;Request Updated Info&quot; above to collect one.</p>
      </div>
    )
  }

  const needs = new Set(profile.fieldsNeedingReview)
  const school = profile.schoolSetting as { status?: string; classroomSetting?: string; oneOnOne?: string; notes?: string } | null
  const motor = profile.motorProfile as { fine?: string; gross?: string; planning?: string } | null
  const sensory = profile.sensoryProfile as { seek?: string; avoid?: string; stimming?: string; triggers?: string } | null
  const regulation = profile.regulationProfile as { signs?: string; helps?: string; avoid?: string } | null
  const emergency = profile.emergencyContact as { name?: string; phone?: string } | null

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">Client Profile</h2>
        <span className="text-xs text-gray-400">Updated {new Date(profile.updatedAt).toLocaleDateString()}</span>
      </div>

      <Row label="Date of birth" value={profile.dob} needsReview={needs.has('dob')} />
      <Row label="Nickname" value={profile.nickname} needsReview={false} />
      <Row label="Guardian" value={[profile.guardianName, profile.guardianRelationship].filter(Boolean).join(' — ')} needsReview={needs.has('guardianName')} />
      <Row label="Guardian phone" value={profile.guardianPhone} needsReview={needs.has('guardianPhone')} />
      <Row label="Other parent/guardian" value={profile.otherGuardian} needsReview={needs.has('otherGuardian')} />
      <Row label="Siblings" value={profile.siblings} needsReview={needs.has('siblings')} />
      <Row label="Family dynamics" value={profile.familyDynamics} needsReview={needs.has('familyDynamics')} />
      <Row label="Interests" value={profile.interests} needsReview={needs.has('interests')} />
      <Row label="Strengths" value={profile.strengths} needsReview={needs.has('strengths')} />
      <Row label="Communication today" value={profile.communicationToday} needsReview={needs.has('communicationToday')} />
      <Row label="Diagnosis" value={profile.diagnosis} needsReview={needs.has('diagnosis')} />
      <Row label="Prior AAC history" value={profile.priorAacHistory} needsReview={needs.has('priorAacHistory')} />
      <Row label="Using Spelling to Communicate" value={profile.s2cDuration} needsReview={needs.has('s2cDuration')} />
      <Row label="Working with Word Up" value={profile.wordUpDuration} needsReview={needs.has('wordUpDuration')} />
      <Row label="Other practitioner" value={profile.otherPractitioner} needsReview={needs.has('otherPractitioner')} />
      <Row label="CRPs" value={profile.crpsSupporting} needsReview={needs.has('crpsSupporting')} />
      <Row label="School status" value={school?.status} needsReview={needs.has('schoolSetting')} />
      <Row label="Classroom setting" value={school?.classroomSetting} needsReview={needs.has('schoolSetting')} />
      <Row label="One-on-one aide" value={school?.oneOnOne} needsReview={needs.has('schoolSetting')} />
      <Row label="School notes" value={school?.notes} needsReview={needs.has('schoolSetting')} />
      <Row label="Fine motor" value={motor?.fine} needsReview={needs.has('motorProfile')} />
      <Row label="Gross motor" value={motor?.gross} needsReview={needs.has('motorProfile')} />
      <Row label="Motor planning" value={motor?.planning} needsReview={needs.has('motorProfile')} />
      <Row label="Sensory seeking" value={sensory?.seek} needsReview={needs.has('sensoryProfile')} />
      <Row label="Sensory avoiding" value={sensory?.avoid} needsReview={needs.has('sensoryProfile')} />
      <Row label="Stimming" value={sensory?.stimming} needsReview={needs.has('sensoryProfile')} />
      <Row label="Sensory triggers" value={sensory?.triggers} needsReview={needs.has('sensoryProfile')} />
      <Row label="Dysregulation signs" value={regulation?.signs} needsReview={needs.has('regulationProfile')} />
      <Row label="What helps regulate" value={regulation?.helps} needsReview={needs.has('regulationProfile')} />
      <Row label="What to avoid" value={regulation?.avoid} needsReview={needs.has('regulationProfile')} />
      <Row label="Allergies" value={profile.allergies} needsReview={needs.has('allergies')} />
      <Row label="Food aversions" value={profile.foodAversions} needsReview={needs.has('foodAversions')} />
      <Row label="Emergency contact" value={[emergency?.name, emergency?.phone].filter(Boolean).join(' — ')} needsReview={needs.has('emergencyContact')} />
    </div>
  )
}
