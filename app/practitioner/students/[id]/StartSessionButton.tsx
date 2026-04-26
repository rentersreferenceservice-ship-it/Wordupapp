'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Lesson } from '@/lib/types'

export default function StartSessionButton({ studentId, studentName, lessons }: {
  studentId: string
  studentName: string
  lessons: Lesson[]
}) {
  const router = useRouter()
  const [selectedLesson, setSelectedLesson] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)

  async function handleStart() {
    if (!selectedLesson) return
    setLoading(true)
    const res = await fetch('/api/practitioner/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, lessonId: selectedLesson, sessionDate: date }),
    })
    const data = await res.json()
    if (data.sessionId) {
      router.push(`/practitioner/session/${data.sessionId}`)
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <select
        value={selectedLesson}
        onChange={e => setSelectedLesson(e.target.value)}
        className="flex-1 border border-blue-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        <option value="">Select a lesson…</option>
        {lessons.map(l => (
          <option key={l.id} value={l.id}>{l.title}</option>
        ))}
      </select>
      <input
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
        className="border border-blue-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        onClick={handleStart}
        disabled={!selectedLesson || loading}
        className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Starting…' : `Start Session`}
      </button>
    </div>
  )
}
