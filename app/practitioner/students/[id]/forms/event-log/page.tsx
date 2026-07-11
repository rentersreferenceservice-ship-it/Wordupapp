'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

type Tri = 'yes' | 'no' | 'unclear' | ''

interface FD {
  // Step 1
  studentName: string
  date: string
  sessionStart: string
  sessionEnd: string
  videoRecorded: 'yes' | 'no' | ''
  boardUsed: '3 Boards' | '26 Board' | 'Other' | ''
  // Step 2 – Baseline
  overallRegulation: string[]
  overallRegulationOther: string
  visualOrientation: string[]
  visualOrientationOther: string
  baselineWordsAttempted: string
  baselineLettersAttempted: string
  baselineAccurateSelections: string
  baselineAccuracyPct: string
  commonMotorPattern: string[]
  commonMotorPatternOther: string
  // Step 3 – Suspected Event
  eventTimeStart: string
  eventTimeEnd: string
  eventDuration: string
  activityBefore: string
  firstObservableChange: string
  gazeEyes: string[]
  gazeEyesOther: string
  responsiveness: string[]
  bodyMotor: string[]
  bodyMotorOther: string
  eventDescription: string
  // Step 4 – After
  timeUntilReturn: string
  afterEvent: string[]
  afterEventOther: string
  postEventTimeResumed: string
  postEventWords: string
  postEventLetters: string
  postEventAccurate: string
  postEventAccuracyPct: string
  comparisonObservations: string[]
  comparisonOther: string
  knownQuestion: Tri
  questionAsked: string
  questionResponse: string
  // Step 5 – Summary
  numberOfEvents: string
  accuracyAssociated: Tri
  motorAssociated: Tri
  visualAssociated: Tri
  videoTimestamps: string
  additionalObservations: string
}

const INIT: FD = {
  studentName: '', date: '', sessionStart: '', sessionEnd: '',
  videoRecorded: '', boardUsed: '',
  overallRegulation: [], overallRegulationOther: '',
  visualOrientation: [], visualOrientationOther: '',
  baselineWordsAttempted: '', baselineLettersAttempted: '',
  baselineAccurateSelections: '', baselineAccuracyPct: '',
  commonMotorPattern: [], commonMotorPatternOther: '',
  eventTimeStart: '', eventTimeEnd: '', eventDuration: '',
  activityBefore: '', firstObservableChange: '',
  gazeEyes: [], gazeEyesOther: '',
  responsiveness: [],
  bodyMotor: [], bodyMotorOther: '',
  eventDescription: '',
  timeUntilReturn: '',
  afterEvent: [], afterEventOther: '',
  postEventTimeResumed: '', postEventWords: '', postEventLetters: '',
  postEventAccurate: '', postEventAccuracyPct: '',
  comparisonObservations: [], comparisonOther: '',
  knownQuestion: '', questionAsked: '', questionResponse: '',
  numberOfEvents: '',
  accuracyAssociated: '', motorAssociated: '', visualAssociated: '',
  videoTimestamps: '', additionalObservations: '',
}

function toggle(arr: string[], val: string) {
  return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]
}

function CheckBtn({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`flex items-center gap-2 text-left text-sm px-3 py-2 rounded-lg border transition-colors w-full ${
        checked ? 'bg-blue-50 border-blue-400 text-blue-900' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'
      }`}
    >
      <span className={`flex-shrink-0 w-4 h-4 rounded border ${checked ? 'bg-blue-500 border-blue-500' : 'border-gray-400'} flex items-center justify-center`}>
        {checked && (
          <svg viewBox="0 0 10 8" className="w-3 h-3 text-white fill-current">
            <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {label}
    </button>
  )
}

function CheckGroup({ label, options, values, onChange, otherValue, onOther }: {
  label?: string; options: string[]; values: string[]
  onChange: (v: string) => void; otherValue?: string; onOther?: (v: string) => void
}) {
  return (
    <div className="mb-4">
      {label && <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>}
      <div className="space-y-1.5">
        {options.map(o => (
          <CheckBtn key={o} label={o} checked={values.includes(o)} onChange={() => onChange(o)} />
        ))}
        {onOther !== undefined && (
          <div className="flex items-center gap-2">
            <CheckBtn label="Other" checked={(otherValue ?? '') !== ''} onChange={() => {}} />
            <input
              type="text"
              value={otherValue ?? ''}
              onChange={e => onOther(e.target.value)}
              placeholder="Describe…"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        )}
      </div>
    </div>
  )
}

function FieldInput({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
    </div>
  )
}

function FieldArea({ label, value, onChange, placeholder, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea
        rows={rows}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
      />
    </div>
  )
}

function TriBtn({ label, value, current, onSelect, colorKey }: {
  label: string; value: Tri; current: Tri; onSelect: (v: Tri) => void; colorKey?: string
}) {
  const active = current === value
  const key = colorKey ?? value
  const colors: Record<string, string> = {
    yes: active ? 'bg-green-100 border-green-500 text-green-800 font-semibold' : 'border-gray-200 text-gray-600 hover:border-green-400',
    no: active ? 'bg-red-100 border-red-400 text-red-800 font-semibold' : 'border-gray-200 text-gray-600 hover:border-red-400',
    unclear: active ? 'bg-yellow-100 border-yellow-500 text-yellow-800 font-semibold' : 'border-gray-200 text-gray-600 hover:border-yellow-400',
  }
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`px-4 py-2 rounded-lg border text-sm transition-colors ${colors[key] ?? ''}`}
    >
      {label}
    </button>
  )
}

function TriRow({ label, value, onChange }: { label: string; value: Tri; onChange: (v: Tri) => void }) {
  return (
    <div className="mb-4">
      <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>
      <div className="flex gap-2">
        <TriBtn label="Yes" value="yes" current={value} onSelect={onChange} />
        <TriBtn label="No" value="no" current={value} onSelect={onChange} />
        <TriBtn label="Unclear" value="unclear" current={value} onSelect={onChange} />
      </div>
    </div>
  )
}

const TOTAL_STEPS = 5

const STEP_TITLES = [
  'Session Info',
  'Baseline',
  'Suspected Event',
  'After the Event',
  'Summary',
]

export default function EventLogForm() {
  const { id } = useParams() as { id: string }
  const [step, setStep] = useState(1)
  const [fd, setFD] = useState<FD>(INIT)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof FD>(key: K, val: FD[K]) {
    setFD(prev => ({ ...prev, [key]: val }))
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/practitioner/students/${id}/form-submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formType: 'practitioner_event_log', formData: fd }),
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

  if (submitted) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-start justify-center px-4 pt-12">
        <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Event log submitted</h1>
          <p className="text-sm text-gray-500 mb-6">The neurological event log has been saved to {fd.studentName ? `${fd.studentName}'s` : "the student's"} record.</p>
          <Link
            href={`/practitioner/students/${id}`}
            className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            ← Back to Student Record
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <Link href={`/practitioner/students/${id}`} className="text-sm text-blue-600 hover:underline mb-2 inline-block">
          ← Back to {fd.studentName || 'Student'}
        </Link>
        <h1 className="text-base font-bold text-gray-900">Neurological Event Log</h1>
        <p className="text-xs text-gray-500 mb-2">{STEP_TITLES[step - 1]}</p>
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i + 1 <= step ? 'bg-blue-500' : 'bg-gray-200'}`} />
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1">Step {step} of {TOTAL_STEPS}</p>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* ── STEP 1: Session Info ── */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Session Info</h2>
            <FieldInput label="Student Name" value={fd.studentName} onChange={v => set('studentName', v)} placeholder="Full name" />
            <FieldInput label="Date" value={fd.date} onChange={v => set('date', v)} type="date" />
            <div className="grid grid-cols-2 gap-3">
              <FieldInput label="Session Start Time" value={fd.sessionStart} onChange={v => set('sessionStart', v)} type="time" />
              <FieldInput label="Session End Time" value={fd.sessionEnd} onChange={v => set('sessionEnd', v)} type="time" />
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Video Recorded?</p>
              <div className="flex gap-3">
                {(['yes', 'no'] as const).map(v => (
                  <button key={v} type="button" onClick={() => set('videoRecorded', v)}
                    className={`px-5 py-2.5 rounded-lg border text-sm font-medium capitalize transition-colors ${fd.videoRecorded === v ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300 text-gray-600 hover:border-blue-400'}`}>
                    {v === 'yes' ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Board Used</p>
              <div className="flex gap-2 flex-wrap">
                {(['3 Boards', '26 Board', 'Other'] as const).map(v => (
                  <button key={v} type="button" onClick={() => set('boardUsed', v)}
                    className={`px-4 py-2 rounded-lg border text-sm transition-colors ${fd.boardUsed === v ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300 text-gray-600 hover:border-blue-400'}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Baseline ── */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Baseline</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <CheckGroup
                label="Overall Regulation"
                options={['Calm/regulated', 'Highly active', 'Frequent impulsive movement', 'Lunging/reaching toward board', 'Frequent stimming', 'Difficulty remaining in position']}
                values={fd.overallRegulation}
                onChange={v => set('overallRegulation', toggle(fd.overallRegulation, v))}
                otherValue={fd.overallRegulationOther}
                onOther={v => set('overallRegulationOther', v)}
              />
              <CheckGroup
                label="Visual Orientation"
                options={['Consistently visually oriented', 'Frequently looks away', 'Frequently looks left', 'Frequently looks right', 'Appears visually oriented but misses target', 'Difficulty shifting gaze between boards']}
                values={fd.visualOrientation}
                onChange={v => set('visualOrientation', toggle(fd.visualOrientation, v))}
                otherValue={fd.visualOrientationOther}
                onOther={v => set('visualOrientationOther', v)}
              />
            </div>

            <div className="border-t border-gray-100 pt-4 mb-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Baseline Spelling Metrics</p>
              <div className="grid grid-cols-2 gap-3">
                <FieldInput label="Words attempted" value={fd.baselineWordsAttempted} onChange={v => set('baselineWordsAttempted', v)} type="number" />
                <FieldInput label="Letters attempted" value={fd.baselineLettersAttempted} onChange={v => set('baselineLettersAttempted', v)} type="number" />
                <FieldInput label="Accurate selections" value={fd.baselineAccurateSelections} onChange={v => set('baselineAccurateSelections', v)} type="number" />
                <FieldInput label="Accuracy %" value={fd.baselineAccuracyPct} onChange={v => set('baselineAccuracyPct', v)} placeholder="e.g. 87" />
              </div>
            </div>

            <CheckGroup
              label="Common Motor Pattern"
              options={[
                'Accurate direct poke',
                'Pokes left of intended letter',
                'Pokes right of intended letter',
                'Pokes above or below intended letter',
                'Lunges toward board after completing word',
                'Difficulty stopping movement',
                'Difficulty initiating movement',
                'Multiple attempts before purposeful selection',
              ]}
              values={fd.commonMotorPattern}
              onChange={v => set('commonMotorPattern', toggle(fd.commonMotorPattern, v))}
              otherValue={fd.commonMotorPatternOther}
              onOther={v => set('commonMotorPatternOther', v)}
            />
          </div>
        )}

        {/* ── STEP 3: Suspected Event ── */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Suspected Event</h2>

            <div className="grid grid-cols-3 gap-3">
              <FieldInput label="Exact time began" value={fd.eventTimeStart} onChange={v => set('eventTimeStart', v)} type="time" />
              <FieldInput label="Exact time ended" value={fd.eventTimeEnd} onChange={v => set('eventTimeEnd', v)} type="time" />
              <FieldInput label="Duration" value={fd.eventDuration} onChange={v => set('eventDuration', v)} placeholder="e.g. 30 sec" />
            </div>

            <FieldArea label="Activity immediately before" value={fd.activityBefore} onChange={v => set('activityBefore', v)} placeholder="What was happening just before the event?" />
            <FieldArea label="First observable change" value={fd.firstObservableChange} onChange={v => set('firstObservableChange', v)} placeholder="What was the very first thing you noticed?" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <CheckGroup
                label="Gaze and Eyes"
                options={[
                  'Fixed gaze/stare',
                  'Gaze deviated left',
                  'Gaze deviated right',
                  'Eyes appeared unfocused',
                  'Head also turned with gaze',
                  'No observable blink to visual approach',
                  'Eyelid fluttering/blinking',
                ]}
                values={fd.gazeEyes}
                onChange={v => set('gazeEyes', toggle(fd.gazeEyes, v))}
                otherValue={fd.gazeEyesOther}
                onOther={v => set('gazeEyesOther', v)}
              />
              <CheckGroup
                label="Responsiveness"
                options={[
                  'Responded to name',
                  'Did not respond to name',
                  'Responded to familiar verbal direction',
                  'Did not respond to familiar verbal direction',
                  'Responded to gentle touch',
                  'Did not respond to gentle touch',
                  'Purposeful movement continued',
                  'Purposeful movement stopped',
                  'Unable to determine',
                ]}
                values={fd.responsiveness}
                onChange={v => set('responsiveness', toggle(fd.responsiveness, v))}
              />
            </div>

            <CheckGroup
              label="Body and Motor"
              options={[
                'Body became still',
                'Stiffening',
                'Jerking/twitching',
                'Repetitive movement',
                'Facial movement',
                'Mouth movement',
                'Hand/finger movement',
                'Change in breathing',
                'Change in skin color',
                'No additional observable changes',
              ]}
              values={fd.bodyMotor}
              onChange={v => set('bodyMotor', toggle(fd.bodyMotor, v))}
              otherValue={fd.bodyMotorOther}
              onOther={v => set('bodyMotorOther', v)}
            />

            <FieldArea
              label="Detailed description of the event"
              value={fd.eventDescription}
              onChange={v => set('eventDescription', v)}
              placeholder="Describe everything you observed during the event…"
              rows={5}
            />
          </div>
        )}

        {/* ── STEP 4: After the Event ── */}
        {step === 4 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">After the Event</h2>

            <FieldInput label="Time until return to previous activity" value={fd.timeUntilReturn} onChange={v => set('timeUntilReturn', v)} placeholder="e.g. immediate, 2 minutes" />

            <CheckGroup
              label="Post-event observations"
              options={[
                'Immediate return to previous activity',
                'Appeared confused',
                'Appeared fatigued',
                'Increased activity/dysregulation',
                'Decreased activity',
                'Increased stimming',
                'Change in visual orientation',
                'Change in motor control',
              ]}
              values={fd.afterEvent}
              onChange={v => set('afterEvent', toggle(fd.afterEvent, v))}
              otherValue={fd.afterEventOther}
              onOther={v => set('afterEventOther', v)}
            />

            <div className="border-t border-gray-100 pt-4 mb-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Post-event Spelling</p>
              <div className="grid grid-cols-2 gap-3">
                <FieldInput label="Time resumed" value={fd.postEventTimeResumed} onChange={v => set('postEventTimeResumed', v)} type="time" />
                <div />
                <FieldInput label="Words attempted" value={fd.postEventWords} onChange={v => set('postEventWords', v)} type="number" />
                <FieldInput label="Letters attempted" value={fd.postEventLetters} onChange={v => set('postEventLetters', v)} type="number" />
                <FieldInput label="Accurate selections" value={fd.postEventAccurate} onChange={v => set('postEventAccurate', v)} type="number" />
                <FieldInput label="Accuracy %" value={fd.postEventAccuracyPct} onChange={v => set('postEventAccuracyPct', v)} placeholder="e.g. 72" />
              </div>
            </div>

            <CheckGroup
              label="Comparison to baseline"
              options={[
                'No observable change',
                'Accuracy improved',
                'Accuracy decreased',
                'Increased left-sided misses',
                'Increased right-sided misses',
                'Increased impulsive poking',
                'Increased lunging',
                'Increased difficulty initiating movement',
                'Increased difficulty stopping movement',
                'Increased visual-orientation difficulty',
              ]}
              values={fd.comparisonObservations}
              onChange={v => set('comparisonObservations', toggle(fd.comparisonObservations, v))}
              otherValue={fd.comparisonOther}
              onOther={v => set('comparisonOther', v)}
            />

            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">KNOWN Question</p>
              <TriRow label="Was a KNOWN question asked?" value={fd.knownQuestion} onChange={v => set('knownQuestion', v)} />
              {fd.knownQuestion === 'yes' && (
                <>
                  <FieldInput label="Question asked" value={fd.questionAsked} onChange={v => set('questionAsked', v)} placeholder="What was asked?" />
                  <FieldArea label="Response" value={fd.questionResponse} onChange={v => set('questionResponse', v)} placeholder="What was the student's response?" />
                </>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 5: Summary ── */}
        {step === 5 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Summary</h2>

            <FieldInput label="Total number of suspected events this session" value={fd.numberOfEvents} onChange={v => set('numberOfEvents', v)} type="number" />

            <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2">
              <TriRow label="Did events appear associated with a change in spelling accuracy?" value={fd.accuracyAssociated} onChange={v => set('accuracyAssociated', v)} />
              <TriRow label="Did events appear associated with a change in motor control?" value={fd.motorAssociated} onChange={v => set('motorAssociated', v)} />
              <TriRow label="Did events appear associated with a change in visual orientation?" value={fd.visualAssociated} onChange={v => set('visualAssociated', v)} />
            </div>

            <FieldInput label="Video timestamps (if applicable)" value={fd.videoTimestamps} onChange={v => set('videoTimestamps', v)} placeholder="e.g. 0:42, 3:15" />
            <FieldArea
              label="Additional observations"
              value={fd.additionalObservations}
              onChange={v => set('additionalObservations', v)}
              placeholder="Anything else relevant to this session or event(s)…"
              rows={4}
            />

            {error && <p className="text-sm text-red-600 mt-2 mb-2">{error}</p>}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button type="button" onClick={() => setStep(s => s - 1)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              ← Back
            </button>
          )}
          {step < TOTAL_STEPS ? (
            <button type="button" onClick={() => setStep(s => s + 1)}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
              Next →
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={submitting}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors">
              {submitting ? 'Submitting…' : 'Submit Event Log'}
            </button>
          )}
        </div>
      </div>
    </main>
  )
}
