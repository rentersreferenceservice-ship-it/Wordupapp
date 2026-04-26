'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const AGE_GROUPS = [
  'Young Children (ages 6–8)',
  'Children (ages 9–11)',
  'Tweens (ages 12–14)',
  'Teens (ages 15–17)',
  'Adults (18+)',
]

export default function NewStudentPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [ageGroup, setAgeGroup] = useState(AGE_GROUPS[0])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Student name is required.'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/practitioner/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, ageGroup, notes }),
      })
      const data = await res.json()
      if (data.id) {
        router.push(`/practitioner/students/${data.id}`)
      } else {
        setError(data.error || 'Could not create student.')
        setLoading(false)
      }
    } catch {
      setError('Something went wrong.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Add New Student</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="First name or initials"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age Group</label>
            <select
              value={ageGroup}
              onChange={e => setAgeGroup(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {AGE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any relevant notes about this student..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => router.back()} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors">
              {loading ? 'Saving…' : 'Add Student'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
