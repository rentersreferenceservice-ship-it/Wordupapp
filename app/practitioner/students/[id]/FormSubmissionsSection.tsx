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

function Pill({ text, color }: { text: string; color: string }) {
  return <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{text}</span>
}

function SubmissionDetail({ sub }: { sub: Submission }) {
  const fd = sub.formData as Record<string, unknown>
  if (sub.formType === 'family_event_log') {
    const checkedMovements = (fd.movements as string[] | undefined)?.join(', ') || '—'
    const checkedEyes = (fd.eyes as string[] | undefined)?.join(', ') || '—'
    return (
      <div className="mt-4 space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          <div><span className="font-medium text-gray-600">Date:</span> <span>{(fd.date as string) || '—'}</span></div>
          <div><span className="font-medium text-gray-600">Day:</span> <span>{(fd.dayOfWeek as string) || '—'}</span></div>
          <div><span className="font-medium text-gray-600">Observer:</span> <span>{(fd.observer as string) || '—'}</span></div>
          <div><span className="font-medium text-gray-600">Duration:</span> <span>{(fd.duration as string) || '—'}</span></div>
          <div><span className="font-medium text-gray-600">Started:</span> <span>{(fd.timeStart as string) || '—'}</span></div>
          <div><span className="font-medium text-gray-600">Ended:</span> <span>{(fd.timeEnd as string) || '—'}</span></div>
        </div>
        {(fd.firstNoticed as string) && (
          <div><p className="font-medium text-gray-600 mb-1">First thing noticed:</p><p className="text-gray-800 bg-gray-50 rounded-lg px-3 py-2">{fd.firstNoticed as string}</p></div>
        )}
        {(fd.doingBefore as string) && (
          <div><p className="font-medium text-gray-600 mb-1">What he was doing before:</p><p className="text-gray-800 bg-gray-50 rounded-lg px-3 py-2">{fd.doingBefore as string}</p></div>
        )}
        {checkedEyes !== '—' && (
          <div><p className="font-medium text-gray-600 mb-1">Eyes/Gaze:</p><p className="text-gray-700">{checkedEyes}</p></div>
        )}
        {checkedMovements !== '—' && (
          <div><p className="font-medium text-gray-600 mb-1">Movements observed:</p><p className="text-gray-700">{checkedMovements}</p></div>
        )}
        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
          <div><span className="font-medium text-gray-600">Name response:</span> <span className="capitalize">{(fd.respondName as string) || '—'}</span></div>
          <div><span className="font-medium text-gray-600">Touch response:</span> <span className="capitalize">{(fd.respondTouch as string) || '—'}</span></div>
          <div><span className="font-medium text-gray-600">Recovery time:</span> <span>{(fd.recoveryTime as string) || '—'}</span></div>
          <div><span className="font-medium text-gray-600">Happened before?</span> <span className="capitalize">{(fd.happenedBefore as string) || '—'}</span></div>
          <div><span className="font-medium text-gray-600">Video recorded?</span> <span className="capitalize">{(fd.videoRecorded as string) || '—'}</span></div>
          <div><span className="font-medium text-gray-600">Episodes today:</span> <span>{(fd.episodesToday as string) || '—'}</span></div>
        </div>
        {(fd.mostImportant as string) && (
          <div><p className="font-medium text-gray-600 mb-1">Most important observation:</p><p className="text-gray-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{fd.mostImportant as string}</p></div>
        )}
        {(fd.recoveryNotes as string) && (
          <div><p className="font-medium text-gray-600 mb-1">Recovery notes:</p><p className="text-gray-800 bg-gray-50 rounded-lg px-3 py-2">{fd.recoveryNotes as string}</p></div>
        )}
        {((fd.factors as string[] | undefined)?.length ?? 0) > 0 && (
          <div><p className="font-medium text-gray-600 mb-1">24-hour factors:</p><p className="text-gray-700">{(fd.factors as string[]).join(', ')}</p></div>
        )}
      </div>
    )
  }
  return (
    <div className="mt-3 text-xs text-gray-400">Full data recorded — custom view coming soon.</div>
  )
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
  const [shareLink, setShareLink] = useState<string | null>(null)
  const [copyingLink, setCopyingLink] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleCopyLink() {
    setCopyingLink(true)
    try {
      const res = await fetch(`/api/practitioner/students/${studentId}/form-token`)
      const data = await res.json()
      if (!res.ok) { alert('Could not generate link.'); return }
      const url = `${window.location.origin}/observe/${data.token}`
      setShareLink(url)
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } finally {
      setCopyingLink(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Online Observation Forms</h2>
          <p className="text-xs text-gray-400 mt-0.5">Share a link with the family so they can submit observations directly to this record.</p>
        </div>
        <button
          onClick={handleCopyLink}
          disabled={copyingLink}
          className="flex-shrink-0 text-xs font-semibold bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {copyingLink ? 'Getting link…' : copied ? '✓ Copied!' : 'Copy Family Form Link'}
        </button>
      </div>

      {shareLink && (
        <div className="mb-5 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs font-semibold text-blue-800 mb-1">Family Observation Form Link</p>
          <p className="text-xs text-blue-700 break-all font-mono">{shareLink}</p>
          <p className="text-xs text-blue-600 mt-1.5">Send this link to the family. They can use it anytime — no account needed. Each submission appears below.</p>
        </div>
      )}

      {subs.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-gray-400 mb-1">No submissions yet.</p>
          <p className="text-xs text-gray-400">Copy the family form link above and send it to the family. Their submissions will appear here.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {subs.map(sub => {
            const fd = sub.formData as Record<string, unknown>
            const isExpanded = expandedId === sub.id
            const dateStr = (fd.date as string) || new Date(sub.submittedAt).toLocaleDateString()
            const timeStr = (fd.timeStart as string) ? ` · ${fd.timeStart as string}` : ''
            const summary = (fd.firstNoticed as string)?.slice(0, 60) || (fd.mostImportant as string)?.slice(0, 60) || ''

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
                      <Pill text={FORM_TYPE_LABELS[sub.formType] ?? sub.formType} color="bg-purple-100 text-purple-700" />
                      <Pill text={sub.submittedBy === 'family' ? 'Family' : 'Practitioner'} color="bg-gray-100 text-gray-600" />
                    </div>
                    {summary && <p className="text-xs text-gray-500 truncate">{summary}{summary.length >= 60 ? '…' : ''}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">Submitted {new Date(sub.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                  </div>
                  <span className="text-gray-400 text-xs mt-0.5 flex-shrink-0">{isExpanded ? '▲ Hide' : '▼ View'}</span>
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
  )
}
