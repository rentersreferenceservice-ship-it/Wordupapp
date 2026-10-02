'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ProfileField } from '@/lib/intakeStore'

const AGE_GROUPS = [
  'Young Children (ages 6–8)',
  'Children (ages 9–11)',
  'Tweens (ages 12–14)',
  'Teens (ages 15–17)',
  'Adults (18+)',
]

function describe(value: unknown): string {
  if (value == null || value === '') return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object') return Object.values(value as Record<string, unknown>).filter(Boolean).join(' · ')
  return String(value)
}

export default function ReviewNewInquiry({
  requestId, answers, submittedProfile, quotedFee, fieldLabels, fieldsNeedingReview,
}: {
  requestId: string
  answers: Record<string, unknown>
  submittedProfile: Partial<Record<ProfileField, unknown>>
  quotedFee: number | null
  fieldLabels: Record<ProfileField, string>
  fieldsNeedingReview: string[]
}) {
  const router = useRouter()
  const [ageGroup, setAgeGroup] = useState(AGE_GROUPS[0])
  const [sessionRate, setSessionRate] = useState(quotedFee != null ? String(quotedFee) : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const childName = (answers.childName as string) || ''

  async function handleApprove() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/practitioner/inquiries/${requestId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: childName,
          ageGroup,
          sessionRate: sessionRate ? parseFloat(sessionRate) : null,
          profileFields: submittedProfile,
          fieldsNeedingReview,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to approve'); setSaving(false); return }
      router.push(`/practitioner/students/${data.studentId}`)
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

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-sm font-semibold text-gray-700 mb-2">Student name</p>
        <p className="text-sm text-gray-900">{childName || '—'}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Age group</label>
        <select value={ageGroup} onChange={e => setAgeGroup(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
          {AGE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Session rate ($)</label>
        <input type="text" value={sessionRate} onChange={e => setSessionRate(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        {quotedFee != null && <p className="text-xs text-gray-400 mt-1">Pre-filled from the quoted fee — edit if needed.</p>}
      </div>

      {(Object.keys(submittedProfile) as ProfileField[]).map(field => {
        const value = describe(submittedProfile[field])
        if (!value) return null
        return (
          <div key={field} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm font-semibold text-gray-700 mb-1">{fieldLabels[field]}</p>
            <p className="text-sm text-gray-600">{value}</p>
          </div>
        )
      })}

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3 pt-2">
        <button onClick={handleDismiss} disabled={saving} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50">
          Dismiss
        </button>
        <button onClick={handleApprove} disabled={saving || !childName} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
          {saving ? 'Creating…' : 'Approve & Create Student'}
        </button>
      </div>
    </div>
  )
}
