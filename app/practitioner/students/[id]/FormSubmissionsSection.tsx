'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Submission {
  id: string
  formType: string
  submittedBy: string
  submittedAt: string
  formData: Record<string, unknown>
}

const FORM_TYPE_LABELS: Record<string, string> = {
  family_event_log: 'Suspected Neurological Event Log (Family)',
  practitioner_event_log: 'S2C Session Neurological Event & Motor Performance Log',
  session_energy_log: 'S2C Session Energy, Motor & Performance Pattern Log',
}

function SubmissionDetail({ sub }: { sub: Submission }) {
  const fd = sub.formData as Record<string, unknown>

  if (sub.formType === 'family_event_log') {
    const movements = (fd.movements as string[] | undefined)?.join(', ') || '—'
    const eyes = (fd.eyes as string[] | undefined)?.join(', ') || '—'
    return (
      <div className="mt-4 space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          {([['Date', fd.date], ['Day', fd.dayOfWeek], ['Observer', fd.observer], ['Duration', fd.duration], ['Started', fd.timeStart], ['Ended', fd.timeEnd]] as [string, unknown][]).map(([label, val]) => (
            <div key={label}><span className="font-medium text-gray-600">{label}:</span> <span>{(val as string) || '—'}</span></div>
          ))}
        </div>
        {(fd.firstNoticed as string) && <div><p className="font-medium text-gray-600 mb-1">First thing noticed:</p><p className="bg-gray-50 rounded-lg px-3 py-2">{fd.firstNoticed as string}</p></div>}
        {(fd.doingBefore as string) && <div><p className="font-medium text-gray-600 mb-1">What he was doing before:</p><p className="bg-gray-50 rounded-lg px-3 py-2">{fd.doingBefore as string}</p></div>}
        {eyes !== '—' && <div><p className="font-medium text-gray-600 mb-1">Eyes / Gaze:</p><p className="text-gray-700">{eyes}</p></div>}
        {movements !== '—' && <div><p className="font-medium text-gray-600 mb-1">Movements:</p><p className="text-gray-700">{movements}</p></div>}
        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
          {([['Name response', fd.respondName], ['Touch response', fd.respondTouch], ['Recovery time', fd.recoveryTime], ['Happened before?', fd.happenedBefore], ['Video?', fd.videoRecorded], ['Episodes today', fd.episodesToday]] as [string, unknown][]).map(([label, val]) => (
            <div key={label}><span className="font-medium text-gray-600">{label}:</span> <span className="capitalize">{(val as string) || '—'}</span></div>
          ))}
        </div>
        {(fd.mostImportant as string) && <div><p className="font-medium text-gray-600 mb-1">Most important observation:</p><p className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{fd.mostImportant as string}</p></div>}
        {(fd.recoveryNotes as string) && <div><p className="font-medium text-gray-600 mb-1">Recovery notes:</p><p className="bg-gray-50 rounded-lg px-3 py-2">{fd.recoveryNotes as string}</p></div>}
      </div>
    )
  }

  function arr(key: string) { return (fd[key] as string[] | undefined)?.join(', ') || '' }
  function val(key: string) { return (fd[key] as string) || '' }

  if (sub.formType === 'practitioner_event_log') {
    return (
      <div className="mt-4 space-y-4 text-sm">
        {/* Session info */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
          {([['Date', 'date'], ['Student', 'studentName'], ['Session start', 'sessionStart'], ['Session end', 'sessionEnd'], ['Board', 'boardUsed'], ['Video recorded', 'videoRecorded']] as [string, string][]).map(([label, key]) => (
            val(key) ? <div key={key}><span className="font-medium text-gray-600">{label}:</span> <span className="capitalize">{val(key)}</span></div> : null
          ))}
        </div>

        {/* Baseline */}
        {(arr('overallRegulation') || arr('visualOrientation')) && (
          <div>
            <p className="font-semibold text-gray-700 mb-1">Baseline</p>
            <div className="bg-gray-50 rounded-lg px-3 py-2 space-y-1">
              {arr('overallRegulation') && <p><span className="font-medium text-gray-600">Regulation:</span> {arr('overallRegulation')}</p>}
              {arr('visualOrientation') && <p><span className="font-medium text-gray-600">Visual orientation:</span> {arr('visualOrientation')}</p>}
              {arr('commonMotorPattern') && <p><span className="font-medium text-gray-600">Motor pattern:</span> {arr('commonMotorPattern')}</p>}
              {(val('baselineWordsAttempted') || val('baselineAccuracyPct')) && (
                <p><span className="font-medium text-gray-600">Spelling:</span> {val('baselineWordsAttempted')} words, {val('baselineAccuracyPct')}% accuracy</p>
              )}
            </div>
          </div>
        )}

        {/* Event */}
        {(val('eventTimeStart') || val('firstObservableChange') || val('eventDescription')) && (
          <div>
            <p className="font-semibold text-gray-700 mb-1">Suspected Event</p>
            <div className="bg-blue-50 rounded-lg px-3 py-2 space-y-1">
              {(val('eventTimeStart') || val('eventDuration')) && <p><span className="font-medium text-gray-600">Time:</span> {val('eventTimeStart')}{val('eventTimeEnd') ? ` – ${val('eventTimeEnd')}` : ''}{val('eventDuration') ? ` (${val('eventDuration')})` : ''}</p>}
              {val('activityBefore') && <p><span className="font-medium text-gray-600">Activity before:</span> {val('activityBefore')}</p>}
              {val('firstObservableChange') && <p><span className="font-medium text-gray-600">First change noticed:</span> {val('firstObservableChange')}</p>}
              {arr('gazeEyes') && <p><span className="font-medium text-gray-600">Gaze/eyes:</span> {arr('gazeEyes')}</p>}
              {arr('responsiveness') && <p><span className="font-medium text-gray-600">Responsiveness:</span> {arr('responsiveness')}</p>}
              {arr('bodyMotor') && <p><span className="font-medium text-gray-600">Body/motor:</span> {arr('bodyMotor')}</p>}
              {val('eventDescription') && <p className="mt-1"><span className="font-medium text-gray-600">Description:</span> {val('eventDescription')}</p>}
            </div>
          </div>
        )}

        {/* Post-event */}
        {(val('timeUntilReturn') || arr('afterEvent') || val('postEventAccuracyPct')) && (
          <div>
            <p className="font-semibold text-gray-700 mb-1">After the Event</p>
            <div className="bg-gray-50 rounded-lg px-3 py-2 space-y-1">
              {val('timeUntilReturn') && <p><span className="font-medium text-gray-600">Time until return to baseline:</span> {val('timeUntilReturn')}</p>}
              {arr('afterEvent') && <p><span className="font-medium text-gray-600">Observed after:</span> {arr('afterEvent')}</p>}
              {val('postEventAccuracyPct') && <p><span className="font-medium text-gray-600">Post-event spelling accuracy:</span> {val('postEventAccuracyPct')}%</p>}
              {arr('comparisonObservations') && <p><span className="font-medium text-gray-600">Compared to baseline:</span> {arr('comparisonObservations')}</p>}
            </div>
          </div>
        )}

        {/* KNOWN question */}
        {val('knownQuestion') && (
          <div>
            <p className="font-semibold text-gray-700 mb-1">KNOWN Question</p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 space-y-1">
              <p><span className="font-medium text-gray-600">Result:</span> <span className="capitalize">{val('knownQuestion')}</span></p>
              {val('questionAsked') && <p><span className="font-medium text-gray-600">Question:</span> {val('questionAsked')}</p>}
              {val('questionResponse') && <p><span className="font-medium text-gray-600">Response:</span> {val('questionResponse')}</p>}
            </div>
          </div>
        )}

        {/* Summary */}
        {(val('numberOfEvents') || val('additionalObservations') || val('videoTimestamps')) && (
          <div className="space-y-1">
            {val('numberOfEvents') && <p><span className="font-medium text-gray-600">Events this session:</span> {val('numberOfEvents')}</p>}
            {val('videoTimestamps') && <p><span className="font-medium text-gray-600">Video timestamps:</span> {val('videoTimestamps')}</p>}
            {val('additionalObservations') && <div><p className="font-medium text-gray-600 mb-1">Additional observations:</p><p className="bg-gray-50 rounded-lg px-3 py-2">{val('additionalObservations')}</p></div>}
          </div>
        )}
      </div>
    )
  }

  if (sub.formType === 'session_energy_log') {
    return (
      <div className="mt-4 space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
          {([['Date', 'sessionDate'], ['Student', 'studentName'], ['Start', 'sessionStart'], ['End', 'sessionEnd']] as [string, string][]).map(([label, key]) => (
            val(key) ? <div key={key}><span className="font-medium text-gray-600">{label}:</span> <span>{val(key)}</span></div> : null
          ))}
        </div>
        {arr('sleepHealth') && (
          <div><p className="font-medium text-gray-600 mb-1">Sleep / health factors:</p><p className="bg-gray-50 rounded-lg px-3 py-2">{arr('sleepHealth')}</p></div>
        )}
        {arr('baselineEnergy') && (
          <div>
            <p className="font-semibold text-gray-700 mb-1">Baseline</p>
            <div className="bg-gray-50 rounded-lg px-3 py-2 space-y-1">
              {arr('baselineEnergy') && <p><span className="font-medium text-gray-600">Energy/arousal:</span> {arr('baselineEnergy')}</p>}
              {arr('baselineRegulation') && <p><span className="font-medium text-gray-600">Regulation:</span> {arr('baselineRegulation')}</p>}
              {arr('baselineVisual') && <p><span className="font-medium text-gray-600">Visual orientation:</span> {arr('baselineVisual')}</p>}
            </div>
          </div>
        )}
        {val('additionalObservations') && (
          <div><p className="font-medium text-gray-600 mb-1">Summary:</p><p className="bg-gray-50 rounded-lg px-3 py-2">{val('additionalObservations')}</p></div>
        )}
        <p className="text-xs text-gray-400">Full session tracking table saved.</p>
      </div>
    )
  }

  // Fallback
  return (
    <div className="mt-3 text-sm text-gray-400 py-2">Full submission recorded.</div>
  )
}

interface FormCard {
  formType: string
  label: string
  description: string
  who: 'Family' | 'Practitioner'
  whoColor: string
  action: 'share' | 'fill'
  fillPath?: string
}

const FORMS: FormCard[] = [
  {
    formType: 'family_event_log',
    label: 'Suspected Neurological Event Log',
    description: 'Family fills this out when a suspected episode occurs at home. Send them the link — they fill it out on their phone and it goes straight into this record.',
    who: 'Family',
    whoColor: 'bg-purple-100 text-purple-700',
    action: 'share',
  },
  {
    formType: 'practitioner_event_log',
    label: 'S2C Session Neurological Event & Motor Performance Log',
    description: 'Fill out during or after a session when a suspected event occurred. Tracks gaze, responsiveness, motor control, and spelling before and after the event.',
    who: 'Practitioner',
    whoColor: 'bg-blue-100 text-blue-700',
    action: 'fill',
    fillPath: 'forms/event-log',
  },
  {
    formType: 'session_energy_log',
    label: 'Session Energy, Motor & Performance Pattern Log',
    description: 'Fill out to track changes in energy, regulation, visual orientation, and motor control across the session at multiple time intervals.',
    who: 'Practitioner',
    whoColor: 'bg-green-100 text-green-700',
    action: 'fill',
    fillPath: 'forms/energy-log',
  },
]

export default function FormSubmissionsSection({
  studentId,
  initialSubmissions,
}: {
  studentId: string
  initialSubmissions: Submission[]
}) {
  const [subs] = useState<Submission[]>(initialSubmissions)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [familyLink, setFamilyLink] = useState<string | null>(null)
  const [loadingLink, setLoadingLink] = useState(false)
  const [copied, setCopied] = useState(false)
  const [linkError, setLinkError] = useState('')

  async function handleGetLink() {
    setLoadingLink(true)
    setLinkError('')
    try {
      const res = await fetch(`/api/practitioner/students/${studentId}/form-token`)
      const data = await res.json()
      if (!res.ok) { setLinkError('Could not generate link. Please try again.'); return }
      setFamilyLink(`${window.location.origin}/observe/${data.token}`)
    } finally {
      setLoadingLink(false)
    }
  }

  async function handleCopy() {
    if (!familyLink) return
    await navigator.clipboard.writeText(familyLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <h2 className="text-base font-semibold text-gray-900 mb-1">Observation Forms</h2>
      <p className="text-xs text-gray-400 mb-5">Each form is fillable online. Family forms generate a shareable link you can send by text or email. Practitioner forms open directly for you to fill out.</p>

      <div className="space-y-3 mb-6">
        {FORMS.map(form => (
          <div key={form.formType} className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="text-sm font-semibold text-gray-900">{form.label}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${form.whoColor}`}>{form.who}</span>
                </div>
                <p className="text-xs text-gray-500">{form.description}</p>
              </div>
            </div>

            {form.action === 'share' && (
              <div>
                {!familyLink ? (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleGetLink}
                      disabled={loadingLink}
                      className="text-sm font-semibold bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                    >
                      {loadingLink ? 'Getting link…' : 'Get shareable link'}
                    </button>
                    {linkError && <p className="text-xs text-red-500">{linkError}</p>}
                  </div>
                ) : (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 mb-2">Send this link to the family:</p>
                    <a
                      href={familyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs text-purple-700 break-all underline mb-3 font-mono leading-relaxed"
                    >
                      {familyLink}
                    </a>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={handleCopy}
                        className="text-xs font-semibold bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        {copied ? '✓ Copied!' : 'Copy link'}
                      </button>
                      <a
                        href={familyLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold border border-purple-400 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors"
                      >
                        Preview what they see →
                      </a>
                    </div>
                    <p className="text-xs text-purple-600 mt-2">The family uses this same link every time — each submission is saved separately below.</p>
                  </div>
                )}
              </div>
            )}

            {form.action === 'fill' && form.fillPath && (
              <Link
                href={`/practitioner/students/${studentId}/${form.fillPath}`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Fill out now →
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Submissions */}
      <div className="border-t border-gray-100 pt-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Submitted Forms {subs.length > 0 && <span className="text-gray-400 font-normal ml-1">({subs.length})</span>}
        </h3>
        {subs.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No submissions yet. Send the family form link or fill out a practitioner form above.</p>
        ) : (
          <ul className="space-y-2">
            {subs.map(sub => {
              const fd = sub.formData as Record<string, unknown>
              const isExpanded = expandedId === sub.id
              const dateStr = (fd.date as string) || (fd.sessionDate as string) || new Date(sub.submittedAt).toLocaleDateString()
              const timeStr = (fd.timeStart as string) ? ` · ${fd.timeStart as string}` : ''
              const summary = (fd.firstNoticed as string)?.slice(0, 70) || (fd.mostImportant as string)?.slice(0, 70) || (fd.additionalObservations as string)?.slice(0, 70) || ''

              return (
                <li key={sub.id} className="border border-gray-100 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                    className="w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900">{dateStr}{timeStr}</span>
                        <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {FORM_TYPE_LABELS[sub.formType] ?? sub.formType}
                        </span>
                        <span className="text-xs text-gray-400 capitalize">{sub.submittedBy}</span>
                      </div>
                      {summary && <p className="text-xs text-gray-500 truncate">{summary}{summary.length >= 70 ? '…' : ''}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(sub.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Link
                        href={`/practitioner/students/${studentId}/forms/submissions/${sub.id}`}
                        onClick={e => e.stopPropagation()}
                        className="text-xs font-semibold text-blue-600 hover:underline"
                      >
                        Full report →
                      </Link>
                      <span className="text-xs text-gray-400">{isExpanded ? '▲ Hide' : '▼ Show'}</span>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-100">
                      <SubmissionDetail sub={sub} />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
