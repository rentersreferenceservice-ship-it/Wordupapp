'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

type Tri = 'yes' | 'no' | 'unsure' | ''

interface FD {
  // Step 1 – Event Details
  date: string; dayOfWeek: string; observer: string
  timeStart: string; timeEnd: string; duration: string
  // Step 2 – Before
  doingBefore: string
  seemedBefore: string[]; seemedBeforeOther: string
  factors: string[]; factorsOther: string
  // Step 3 – The Episode
  firstNoticed: string
  eyes: string[]; eyesOther: string
  headBody: string[]
  // Step 4 – Responsiveness & Movements
  respondName: Tri; respondVerbal: Tri; respondTouch: Tri; respondAware: Tri
  movements: string[]; movementsOther: string
  // Step 5 – Afterward
  afterEpisode: string[]; afterOther: string
  recoveryTime: string; recoveryNotes: string
  // Step 6 – Video, Patterns & Final
  videoRecorded: 'yes' | 'no' | ''
  videoCaptured: string[]; videoFilename: string
  happenedBefore: Tri; episodesToday: string; lookSimilar: Tri; sameDifferent: string
  mostImportant: string
}

const INIT: FD = {
  date: '', dayOfWeek: '', observer: '', timeStart: '', timeEnd: '', duration: '',
  doingBefore: '', seemedBefore: [], seemedBeforeOther: '', factors: [], factorsOther: '',
  firstNoticed: '', eyes: [], eyesOther: '', headBody: [],
  respondName: '', respondVerbal: '', respondTouch: '', respondAware: '',
  movements: [], movementsOther: '',
  afterEpisode: [], afterOther: '', recoveryTime: '', recoveryNotes: '',
  videoRecorded: '', videoCaptured: [], videoFilename: '',
  happenedBefore: '', episodesToday: '', lookSimilar: '', sameDifferent: '', mostImportant: '',
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const TOTAL_STEPS = 6

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
        {checked && <svg viewBox="0 0 10 8" className="w-3 h-3 text-white fill-current"><path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </span>
      {label}
    </button>
  )
}

function TriBtn({ label, value, current, onSelect }: { label: string; value: Tri; current: Tri; onSelect: (v: Tri) => void }) {
  const active = current === value
  const colors: Record<string, string> = {
    yes: active ? 'bg-green-100 border-green-500 text-green-800 font-semibold' : 'border-gray-200 text-gray-600 hover:border-green-400',
    no: active ? 'bg-red-100 border-red-400 text-red-800 font-semibold' : 'border-gray-200 text-gray-600 hover:border-red-400',
    unsure: active ? 'bg-yellow-100 border-yellow-500 text-yellow-800 font-semibold' : 'border-gray-200 text-gray-600 hover:border-yellow-400',
  }
  return (
    <button type="button" onClick={() => onSelect(value)} className={`px-4 py-2 rounded-lg border text-sm transition-colors ${colors[value as string] ?? ''}`}>
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
        <TriBtn label="Unsure" value="unsure" current={value} onSelect={onChange} />
      </div>
    </div>
  )
}

function FieldInput({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
    </div>
  )
}

function FieldArea({ label, value, onChange, placeholder, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea rows={rows} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
    </div>
  )
}

function CheckGroup({ label, options, values, onChange, otherValue, onOther }: {
  label?: string; options: string[]; values: string[]
  onChange: (v: string) => void; otherValue?: string; onOther?: (v: string) => void
}) {
  return (
    <div className="mb-4">
      {label && <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>}
      <div className="space-y-2">
        {options.map(o => (
          <CheckBtn key={o} label={o} checked={values.includes(o)} onChange={() => onChange(o)} />
        ))}
        {onOther !== undefined && (
          <div className="flex items-center gap-2">
            <CheckBtn label="Other" checked={(otherValue ?? '') !== ''} onChange={() => {}} />
            <input type="text" value={otherValue ?? ''} onChange={e => onOther(e.target.value)}
              placeholder="Describe…"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
        )}
      </div>
    </div>
  )
}

function toggle(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]
}

export default function ObserveForm() {
  const params = useParams()
  const token = params.token as string

  const [studentName, setStudentName] = useState<string | null>(null)
  const [invalid, setInvalid] = useState(false)
  const [step, setStep] = useState(1)
  const [fd, setFD] = useState<FD>(INIT)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [showHomeScreenTip, setShowHomeScreenTip] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent))
  }, [])

  useEffect(() => {
    fetch(`/api/observe/${token}`)
      .then(r => r.json())
      .then(d => { if (d.error) setInvalid(true); else setStudentName(d.studentName) })
      .catch(() => setInvalid(true))
  }, [token])

  function set<K extends keyof FD>(key: K, val: FD[K]) {
    setFD(prev => ({ ...prev, [key]: val }))
  }

  async function handleSubmit() {
    if (!fd.mostImportant.trim() && !fd.firstNoticed.trim()) {
      setError('Please describe what you observed before submitting.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/observe/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fd),
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
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-800 mb-2">This link is not valid.</p>
          <p className="text-sm text-gray-500">Please ask your S2C practitioner to send you the current link.</p>
        </div>
      </main>
    )
  }

  if (!studentName) {
    return <main className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-500 text-sm">Loading…</p></main>
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-start justify-center px-4 pt-12 pb-8">
        <div className="max-w-md w-full">
          <div className="text-center bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-4">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Observation submitted</h1>
            <p className="text-sm text-gray-600 mb-1">Your observations have been sent to {studentName}&apos;s S2C practitioner.</p>
            <p className="text-sm text-gray-500">Thank you — this helps build a clear picture for the medical team.</p>
          </div>

          {/* Home screen tip */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📲</span>
              <div className="flex-1">
                <p className="text-sm font-bold text-blue-900 mb-1">Save this form to your home screen</p>
                <p className="text-sm text-blue-800 mb-3">
                  Add this page to your home screen so you can open it instantly next time — no need to find the link again.
                </p>
                <button
                  onClick={() => setShowHomeScreenTip(v => !v)}
                  className="text-sm font-semibold text-blue-700 underline"
                >
                  {showHomeScreenTip ? 'Hide instructions ▲' : 'Show me how ▼'}
                </button>

                {showHomeScreenTip && (
                  <div className="mt-4">
                    {isIOS ? (
                      <ol className="space-y-2 text-sm text-blue-900">
                        <li><span className="font-bold">1.</span> Make sure you&apos;re in <span className="font-bold">Safari</span> (not Chrome or another browser)</li>
                        <li><span className="font-bold">2.</span> Tap the <span className="font-bold">Share button</span> — the box with an arrow at the bottom of the screen</li>
                        <li><span className="font-bold">3.</span> Scroll down and tap <span className="font-bold">Add to Home Screen</span></li>
                        <li><span className="font-bold">4.</span> Tap <span className="font-bold">Add</span> in the top right</li>
                        <li className="text-blue-700 text-xs mt-1">A Word Up icon will appear on your home screen and open this exact form.</li>
                      </ol>
                    ) : (
                      <ol className="space-y-2 text-sm text-blue-900">
                        <li><span className="font-bold">1.</span> Tap the <span className="font-bold">three dots ⋮</span> in the top right corner of Chrome</li>
                        <li><span className="font-bold">2.</span> Tap <span className="font-bold">Add to Home screen</span></li>
                        <li><span className="font-bold">3.</span> Tap <span className="font-bold">Add</span></li>
                        <li className="text-blue-700 text-xs mt-1">A Word Up icon will appear on your home screen and open this exact form.</li>
                      </ol>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center mt-4">
            Use the same link to submit another observation at any time.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Home screen nudge — shown only once, dismissible */}
      {!showHomeScreenTip && (
        <div className="bg-blue-600 text-white px-4 py-2.5 flex items-center justify-between gap-3">
          <span className="text-xs">📲 <span className="font-semibold">Tip:</span> Save this page to your home screen for quick access next time.</span>
          <button onClick={() => setShowHomeScreenTip(true)} className="text-xs underline font-semibold whitespace-nowrap flex-shrink-0">How?</button>
        </div>
      )}

      {showHomeScreenTip && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-sm font-bold text-blue-900">Save to Home Screen</p>
            <button onClick={() => setShowHomeScreenTip(false)} className="text-blue-500 text-lg leading-none flex-shrink-0">×</button>
          </div>
          {isIOS ? (
            <ol className="space-y-1 text-xs text-blue-800">
              <li><span className="font-bold">1.</span> Open this page in <span className="font-bold">Safari</span></li>
              <li><span className="font-bold">2.</span> Tap the <span className="font-bold">Share ↑</span> button at the bottom</li>
              <li><span className="font-bold">3.</span> Tap <span className="font-bold">Add to Home Screen</span> → <span className="font-bold">Add</span></li>
            </ol>
          ) : (
            <ol className="space-y-1 text-xs text-blue-800">
              <li><span className="font-bold">1.</span> Tap the <span className="font-bold">⋮ three dots</span> in Chrome</li>
              <li><span className="font-bold">2.</span> Tap <span className="font-bold">Add to Home screen</span> → <span className="font-bold">Add</span></li>
            </ol>
          )}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Observation Form</p>
        <h1 className="text-base font-bold text-gray-900">{studentName} — Suspected Neurological Event Log</h1>
        {/* Progress */}
        <div className="flex gap-1.5 mt-3">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i + 1 <= step ? 'bg-blue-500' : 'bg-gray-200'}`} />
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1">Step {step} of {TOTAL_STEPS}</p>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">

        {/* ─── STEP 1: Event Details ─── */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">About the Episode</h2>
            <p className="text-sm text-gray-500 mb-5">Basic information about when it happened and who was there.</p>
            <FieldInput label="Date" value={fd.date} onChange={v => set('date', v)} type="date" />
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Day of Week</label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map(d => (
                  <button key={d} type="button" onClick={() => set('dayOfWeek', d)}
                    className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${fd.dayOfWeek === d ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300 text-gray-600 hover:border-blue-400'}`}>
                    {d.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
            <FieldInput label="Your name (person observing)" value={fd.observer} onChange={v => set('observer', v)} placeholder="e.g. Mom, Dad, Grandma" />
            <div className="grid grid-cols-2 gap-3">
              <FieldInput label="Time started" value={fd.timeStart} onChange={v => set('timeStart', v)} type="time" />
              <FieldInput label="Time ended" value={fd.timeEnd} onChange={v => set('timeEnd', v)} type="time" />
            </div>
            <FieldInput label="Approximate duration" value={fd.duration} onChange={v => set('duration', v)} placeholder="e.g. 45 seconds, 2 minutes" />
          </div>
        )}

        {/* ─── STEP 2: Before ─── */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Before the Episode</h2>
            <p className="text-sm text-gray-500 mb-5">What was he doing and how was he feeling leading up to it.</p>
            <FieldArea label="What was he doing immediately before the episode?" value={fd.doingBefore} onChange={v => set('doingBefore', v)} placeholder="Describe the activity or situation…" rows={3} />
            <CheckGroup
              label="How did he seem before the episode? (select all that apply)"
              options={['Typical / at baseline', 'Very active', 'Calm', 'Tired', 'Upset or dysregulated', 'Anxious', 'Excited', 'Ill or not feeling well']}
              values={fd.seemedBefore}
              onChange={v => set('seemedBefore', toggle(fd.seemedBefore, v))}
              otherValue={fd.seemedBeforeOther}
              onOther={v => set('seemedBeforeOther', v)}
            />
            <CheckGroup
              label="Any of these in the previous 24 hours? (select all that apply)"
              options={['Poor or disrupted sleep', 'Unusually tired', 'Illness or fever', 'Increased stress', 'Unusual excitement', 'Change in routine', 'Missed or changed medication', 'Dehydration or reduced food intake', 'No unusual factors noticed']}
              values={fd.factors}
              onChange={v => set('factors', toggle(fd.factors, v))}
              otherValue={fd.factorsOther}
              onOther={v => set('factorsOther', v)}
            />
          </div>
        )}

        {/* ─── STEP 3: The Episode ─── */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">What the Episode Looked Like</h2>
            <p className="text-sm text-gray-500 mb-5">Describe what you saw during the episode itself.</p>
            <FieldArea label="What was the FIRST unusual thing you noticed?" value={fd.firstNoticed} onChange={v => set('firstNoticed', v)} placeholder="The very first change you saw…" rows={3} />
            <CheckGroup
              label="Eyes and Gaze (select all that apply)"
              options={['Staring / appeared to "check out"', 'Eyes looking left', 'Eyes looking right', 'Eyes looking upward', 'Eyes looking downward', 'Eyes fixed in one position', 'Eyes moved unusually', 'Rapid blinking or eyelid movement']}
              values={fd.eyes}
              onChange={v => set('eyes', toggle(fd.eyes, v))}
              otherValue={fd.eyesOther}
              onOther={v => set('eyesOther', v)}
            />
            <CheckGroup
              label="Head and Body Position (select all that apply)"
              options={['Head remained straight', 'Head turned left', 'Head turned right', 'Body became still', 'Body became stiff', 'Loss of balance or change in posture']}
              values={fd.headBody}
              onChange={v => set('headBody', toggle(fd.headBody, v))}
            />
          </div>
        )}

        {/* ─── STEP 4: Responsiveness & Movements ─── */}
        {step === 4 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Responsiveness &amp; Movements</h2>
            <p className="text-sm text-gray-500 mb-5">How he responded during the episode and what movements you observed.</p>
            <div className="bg-gray-50 rounded-xl p-4 mb-5">
              <p className="text-sm font-semibold text-gray-700 mb-3">During the episode, did he respond to…</p>
              <TriRow label="His name being called?" value={fd.respondName} onChange={v => set('respondName', v)} />
              <TriRow label="A familiar verbal direction?" value={fd.respondVerbal} onChange={v => set('respondVerbal', v)} />
              <TriRow label="Gentle touch?" value={fd.respondTouch} onChange={v => set('respondTouch', v)} />
              <TriRow label="People around him?" value={fd.respondAware} onChange={v => set('respondAware', v)} />
            </div>
            <CheckGroup
              label="Movements or Other Changes (select all that apply)"
              options={['Facial twitching', 'Eye or eyelid twitching', 'Lip movements', 'Chewing movements', 'Repeated swallowing', 'Hand or finger movements', 'Picking at clothing or objects', 'Jerking or twitching', 'Stiffening', 'Movement primarily on left side', 'Movement primarily on right side', 'Change in breathing', 'Change in skin color', 'Drooling', 'Loss of bladder control', 'No unusual movements noticed']}
              values={fd.movements}
              onChange={v => set('movements', toggle(fd.movements, v))}
              otherValue={fd.movementsOther}
              onOther={v => set('movementsOther', v)}
            />
          </div>
        )}

        {/* ─── STEP 5: Afterward ─── */}
        {step === 5 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">What Happened Afterward</h2>
            <p className="text-sm text-gray-500 mb-5">How he looked and behaved right after the episode ended.</p>
            <CheckGroup
              label="Immediately after the episode: (select all that apply)"
              options={['Returned immediately to usual activity', 'Seemed confused', 'Seemed tired', 'Wanted to sleep', 'Became more active', 'Became upset or dysregulated', 'Seemed unsteady', 'Had difficulty with purposeful movement', 'Seemed different from usual self']}
              values={fd.afterEpisode}
              onChange={v => set('afterEpisode', toggle(fd.afterEpisode, v))}
              otherValue={fd.afterOther}
              onOther={v => set('afterOther', v)}
            />
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">How long to return to usual baseline?</p>
              <div className="space-y-2">
                {['Immediately', 'Less than 1 minute', '1–5 minutes', '5–15 minutes', '15–30 minutes', 'More than 30 minutes'].map(opt => (
                  <button key={opt} type="button" onClick={() => set('recoveryTime', opt)}
                    className={`w-full text-left text-sm px-3 py-2.5 rounded-lg border transition-colors ${fd.recoveryTime === opt ? 'bg-blue-50 border-blue-400 text-blue-900 font-medium' : 'border-gray-200 text-gray-700 hover:border-gray-400'}`}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <FieldArea label="Additional observations about recovery:" value={fd.recoveryNotes} onChange={v => set('recoveryNotes', v)} placeholder="Anything else you noticed as he recovered…" />
          </div>
        )}

        {/* ─── STEP 6: Video, Patterns & Final ─── */}
        {step === 6 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Video, Patterns &amp; Final Notes</h2>
            <p className="text-sm text-gray-500 mb-5">Video documentation, whether this has happened before, and your most important observation.</p>

            <div className="mb-5">
              <p className="text-sm font-medium text-gray-700 mb-2">Was the episode recorded?</p>
              <div className="flex gap-3">
                {(['yes', 'no'] as const).map(v => (
                  <button key={v} type="button" onClick={() => set('videoRecorded', v)}
                    className={`px-5 py-2.5 rounded-lg border text-sm font-medium capitalize transition-colors ${fd.videoRecorded === v ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300 text-gray-600 hover:border-blue-400'}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {fd.videoRecorded === 'yes' && (
              <>
                <CheckGroup
                  label="What part was captured?"
                  options={['Beginning', 'Middle', 'End', 'Entire event']}
                  values={fd.videoCaptured}
                  onChange={v => set('videoCaptured', toggle(fd.videoCaptured, v))}
                />
                <FieldInput label="Video file name or date (for easy reference)" value={fd.videoFilename} onChange={v => set('videoFilename', v)} placeholder="e.g. IMG_2045 or Video July 11" />
              </>
            )}

            <div className="mb-5 border-t border-gray-100 pt-5">
              <p className="text-sm font-semibold text-gray-700 mb-3">Pattern Tracking</p>
              <TriRow label="Has a similar episode happened before?" value={fd.happenedBefore} onChange={v => set('happenedBefore', v)} />
              <FieldInput label="Approximately how many similar episodes today?" value={fd.episodesToday} onChange={v => set('episodesToday', v)} placeholder="e.g. 1, 2–3, 4+" />
              <TriRow label="Did the episodes look similar each time?" value={fd.lookSimilar} onChange={v => set('lookSimilar', v)} />
              <FieldArea label="What was the same or different between episodes?" value={fd.sameDifferent} onChange={v => set('sameDifferent', v)} placeholder="Describe any differences…" />
            </div>

            <div className="border-t border-gray-100 pt-5">
              <FieldArea
                label="Most Important Observation — In your own words, describe what concerned you most about this episode. Include anything not captured above."
                value={fd.mostImportant}
                onChange={v => set('mostImportant', v)}
                placeholder="What stood out most to you…"
                rows={5}
              />
            </div>

            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
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
              {submitting ? 'Submitting…' : 'Submit Observation'}
            </button>
          )}
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          This form documents observable behavior only. It is not intended to diagnose any medical condition. Information will be shared with your child&apos;s S2C practitioner and may be provided to treating medical professionals.
        </p>
      </div>
    </main>
  )
}
