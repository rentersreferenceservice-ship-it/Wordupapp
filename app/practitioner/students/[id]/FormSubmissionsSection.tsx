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
          {[['Date', fd.date], ['Day', fd.dayOfWeek], ['Observer', fd.observer], ['Duration', fd.duration], ['Started', fd.timeStart], ['Ended', fd.timeEnd]].map(([label, val]) => (
            <div key={label as string}><span className="font-medium text-gray-600">{label}:</span> <span>{(val as string) || '—'}</span></div>
          ))}
        </div>
        {(fd.firstNoticed as string) && <div><p className="font-medium text-gray-600 mb-1">First thing noticed:</p><p className="bg-gray-50 rounded-lg px-3 py-2">{fd.firstNoticed as string}</p></div>}
        {(fd.doingBefore as string) && <div><p className="font-medium text-gray-600 mb-1">What he was doing before:</p><p className="bg-gray-50 rounded-lg px-3 py-2">{fd.doingBefore as string}</p></div>}
        {eyes !== '—' && <div><p className="font-medium text-gray-600 mb-1">Eyes / Gaze:</p><p className="text-gray-700">{eyes}</p></div>}
        {movements !== '—' && <div><p className="font-medium text-gray-600 mb-1">Movements:</p><p className="text-gray-700">{movements}</p></div>}
        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
          {[['Name response', fd.respondName], ['Touch response', fd.respondTouch], ['Recovery time', fd.recoveryTime], ['Happened before?', fd.happenedBefore], ['Video?', fd.videoRecorded], ['Episodes today', fd.episodesToday]].map(([label, val]) => (
            <div key={label as string}><span className="font-medium text-gray-600">{label}:</span> <span className="capitalize">{(val as string) || '—'}</span></div>
          ))}
        </div>
        {(fd.mostImportant as string) && <div><p className="font-medium text-gray-600 mb-1">Most important observation:</p><p className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{fd.mostImportant as string}</p></div>}
        {(fd.recoveryNotes as string) && <div><p className="font-medium text-gray-600 mb-1">Recovery notes:</p><p className="bg-gray-50 rounded-lg px-3 py-2">{fd.recoveryNotes as string}</p></div>}
      </div>
    )
  }

  // Generic display for practitioner forms
  const dateVal = (fd.date as string) || (fd.sessionDate as string) || ''
  return (
    <div className="mt-3 space-y-2 text-sm">
      {dateVal && <div><span className="font-medium text-gray-600">Date:</span> {dateVal}</div>}
      {(fd.additionalObservations as string) && <div><p className="font-medium text-gray-600 mb-1">Summary:</p><p className="bg-gray-50 rounded-lg px-3 py-2">{fd.additionalObservations as string}</p></div>}
      {(fd.mostImportant as string) && <div><p className="font-medium text-gray-600 mb-1">Key observation:</p><p className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{fd.mostImportant as string}</p></div>}
      <p className="text-xs text-gray-400">Full submission recorded.</p>
    </div>
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
                    <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">{isExpanded ? '▲ Hide' : '▼ View'}</span>
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
