'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ProfileField } from '@/lib/intakeStore'
import type { DiffEntry } from './page'

export default function ReviewExistingClient({
  requestId, entries, submittedValues,
}: {
  requestId: string
  entries: DiffEntry[]
  submittedValues: Partial<Record<ProfileField, unknown>>
}) {
  const router = useRouter()
  // For each conflicting field, which side to keep: 'new' or 'current'.
  // Fields with no existing value default to 'new' since there's nothing to lose.
  const [choices, setChoices] = useState<Record<string, 'new' | 'current'>>(
    Object.fromEntries(entries.map(e => [e.field, e.oldValue ? 'current' : 'new']))
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleApprove() {
    setSaving(true)
    setError('')
    const resolvedFields: Partial<Record<ProfileField, unknown>> = {}
    for (const entry of entries) {
      if (choices[entry.field] === 'new') {
        resolvedFields[entry.field] = submittedValues[entry.field]
      }
    }
    try {
      const res = await fetch(`/api/practitioner/inquiries/${requestId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolvedFields }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to approve'); setSaving(false); return }
      router.push('/practitioner/inquiries')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to approve')
      setSaving(false)
    }
  }

  async function handleDismiss() {
    setSaving(true)
    await fetch(`/api/practitioner/inquiries/${requestId}/dismiss`, { method: 'POST' })
    router.push('/practitioner/inquiries')
  }

  if (entries.length === 0) {
    return <p className="text-sm text-gray-400">No new information was submitted.</p>
  }

  return (
    <div className="space-y-3">
      {entries.map(entry => {
        const hasConflict = !!entry.oldValue && !!entry.newValue && entry.oldValue !== entry.newValue
        return (
          <div key={entry.field} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">{entry.label}</p>
            {!hasConflict ? (
              <p className="text-sm text-gray-600">{entry.newValue || entry.oldValue}</p>
            ) : (
              <div className="space-y-2">
                <label className="flex items-start gap-2 p-2 rounded-lg border border-gray-200 cursor-pointer has-[:checked]:border-blue-400 has-[:checked]:bg-blue-50">
                  <input type="radio" name={entry.field} checked={choices[entry.field] === 'current'}
                    onChange={() => setChoices(c => ({ ...c, [entry.field]: 'current' }))} className="mt-1" />
                  <span className="text-sm"><span className="text-xs text-gray-400 block">On file</span>{entry.oldValue}</span>
                </label>
                <label className="flex items-start gap-2 p-2 rounded-lg border border-gray-200 cursor-pointer has-[:checked]:border-blue-400 has-[:checked]:bg-blue-50">
                  <input type="radio" name={entry.field} checked={choices[entry.field] === 'new'}
                    onChange={() => setChoices(c => ({ ...c, [entry.field]: 'new' }))} className="mt-1" />
                  <span className="text-sm"><span className="text-xs text-gray-400 block">Submitted</span>{entry.newValue}</span>
                </label>
              </div>
            )}
          </div>
        )
      })}

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3 pt-2">
        <button onClick={handleDismiss} disabled={saving} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50">
          Dismiss
        </button>
        <button onClick={handleApprove} disabled={saving} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
          {saving ? 'Saving…' : 'Approve'}
        </button>
      </div>
    </div>
  )
}
