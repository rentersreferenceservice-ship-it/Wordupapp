'use client'

import { useState } from 'react'

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
    const checkedMovements = (fd.movements as string[] | undefined)?.join(', ') || '—'
    const checkedEyes = (fd.eyes as string[] | undefined)?.join(', ') || '—'
    return (
      <div className="mt-4 space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div><span className="font-medium text-gray-600">Date:</span> <span>{(fd.date as string) || '—'}</span></div>
          <div><span className="font-medium text-gray-600">Day:</span> <span>{(fd.dayOfWeek as string) || '—'}</span></div>
          <div><span className="font-medium text-gray-600">Observer:</span> <span>{(fd.observer as string) || '—'}</span></div>
          <div><span className="font-medium text-gray-600">Duration:</span> <span>{(fd.duration as string) || '—'}</span></div>
          <div><span className="font-medium text-gray-600">Started:</span> <span>{(fd.timeStart as string) || '—'}</span></div>
          <div><span className="font-medium text-gray-600">Ended:</span> <span>{(fd.timeEnd as string) || '—'}</span></div>
        </div>
        {(fd.firstNoticed as string) && (
          <div><p className="font-medium text-gray-600 mb-1 text-sm">First thing noticed:</p><p className="text-gray-800 bg-gray-50 rounded-lg px-3 py-2 text-sm">{fd.firstNoticed as string}</p></div>
        )}
        {(fd.doingBefore as string) && (
          <div><p className="font-medium text-gray-600 mb-1 text-sm">What he was doing before:</p><p className="text-gray-800 bg-gray-50 rounded-lg px-3 py-2 text-sm">{fd.doingBefore as string}</p></div>
        )}
        {checkedEyes !== '—' && (
          <div><p className="font-medium text-gray-600 mb-1 text-sm">Eyes / Gaze:</p><p className="text-gray-700 text-sm">{checkedEyes}</p></div>
        )}
        {checkedMovements !== '—' && (
          <div><p className="font-medium text-gray-600 mb-1 text-sm">Movements observed:</p><p className="text-gray-700 text-sm">{checkedMovements}</p></div>
        )}
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <div><span className="font-medium text-gray-600">Name response:</span> <span className="capitalize">{(fd.respondName as string) || '—'}</span></div>
          <div><span className="font-medium text-gray-600">Touch response:</span> <span className="capitalize">{(fd.respondTouch as string) || '—'}</span></div>
          <div><span className="font-medium text-gray-600">Recovery time:</span> <span>{(fd.recoveryTime as string) || '—'}</span></div>
          <div><span className="font-medium text-gray-600">Happened before?</span> <span className="capitalize">{(fd.happenedBefore as string) || '—'}</span></div>
          <div><span className="font-medium text-gray-600">Video recorded?</span> <span className="capitalize">{(fd.videoRecorded as string) || '—'}</span></div>
          <div><span className="font-medium text-gray-600">Episodes today:</span> <span>{(fd.episodesToday as string) || '—'}</span></div>
        </div>
        {(fd.mostImportant as string) && (
          <div><p className="font-medium text-gray-600 mb-1 text-sm">Most important observation:</p><p className="text-gray-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm">{fd.mostImportant as string}</p></div>
        )}
        {(fd.recoveryNotes as string) && (
          <div><p className="font-medium text-gray-600 mb-1 text-sm">Recovery notes:</p><p className="text-gray-800 bg-gray-50 rounded-lg px-3 py-2 text-sm">{fd.recoveryNotes as string}</p></div>
        )}
        {((fd.factors as string[] | undefined)?.length ?? 0) > 0 && (
          <div><p className="font-medium text-gray-600 mb-1 text-sm">24-hour factors:</p><p className="text-gray-700 text-sm">{(fd.factors as string[]).join(', ')}</p></div>
        )}
      </div>
    )
  }
  return <div className="mt-3 text-xs text-gray-400">Submission recorded.</div>
}

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
      <h2 className="text-base font-semibold text-gray-900 mb-1">Online Observation Forms</h2>
      <p className="text-xs text-gray-400 mb-5">
        Send a link to the family. They tap it, fill out the form on their phone, hit submit, and it goes straight into this record. The same link works every time — no login needed.
      </p>

      {/* Available forms */}
      <div className="space-y-3 mb-6">

        {/* Family Neurological Event Log */}
        <div className="border border-gray-200 rounded-xl p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <p className="text-sm font-semibold text-gray-900">Suspected Neurological Event Log</p>
              <p className="text-xs text-gray-500 mt-0.5">For the family to fill out when a suspected episode occurs at home.</p>
            </div>
            <span className="flex-shrink-0 text-xs font-semibold bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Family</span>
          </div>

          {!familyLink ? (
            <div>
              <button
                onClick={handleGetLink}
                disabled={loadingLink}
                className="mt-1 text-sm font-semibold text-blue-600 hover:underline disabled:opacity-50"
              >
                {loadingLink ? 'Getting link…' : 'Get shareable link →'}
              </button>
              {linkError && <p className="text-xs text-red-500 mt-1">{linkError}</p>}
            </div>
          ) : (
            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-blue-800 mb-2">Shareable link — send this to the family:</p>
              <a
                href={familyLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-blue-700 break-all underline mb-3 font-mono leading-relaxed"
              >
                {familyLink}
              </a>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="text-xs font-semibold bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {copied ? '✓ Copied!' : 'Copy link'}
                </button>
                <a
                  href={familyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold border border-blue-400 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Open to preview →
                </a>
              </div>
              <p className="text-xs text-blue-600 mt-2">The family can use this link every time — each submission is saved separately.</p>
            </div>
          )}
        </div>

      </div>

      {/* Past submissions */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Submitted Forms {subs.length > 0 && <span className="text-gray-400 font-normal">({subs.length})</span>}
        </h3>

        {subs.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            No submissions yet. Once the family fills out the form, their submissions will appear here.
          </p>
        ) : (
          <ul className="space-y-2">
            {subs.map(sub => {
              const fd = sub.formData as Record<string, unknown>
              const isExpanded = expandedId === sub.id
              const dateStr = (fd.date as string) || new Date(sub.submittedAt).toLocaleDateString()
              const timeStr = (fd.timeStart as string) ? ` · ${fd.timeStart as string}` : ''
              const summary = (fd.firstNoticed as string)?.slice(0, 70) || (fd.mostImportant as string)?.slice(0, 70) || ''

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
                        <span className="text-xs font-semibold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                          {FORM_TYPE_LABELS[sub.formType] ?? sub.formType}
                        </span>
                      </div>
                      {summary && <p className="text-xs text-gray-500 truncate">{summary}{summary.length >= 70 ? '…' : ''}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">
                        Submitted {new Date(sub.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
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
