'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

type Tri = 'yes' | 'no' | 'unclear' | ''

type TimePoint = {
  label: string
  energy: string
  regulation: string
  visualOrientation: string
  accuracy: string
  lMisses: string
  rMisses: string
  impulsivePokes: string
  lunging: string
  event: 'yes' | 'no' | ''
  notes: string
}

const TIME_POINT_LABELS = ['Beginning', '15 min', '30 min', '45 min', '60 min', '75 min', '90 min', 'End', 'Other']

function initTimePoints(): TimePoint[] {
  return TIME_POINT_LABELS.map(label => ({
    label,
    energy: '', regulation: '', visualOrientation: '', accuracy: '',
    lMisses: '', rMisses: '', impulsivePokes: '', lunging: '',
    event: '', notes: '',
  }))
}

interface FD {
  // Step 1
  studentName: string
  date: string
  sessionStart: string
  sessionEnd: string
  videoRecorded: 'yes' | 'no' | ''
  boardUsed: '3 Boards' | '26 Board' | 'Other' | ''
  sleepHealth: string[]
  sleepHealthOther: string
  // Step 2 – Baseline
  energyArousal: string[]
  energyArousalOther: string
  regulationBody: string[]
  regulationBodyOther: string
  visualOrientationBaseline: string[]
  visualOrientationBaselineOther: string
  baselineWords: string
  baselineLetters: string
  baselineAccurate: string
  baselineAccuracyPct: string
  baselineLMisses: string
  baselineRMisses: string
  baselineAboveMisses: string
  baselineBelowMisses: string
  baselineImpulsivePokes: string
  baselineLunging: string
  baselineMotorNotes: string
  // Step 3 – Session Tracking
  timePoints: TimePoint[]
  changesObserved: string[]
  changesObservedOther: string
  breakTime: string
  breakLength: string
  breakReason: string
  breakSupport: string[]
  breakSupportOther: string
  afterBreak: 'improved' | 'decreased' | 'baseline' | 'no_change' | 'unable' | ''
  postBreakObservations: string
  // Step 4 – Summary
  numberOfEvents: string
  timesOfEvents: string
  energyBeforeEvent: Tri
  energyAfterEvent: Tri
  accuracyChanged: Tri
  visualChanged: Tri
  motorChanged: Tri
  endComparison: {
    energy: 'higher' | 'lower' | 'same' | 'fluctuating' | ''
    regulation: 'higher' | 'lower' | 'same' | 'fluctuating' | ''
    accuracy: 'improved' | 'decreased' | 'same' | 'unable' | ''
    motor: 'improved' | 'decreased' | 'same' | 'unable' | ''
    visual: 'improved' | 'decreased' | 'same' | 'unable' | ''
  }
  patternGradual: string
  patternDemand: string
  patternEvent: string
  patternBreak: string
  patternDirectional: string
  patternOther: string
  videoTimestamps: string
}

const INIT: FD = {
  studentName: '', date: '', sessionStart: '', sessionEnd: '',
  videoRecorded: '', boardUsed: '',
  sleepHealth: [], sleepHealthOther: '',
  energyArousal: [], energyArousalOther: '',
  regulationBody: [], regulationBodyOther: '',
  visualOrientationBaseline: [], visualOrientationBaselineOther: '',
  baselineWords: '', baselineLetters: '', baselineAccurate: '', baselineAccuracyPct: '',
  baselineLMisses: '', baselineRMisses: '', baselineAboveMisses: '', baselineBelowMisses: '',
  baselineImpulsivePokes: '', baselineLunging: '', baselineMotorNotes: '',
  timePoints: initTimePoints(),
  changesObserved: [], changesObservedOther: '',
  breakTime: '', breakLength: '', breakReason: '',
  breakSupport: [], breakSupportOther: '',
  afterBreak: '',
  postBreakObservations: '',
  numberOfEvents: '', timesOfEvents: '',
  energyBeforeEvent: '', energyAfterEvent: '',
  accuracyChanged: '', visualChanged: '', motorChanged: '',
  endComparison: { energy: '', regulation: '', accuracy: '', motor: '', visual: '' },
  patternGradual: '', patternDemand: '', patternEvent: '',
  patternBreak: '', patternDirectional: '', patternOther: '',
  videoTimestamps: '',
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

function TriRow({ label, value, onChange }: { label: string; value: Tri; onChange: (v: Tri) => void }) {
  return (
    <div className="mb-4">
      <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>
      <div className="flex gap-2 flex-wrap">
        {([['yes', 'Yes', 'bg-green-100 border-green-500 text-green-800', 'border-gray-200 text-gray-600 hover:border-green-400'],
          ['no', 'No', 'bg-red-100 border-red-400 text-red-800', 'border-gray-200 text-gray-600 hover:border-red-400'],
          ['unclear', 'Unclear', 'bg-yellow-100 border-yellow-500 text-yellow-800', 'border-gray-200 text-gray-600 hover:border-yellow-400'],
        ] as [Tri, string, string, string][]).map(([v, lbl, activeClass, inactiveClass]) => (
          <button key={v} type="button" onClick={() => onChange(v)}
            className={`px-4 py-2 rounded-lg border text-sm transition-colors ${value === v ? activeClass + ' font-semibold' : inactiveClass}`}>
            {lbl}
          </button>
        ))}
      </div>
    </div>
  )
}

function CompareRow<T extends string>({ label, value, options, onChange }: {
  label: string
  value: T | ''
  options: [T, string][]
  onChange: (v: T) => void
}) {
  return (
    <div className="mb-3">
      <p className="text-sm font-medium text-gray-700 mb-1.5">{label}</p>
      <div className="flex gap-2 flex-wrap">
        {options.map(([v, lbl]) => (
          <button key={v} type="button" onClick={() => onChange(v)}
            className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${value === v ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300 text-gray-600 hover:border-blue-400'}`}>
            {lbl}
          </button>
        ))}
      </div>
    </div>
  )
}

const TOTAL_STEPS = 4

const STEP_TITLES = [
  'Session Info & Health',
  'Baseline',
  'Session Tracking',
  'Summary & Patterns',
]

export default function EnergyLogForm() {
  const { id } = useParams() as { id: string }
  const [step, setStep] = useState(1)
  const [fd, setFD] = useState<FD>(INIT)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof FD>(key: K, val: FD[K]) {
    setFD(prev => ({ ...prev, [key]: val }))
  }

  function updateTimePoint(index: number, field: keyof TimePoint, value: string) {
    setFD(prev => {
      const pts = [...prev.timePoints]
      pts[index] = { ...pts[index], [field]: value }
      return { ...prev, timePoints: pts }
    })
  }

  function setEndComparison<K extends keyof FD['endComparison']>(key: K, val: FD['endComparison'][K]) {
    setFD(prev => ({ ...prev, endComparison: { ...prev.endComparison, [key]: val } }))
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/practitioner/students/${id}/form-submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formType: 'session_energy_log', formData: fd }),
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
          <h1 className="text-xl font-bold text-gray-900 mb-2">Energy log submitted</h1>
          <p className="text-sm text-gray-500 mb-6">The session energy &amp; motor log has been saved to {fd.studentName ? `${fd.studentName}'s` : "the student's"} record.</p>
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
        <h1 className="text-base font-bold text-gray-900">Session Energy & Motor Performance Log</h1>
        <p className="text-xs text-gray-500 mb-2">{STEP_TITLES[step - 1]}</p>
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i + 1 <= step ? 'bg-blue-500' : 'bg-gray-200'}`} />
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1">Step {step} of {TOTAL_STEPS}</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">

        {/* ── STEP 1: Session Info & Health ── */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Session Info & Health</h2>

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
                    className={`px-5 py-2.5 rounded-lg border text-sm font-medium transition-colors ${fd.videoRecorded === v ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300 text-gray-600 hover:border-blue-400'}`}>
                    {v === 'yes' ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
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

            <div className="border-t border-gray-100 pt-4">
              <CheckGroup
                label="Sleep & Health Factors"
                options={[
                  'Typical sleep reported',
                  'Poor or disrupted sleep',
                  'Unusually tired',
                  'Recent illness',
                  'Recovering from illness',
                  'Change in medication',
                  'Change in routine',
                  'Unusual stress',
                  'Information unavailable',
                ]}
                values={fd.sleepHealth}
                onChange={v => set('sleepHealth', toggle(fd.sleepHealth, v))}
                otherValue={fd.sleepHealthOther}
                onOther={v => set('sleepHealthOther', v)}
              />
            </div>
          </div>
        )}

        {/* ── STEP 2: Baseline ── */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Baseline</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              <CheckGroup
                label="Energy / Arousal"
                options={[
                  'Low energy',
                  'Appears tired',
                  'Typical for student',
                  'Highly active',
                  'Extremely active',
                  'Fluctuating energy level',
                ]}
                values={fd.energyArousal}
                onChange={v => set('energyArousal', toggle(fd.energyArousal, v))}
                otherValue={fd.energyArousalOther}
                onOther={v => set('energyArousalOther', v)}
              />
              <CheckGroup
                label="Regulation / Body Control"
                options={[
                  'Calm and regulated',
                  'Frequent movement',
                  'Difficulty remaining in position',
                  'Impulsive movement',
                  'Lunging or reaching',
                  'Frequent stimming',
                  'Difficulty initiating purposeful movement',
                  'Difficulty stopping purposeful movement',
                ]}
                values={fd.regulationBody}
                onChange={v => set('regulationBody', toggle(fd.regulationBody, v))}
                otherValue={fd.regulationBodyOther}
                onOther={v => set('regulationBodyOther', v)}
              />
              <CheckGroup
                label="Visual Orientation"
                options={[
                  'Consistently visually oriented to boards',
                  'Frequently looks away',
                  'Frequently looks left',
                  'Frequently looks right',
                  'Difficulty shifting gaze between boards',
                  'Appears visually oriented but misses target',
                ]}
                values={fd.visualOrientationBaseline}
                onChange={v => set('visualOrientationBaseline', toggle(fd.visualOrientationBaseline, v))}
                otherValue={fd.visualOrientationBaselineOther}
                onOther={v => set('visualOrientationBaselineOther', v)}
              />
            </div>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Baseline Metrics</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                <FieldInput label="Words attempted" value={fd.baselineWords} onChange={v => set('baselineWords', v)} type="number" />
                <FieldInput label="Letters attempted" value={fd.baselineLetters} onChange={v => set('baselineLetters', v)} type="number" />
                <FieldInput label="Accurate selections" value={fd.baselineAccurate} onChange={v => set('baselineAccurate', v)} type="number" />
                <FieldInput label="Accuracy %" value={fd.baselineAccuracyPct} onChange={v => set('baselineAccuracyPct', v)} placeholder="e.g. 87" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <FieldInput label="Left-sided misses" value={fd.baselineLMisses} onChange={v => set('baselineLMisses', v)} type="number" />
                <FieldInput label="Right-sided misses" value={fd.baselineRMisses} onChange={v => set('baselineRMisses', v)} type="number" />
                <FieldInput label="Above-target misses" value={fd.baselineAboveMisses} onChange={v => set('baselineAboveMisses', v)} type="number" />
                <FieldInput label="Below-target misses" value={fd.baselineBelowMisses} onChange={v => set('baselineBelowMisses', v)} type="number" />
                <FieldInput label="Impulsive pokes" value={fd.baselineImpulsivePokes} onChange={v => set('baselineImpulsivePokes', v)} type="number" />
                <FieldInput label="Lunging movements" value={fd.baselineLunging} onChange={v => set('baselineLunging', v)} type="number" />
              </div>
              <FieldArea label="Other motor notes" value={fd.baselineMotorNotes} onChange={v => set('baselineMotorNotes', v)} placeholder="Any other baseline motor observations…" />
            </div>
          </div>
        )}

        {/* ── STEP 3: Session Tracking ── */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Session Tracking</h2>
            <p className="text-sm text-gray-500 mb-4">Record observations at each time point. Leave unused rows blank.</p>

            <div className="overflow-x-auto -mx-4 px-4">
              <div className="min-w-[680px] space-y-3">
                {/* Column headers */}
                <div className="grid grid-cols-[80px_1fr_1fr_1fr_60px_48px_48px_56px_52px_60px_1fr] gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">
                  <span>Time</span>
                  <span>Energy</span>
                  <span>Regulation</span>
                  <span>Visual Orient.</span>
                  <span>Accuracy</span>
                  <span>L-Miss</span>
                  <span>R-Miss</span>
                  <span>Impulsive</span>
                  <span>Lunging</span>
                  <span>Event?</span>
                  <span>Notes</span>
                </div>

                {fd.timePoints.map((tp, i) => (
                  <div key={tp.label} className="grid grid-cols-[80px_1fr_1fr_1fr_60px_48px_48px_56px_52px_60px_1fr] gap-1.5 items-center bg-white border border-gray-200 rounded-xl px-3 py-2">
                    <span className="text-xs font-semibold text-gray-700">{tp.label}</span>
                    <input
                      type="text"
                      value={tp.energy}
                      onChange={e => updateTimePoint(i, 'energy', e.target.value)}
                      placeholder="—"
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                    <input
                      type="text"
                      value={tp.regulation}
                      onChange={e => updateTimePoint(i, 'regulation', e.target.value)}
                      placeholder="—"
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                    <input
                      type="text"
                      value={tp.visualOrientation}
                      onChange={e => updateTimePoint(i, 'visualOrientation', e.target.value)}
                      placeholder="—"
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                    <input
                      type="text"
                      value={tp.accuracy}
                      onChange={e => updateTimePoint(i, 'accuracy', e.target.value)}
                      placeholder="%"
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                    <input
                      type="number"
                      value={tp.lMisses}
                      onChange={e => updateTimePoint(i, 'lMisses', e.target.value)}
                      placeholder="0"
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                    <input
                      type="number"
                      value={tp.rMisses}
                      onChange={e => updateTimePoint(i, 'rMisses', e.target.value)}
                      placeholder="0"
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                    <input
                      type="number"
                      value={tp.impulsivePokes}
                      onChange={e => updateTimePoint(i, 'impulsivePokes', e.target.value)}
                      placeholder="0"
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                    <input
                      type="number"
                      value={tp.lunging}
                      onChange={e => updateTimePoint(i, 'lunging', e.target.value)}
                      placeholder="0"
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                    <div className="flex gap-1">
                      {(['yes', 'no'] as const).map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => updateTimePoint(i, 'event', tp.event === v ? '' : v)}
                          className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                            tp.event === v
                              ? v === 'yes' ? 'bg-red-100 border-red-400 text-red-800' : 'bg-gray-100 border-gray-400 text-gray-700'
                              : 'border-gray-200 text-gray-500 hover:border-gray-400'
                          }`}
                        >
                          {v === 'yes' ? 'Y' : 'N'}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={tp.notes}
                      onChange={e => updateTimePoint(i, 'notes', e.target.value)}
                      placeholder="Notes…"
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 border-t border-gray-100 pt-5">
              <p className="text-sm font-semibold text-gray-700 mb-3">Changes Observed During Session</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                <CheckGroup
                  options={[
                    'No significant change',
                    'Energy decreased',
                    'Energy increased',
                    'Energy fluctuated significantly',
                    'Regulation improved',
                    'Regulation decreased',
                    'Motor accuracy improved',
                    'Motor accuracy decreased',
                    'Visual orientation improved',
                    'Visual orientation decreased',
                  ]}
                  values={fd.changesObserved}
                  onChange={v => set('changesObserved', toggle(fd.changesObserved, v))}
                />
                <CheckGroup
                  options={[
                    'Left-sided misses increased',
                    'Right-sided misses increased',
                    'Impulsive poking increased',
                    'Impulsive poking decreased',
                    'Lunging increased',
                    'Lunging decreased',
                    'Student required increased motor support',
                    'Student required increased regulation support',
                  ]}
                  values={fd.changesObserved}
                  onChange={v => set('changesObserved', toggle(fd.changesObserved, v))}
                  otherValue={fd.changesObservedOther}
                  onOther={v => set('changesObservedOther', v)}
                />
              </div>
            </div>

            <div className="mt-4 border-t border-gray-100 pt-5">
              <p className="text-sm font-semibold text-gray-700 mb-3">Break (if taken)</p>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <FieldInput label="Time of break" value={fd.breakTime} onChange={v => set('breakTime', v)} placeholder="e.g. 2:30 PM" />
                <FieldInput label="Length of break" value={fd.breakLength} onChange={v => set('breakLength', v)} placeholder="e.g. 5 min" />
                <FieldInput label="Reason" value={fd.breakReason} onChange={v => set('breakReason', v)} placeholder="e.g. fatigue" />
              </div>
              <CheckGroup
                label="Type of support during break"
                options={['Movement', 'Quiet rest', 'Sensory support', 'Reduced cognitive demand', 'Hydration', 'Food/snack']}
                values={fd.breakSupport}
                onChange={v => set('breakSupport', toggle(fd.breakSupport, v))}
                otherValue={fd.breakSupportOther}
                onOther={v => set('breakSupportOther', v)}
              />

              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">After break, student:</p>
                <div className="flex gap-2 flex-wrap">
                  {([
                    ['improved', 'Improved'],
                    ['decreased', 'Decreased'],
                    ['baseline', 'Returned to baseline'],
                    ['no_change', 'No observable change'],
                    ['unable', 'Unable to determine'],
                  ] as const).map(([v, lbl]) => (
                    <button key={v} type="button" onClick={() => set('afterBreak', v)}
                      className={`px-3 py-2 rounded-lg border text-sm transition-colors ${fd.afterBreak === v ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300 text-gray-600 hover:border-blue-400'}`}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              <FieldArea
                label="Post-break observations"
                value={fd.postBreakObservations}
                onChange={v => set('postBreakObservations', v)}
                placeholder="Describe what you observed after the break…"
              />
            </div>
          </div>
        )}

        {/* ── STEP 4: Summary & Patterns ── */}
        {step === 4 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Summary & Patterns</h2>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <FieldInput label="Number of suspected events" value={fd.numberOfEvents} onChange={v => set('numberOfEvents', v)} type="number" />
              <FieldInput label="Times of events" value={fd.timesOfEvents} onChange={v => set('timesOfEvents', v)} placeholder="e.g. 2:15, 2:47" />
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-1">
              <TriRow label="Did energy change BEFORE a suspected event?" value={fd.energyBeforeEvent} onChange={v => set('energyBeforeEvent', v)} />
              <TriRow label="Did energy change AFTER a suspected event?" value={fd.energyAfterEvent} onChange={v => set('energyAfterEvent', v)} />
              <TriRow label="Did spelling accuracy change in association with events?" value={fd.accuracyChanged} onChange={v => set('accuracyChanged', v)} />
              <TriRow label="Did visual orientation change in association with events?" value={fd.visualChanged} onChange={v => set('visualChanged', v)} />
              <TriRow label="Did purposeful motor control change in association with events?" value={fd.motorChanged} onChange={v => set('motorChanged', v)} />
            </div>

            <div className="border-t border-gray-100 pt-4 mb-5">
              <p className="text-sm font-semibold text-gray-700 mb-3">End-of-Session Comparison to Start</p>
              <div className="space-y-1">
                <CompareRow
                  label="Energy"
                  value={fd.endComparison.energy}
                  options={[['higher', 'Higher'], ['lower', 'Lower'], ['same', 'Approximately the same'], ['fluctuating', 'Fluctuating']]}
                  onChange={v => setEndComparison('energy', v)}
                />
                <CompareRow
                  label="Regulation"
                  value={fd.endComparison.regulation}
                  options={[['higher', 'Higher'], ['lower', 'Lower'], ['same', 'Approximately the same'], ['fluctuating', 'Fluctuating']]}
                  onChange={v => setEndComparison('regulation', v)}
                />
                <CompareRow
                  label="Spelling Accuracy"
                  value={fd.endComparison.accuracy}
                  options={[['improved', 'Improved'], ['decreased', 'Decreased'], ['same', 'Same'], ['unable', 'Unable to determine']]}
                  onChange={v => setEndComparison('accuracy', v)}
                />
                <CompareRow
                  label="Purposeful Motor Control"
                  value={fd.endComparison.motor}
                  options={[['improved', 'Improved'], ['decreased', 'Decreased'], ['same', 'Same'], ['unable', 'Unable to determine']]}
                  onChange={v => setEndComparison('motor', v)}
                />
                <CompareRow
                  label="Visual Orientation"
                  value={fd.endComparison.visual}
                  options={[['improved', 'Improved'], ['decreased', 'Decreased'], ['same', 'Same'], ['unable', 'Unable to determine']]}
                  onChange={v => setEndComparison('visual', v)}
                />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 mb-5">
              <p className="text-sm font-semibold text-gray-700 mb-3">Pattern Summary</p>
              <FieldArea
                label="Were changes gradual or sudden?"
                value={fd.patternGradual}
                onChange={v => set('patternGradual', v)}
                placeholder="Describe the onset and trajectory of changes…"
              />
              <FieldArea
                label="Were changes associated with increasing cognitive or motor demand?"
                value={fd.patternDemand}
                onChange={v => set('patternDemand', v)}
                placeholder="Did difficulty increase as the session progressed or demands increased?"
              />
              <FieldArea
                label="Were changes associated with a suspected event?"
                value={fd.patternEvent}
                onChange={v => set('patternEvent', v)}
                placeholder="Describe any relationship between observed events and changes in performance…"
              />
              <FieldArea
                label="Did a break affect performance or presentation?"
                value={fd.patternBreak}
                onChange={v => set('patternBreak', v)}
                placeholder="Describe any changes observed after a break…"
              />
              <FieldArea
                label="Were directional motor errors random or consistent?"
                value={fd.patternDirectional}
                onChange={v => set('patternDirectional', v)}
                placeholder="e.g. consistently left-biased, random, changed mid-session…"
              />
              <FieldArea
                label="Other repeatable patterns observed"
                value={fd.patternOther}
                onChange={v => set('patternOther', v)}
                placeholder="Any other patterns worth noting…"
              />
            </div>

            <FieldInput label="Video timestamps (if applicable)" value={fd.videoTimestamps} onChange={v => set('videoTimestamps', v)} placeholder="e.g. 0:42, 3:15, 7:02" />

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
              {submitting ? 'Submitting…' : 'Submit Energy Log'}
            </button>
          )}
        </div>
      </div>
    </main>
  )
}
