'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Student } from '@/lib/practitionerStore'
import type { Hunk } from '@/lib/types'

export default function StartSessionFromLesson({ lessonId, lessonTitle, students, customHunks }: {
  lessonId: string
  lessonTitle: string
  students: Student[]
  customHunks?: Hunk[] | null
}) {
  const router = useRouter()
  const [studentId, setStudentId] = useState(students[0]?.id ?? '')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)

  async function handleStart() {
    if (!studentId) return
    setLoading(true)
    const res = await fetch('/api/practitioner/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, lessonId, sessionDate: date, customHunks: customHunks ?? null }),
    })
    const data = await res.json()
    if (data.sessionId) {
      router.push(`/practitioner/session/${data.sessionId}`)
    }
    setLoading(false)
  }

  if (students.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 print:hidden">
        <p className="text-sm text-blue-700">Add a student to your caseload before starting a session.</p>
      </div>
    )
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 print:hidden">
      <p className="text-sm font-semibold text-blue-900 mb-3">Start a session with this lesson</p>
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-blue-700 mb-1">Student</label>
          <select
            value={studentId}
            onChange={e => setStudentId(e.target.value)}
            className="border border-blue-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-blue-700 mb-1">Session Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={handleStart}
          disabled={!studentId || loading}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Starting…' : `Start Session — ${lessonTitle}`}
        </button>
      </div>
    </div>
  )
}
