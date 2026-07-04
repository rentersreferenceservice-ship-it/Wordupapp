'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const AGE_GROUPS = ['Young Children (6-8)', 'Children (9-11)', 'Teen (12-17)', 'Adult (18+)']

interface StudentData {
  id: string
  name: string
  ageGroup: string
  notes: string
  guardianEmail: string
  funderName: string
  funderEmail: string
  sessionRate: number | null
  defaultMileage: number | null
}

export default function EditStudentForm({ student }: { student: StudentData }) {
  const router = useRouter()
  const [name, setName] = useState(student.name)
  const [ageGroup, setAgeGroup] = useState(student.ageGroup)
  const [notes, setNotes] = useState(student.notes ?? '')
  const [guardianEmail, setGuardianEmail] = useState(student.guardianEmail ?? '')
  const [funderName, setFunderName] = useState(student.funderName ?? '')
  const [funderEmail, setFunderEmail] = useState(student.funderEmail ?? '')
  const [sessionRate, setSessionRate] = useState(student.sessionRate != null ? String(student.sessionRate) : '')
  const [defaultMileage, setDefaultMileage] = useState(student.defaultMileage != null ? String(student.defaultMileage) : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const res = await fetch(`/api/practitioner/students/${student.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, ageGroup, notes, guardianEmail, funderName, funderEmail,
        sessionRate: sessionRate ? parseFloat(sessionRate) : null,
        defaultMileage: defaultMileage ? parseFloat(defaultMileage) : null,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Failed to save')
      setSaving(false)
    } else {
      router.push(`/practitioner/students/${student.id}`)
    }
  }

  return (
    <main className="min-h-screen px-6 py-8 max-w-xl mx-auto">
      <Link href={`/practitioner/students/${student.id}`} className="text-sm text-blue-600 hover:underline mb-4 block">← Back</Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Student</h1>

      <form onSubmit={handleSave} className="space-y-6">

        {/* Basic Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Student Info</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age Group</label>
            <select
              value={ageGroup}
              onChange={e => setAgeGroup(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select age group…</option>
              {AGE_GROUPS.map(ag => <option key={ag} value={ag}>{ag}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Email</label>
            <input
              type="email"
              value={guardianEmail}
              onChange={e => setGuardianEmail(e.target.value)}
              placeholder="guardian@email.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Optional notes about this student…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Billing */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Billing &amp; Bill To</h2>
          <p className="text-xs text-gray-400">Used when generating invoices for this student.</p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session Rate ($) <span className="text-gray-400 font-normal">— overrides your default</span></label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={sessionRate}
              onChange={e => setSessionRate(e.target.value)}
              placeholder="Leave blank to use your default rate"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default Trip Mileage <span className="text-gray-400 font-normal">— auto-logged when you invoice this student</span></label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={defaultMileage}
              onChange={e => setDefaultMileage(e.target.value)}
              placeholder="e.g. 12.5"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bill To Name</label>
            <input
              type="text"
              value={funderName}
              onChange={e => setFunderName(e.target.value)}
              placeholder="e.g. Department of Education, School District"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bill To Email</label>
            <input
              type="email"
              value={funderEmail}
              onChange={e => setFunderEmail(e.target.value)}
              placeholder="billing@organization.org"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </main>
  )
}
