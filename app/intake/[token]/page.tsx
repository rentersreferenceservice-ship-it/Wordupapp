'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface Answers {
  childName: string
  dob: string
  nickname: string
  guardianName: string
  guardianRelationship: string
  guardianEmail: string
  guardianPhone: string
  otherGuardian: string
  siblings: string
  familyDynamics: string
  interests: string
  strengths: string
  communicationToday: string
  diagnosis: string
  priorAacHistory: string
  s2cDuration: string
  wordUpDuration: string
  otherPractitioner: string
  crpsSupporting: string
  schoolStatus: string
  classroomSetting: string
  oneOnOne: string
  schoolNotes: string
  motorFine: string
  motorGross: string
  motorPlanning: string
  sensorySeek: string
  sensoryAvoid: string
  stimming: string
  sensoryTriggers: string
  regSigns: string
  regHelps: string
  regAvoid: string
  allergies: string
  foodAversions: string
  emergencyName: string
  emergencyPhone: string
}

const INIT: Answers = {
  childName: '', dob: '', nickname: '',
  guardianName: '', guardianRelationship: '', guardianEmail: '', guardianPhone: '',
  otherGuardian: '', siblings: '', familyDynamics: '',
  interests: '', strengths: '',
  communicationToday: '', diagnosis: '', priorAacHistory: '', s2cDuration: '', wordUpDuration: '', otherPractitioner: '', crpsSupporting: '',
  schoolStatus: '', classroomSetting: '', oneOnOne: '', schoolNotes: '',
  motorFine: '', motorGross: '', motorPlanning: '',
  sensorySeek: '', sensoryAvoid: '', stimming: '', sensoryTriggers: '',
  regSigns: '', regHelps: '', regAvoid: '',
  allergies: '', foodAversions: '',
  emergencyName: '', emergencyPhone: '',
}

// Fields a practitioner would actually want flagged if left blank — not
// every key (childName/guardianName are required separately, and a few
// fields are genuinely fine to skip without a flag, like nickname).
const REVIEWABLE_FIELDS: (keyof Answers)[] = [
  'dob', 'guardianRelationship', 'guardianEmail', 'guardianPhone',
  'otherGuardian', 'siblings', 'familyDynamics', 'interests', 'strengths',
  'communicationToday', 'diagnosis', 'priorAacHistory', 's2cDuration', 'wordUpDuration',
  'otherPractitioner', 'crpsSupporting',
  'schoolStatus', 'classroomSetting', 'oneOnOne',
  'motorFine', 'motorGross', 'motorPlanning',
  'sensorySeek', 'sensoryAvoid', 'stimming', 'sensoryTriggers',
  'regSigns', 'regHelps', 'regAvoid',
  'allergies', 'foodAversions', 'emergencyName', 'emergencyPhone',
]

function FieldInput({ label, value, onChange, placeholder, opt }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; opt?: boolean }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label} {opt && <span className="text-gray-400 font-normal">(optional)</span>}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
    </div>
  )
}

function FieldArea({ label, value, onChange, placeholder, opt }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; opt?: boolean }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label} {opt && <span className="text-gray-400 font-normal">(optional)</span>}</label>
      <textarea rows={3} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
    </div>
  )
}

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-6 mb-5">
      <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
      {sub && <p className="text-sm text-gray-500 mb-4">{sub}</p>}
      {children}
    </section>
  )
}

export default function IntakeForm() {
  const params = useParams()
  const token = params.token as string

  const [mode, setMode] = useState<'new' | 'existing' | null>(null)
  const [studentName, setStudentName] = useState<string | null>(null)
  const [quotedFee, setQuotedFee] = useState<number | null>(null)
  const [invalid, setInvalid] = useState(false)
  const [a, setA] = useState<Answers>(INIT)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/intake/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setInvalid(true); return }
        setMode(d.mode)
        setStudentName(d.studentName)
        setQuotedFee(d.quotedFee)
      })
      .catch(() => setInvalid(true))
  }, [token])

  function set<K extends keyof Answers>(key: K, val: Answers[K]) {
    setA(prev => ({ ...prev, [key]: val }))
  }

  async function handleSubmit() {
    if (!a.childName.trim()) { setError("Please enter your non-speaker's name before submitting."); return }
    if (!a.guardianName.trim()) { setError('Please enter your name before submitting.'); return }
    setSubmitting(true)
    setError('')
    try {
      const fieldsNeedingReview = REVIEWABLE_FIELDS.filter(f => !a[f]?.trim())
      const res = await fetch(`/api/intake/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: a, fieldsNeedingReview }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Submission failed')
      setSubmitted(true)
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  if (invalid) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-800 mb-2">This link is not valid.</p>
          <p className="text-sm text-gray-500">Please ask your practitioner for a new one.</p>
        </div>
      </main>
    )
  }

  if (!mode) {
    return <main className="min-h-screen bg-white flex items-center justify-center"><p className="text-gray-500 text-sm">Loading…</p></main>
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Thank you</h1>
          <p className="text-sm text-gray-600">Your answers have been sent — your practitioner will follow up after reviewing them.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col items-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/word_up_clean.jpeg" alt="Word Up" className="h-16 w-auto rounded-xl shadow mb-2" />
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-gray-400 mb-4">Spelling to Communicate</p>
        </div>
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {mode === 'existing' && studentName ? `Updating ${studentName}'s information` : 'Welcome — tell us about your non-speaker'}
          </h1>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            This takes about 10 minutes. Nothing here is a test — it just helps us meet them the way they already are, and plan a session that fits them.
          </p>
          {quotedFee != null && (
            <p className="text-sm text-gray-600 mt-2">Quoted session fee: <span className="font-semibold">${quotedFee}</span></p>
          )}
        </div>

        <Section title="About your child">
          <FieldInput label="Child's name" value={a.childName} onChange={v => set('childName', v)} />
          <FieldInput label="Preferred name / nickname" value={a.nickname} onChange={v => set('nickname', v)} opt />
          <FieldInput label="Date of birth" value={a.dob} onChange={v => set('dob', v)} placeholder="MM/DD/YYYY" opt />
        </Section>

        <Section title="Your information" sub="So we know who we're talking with.">
          <FieldInput label="Your name" value={a.guardianName} onChange={v => set('guardianName', v)} />
          <FieldInput label="Relationship to your non-speaker" value={a.guardianRelationship} onChange={v => set('guardianRelationship', v)} opt />
          <FieldInput label="Email" value={a.guardianEmail} onChange={v => set('guardianEmail', v)} opt />
          <FieldInput label="Phone" value={a.guardianPhone} onChange={v => set('guardianPhone', v)} opt />
        </Section>

        <Section title="Family profile" sub="Who's at home, and how your non-speaker connects with them.">
          <FieldInput label="Is there another parent or guardian involved? Name and relationship" value={a.otherGuardian} onChange={v => set('otherGuardian', v)} opt />
          <FieldInput label="Siblings in the home" value={a.siblings} onChange={v => set('siblings', v)} placeholder="Names/ages" opt />
          <FieldArea label="How does your non-speaker interact with siblings or others in the house?" value={a.familyDynamics} onChange={v => set('familyDynamics', v)} opt />
        </Section>

        <Section title="Interests & what lights them up" sub="The best sessions are built around real interest, not just what's being worked on.">
          <FieldArea label="What does your non-speaker love — topics, characters, activities, anything" value={a.interests} onChange={v => set('interests', v)} opt />
          <FieldArea label="Something your non-speaker is good at or proud of" value={a.strengths} onChange={v => set('strengths', v)} opt />
        </Section>

        <Section title="Communication background">
          <FieldArea label="How does your non-speaker communicate today?" value={a.communicationToday} onChange={v => set('communicationToday', v)} opt />
          <FieldInput label="Diagnoses you'd like to share" value={a.diagnosis} onChange={v => set('diagnosis', v)} opt />
          <FieldArea label="Prior speech therapy or AAC history" value={a.priorAacHistory} onChange={v => set('priorAacHistory', v)} opt />
          <FieldInput label="How long have you been using Spelling to Communicate?" value={a.s2cDuration} onChange={v => set('s2cDuration', v)} opt />
          <FieldInput label="How long have you been working with Word Up?" value={a.wordUpDuration} onChange={v => set('wordUpDuration', v)} opt />
          <FieldInput label="Working with another practitioner? Name, if so" value={a.otherPractitioner} onChange={v => set('otherPractitioner', v)} opt />
          <FieldInput label="CRPs currently supporting your non-speaker" value={a.crpsSupporting} onChange={v => set('crpsSupporting', v)} placeholder="List names, if any" opt />
        </Section>

        <Section title="School & educational setting">
          <FieldInput label="Is your non-speaker currently in school? If so, what grade?" value={a.schoolStatus} onChange={v => set('schoolStatus', v)} opt />
          <FieldArea label="Classroom setting — general education, special education, or a mix" value={a.classroomSetting} onChange={v => set('classroomSetting', v)} opt />
          <FieldInput label="Does your non-speaker have a one-on-one aide or paraprofessional?" value={a.oneOnOne} onChange={v => set('oneOnOne', v)} opt />
          <FieldArea label="Anything else about your non-speaker's school day that would help us" value={a.schoolNotes} onChange={v => set('schoolNotes', v)} opt />
        </Section>

        <Section title="Motor profile" sub="This helps us set up the letterboard to work with them, not against them.">
          <FieldArea label="Fine motor — pointing accuracy, hand strength, grip" value={a.motorFine} onChange={v => set('motorFine', v)} opt />
          <FieldArea label="Gross motor — how their body moves and settles" value={a.motorGross} onChange={v => set('motorGross', v)} opt />
          <FieldArea label="Motor planning — starting, stopping, or sequencing a movement" value={a.motorPlanning} onChange={v => set('motorPlanning', v)} opt />
        </Section>

        <Section title="Sensory profile">
          <FieldArea label="What does your non-speaker seek out?" value={a.sensorySeek} onChange={v => set('sensorySeek', v)} opt />
          <FieldArea label="What does your non-speaker avoid or find distressing?" value={a.sensoryAvoid} onChange={v => set('sensoryAvoid', v)} opt />
          <FieldArea label="Stimming / self-regulatory movements or sounds" value={a.stimming} onChange={v => set('stimming', v)} placeholder="e.g. hand-flapping, rocking, vocal sounds — all welcome here" opt />
          <FieldArea label="Known triggers" value={a.sensoryTriggers} onChange={v => set('sensoryTriggers', v)} opt />
        </Section>

        <Section title="Regulation" sub="The most important section. This is what we'll actually use in session.">
          <FieldArea label="Early signs your non-speaker is becoming dysregulated" value={a.regSigns} onChange={v => set('regSigns', v)} opt />
          <FieldArea label="What actually helps your non-speaker regulate" value={a.regHelps} onChange={v => set('regHelps', v)} opt />
          <FieldArea label="What to avoid when your non-speaker is dysregulated" value={a.regAvoid} onChange={v => set('regAvoid', v)} opt />
        </Section>

        <Section title="Health & safety">
          <FieldInput label="Allergies" value={a.allergies} onChange={v => set('allergies', v)} opt />
          <FieldArea label="Food aversions or strong preferences" value={a.foodAversions} onChange={v => set('foodAversions', v)} opt />
        </Section>

        <Section title="Emergency contact">
          <FieldInput label="Name" value={a.emergencyName} onChange={v => set('emergencyName', v)} opt />
          <FieldInput label="Phone" value={a.emergencyPhone} onChange={v => set('emergencyPhone', v)} opt />
        </Section>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
          <p className="text-sm text-gray-500 mb-4">Anything you skip just gets flagged for your practitioner to follow up on — nothing here blocks submitting.</p>
          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          <button onClick={handleSubmit} disabled={submitting}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </div>
    </main>
  )
}
