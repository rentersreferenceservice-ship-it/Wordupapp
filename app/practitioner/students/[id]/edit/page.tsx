'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const AGE_GROUPS = ['Young Children (6-8)', 'Children (9-11)', 'Teen (12-17)', 'Adult (18+)']

export default function EditStudentPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [ageGroup, setAgeGroup] = useState('')
  const [notes, setNotes] = useState('')
  const [guardianEmail, setGuardianEmail] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (!loaded) {
    fetch(`/api/practitioner/students/${params.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.student) {
          setName(data.student.name)
          setAgeGroup(data.student.ageGroup)
          setNotes(data.student.notes ?? '')
          setGuardianEmail(data.student.guardianEmail ?? '')
          setLoaded(true)
        }
      })
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Loading…</p></div>
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const res = await fetch(`/api/practitioner/students/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, ageGroup, notes, guardianEmail }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Failed to save')
      setSaving(false)
    } else {
      router.push(`/practitioner/students/${params.id}`)
    }
  }

  return (
    <main className="min-h-screen px-6 py-8 max-w-xl mx-auto">
      <Link href={`/practitioner/students/${params.id}`} className="text-sm text-blue-600 hover:underline mb-4 block">← Back</Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Student</h1>

      <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
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
