'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Lesson } from '@/lib/types'

const AGE_GROUPS = [
  'Young Children (ages 6–8)',
  'Children (ages 9–11)',
  'Tweens (ages 12–14)',
  'Teens (ages 15–17)',
  'Adults (18+)',
]

export default function HomePage() {
  const router = useRouter()
  const [topic, setTopic] = useState('')
  const [ageGroup, setAgeGroup] = useState(AGE_GROUPS[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleGenerate() {
    if (!topic.trim()) {
      setError('Please enter a topic.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, ageGroup }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Generation failed')
      }
      const lesson: Lesson = await res.json()
      router.push(`/lessons/${lesson.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8">
        <div className="text-center mb-6">
          <img
            src="/word_up_clean.jpeg"
            alt="Word Up Logo"
            className="mx-auto mb-1"
            style={{ width: 220 }}
          />
          <p className="text-gray-500 text-sm">S2C Lesson Generator</p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Topic</label>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. Photosynthesis, The American Revolution, Emotions"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
              onKeyDown={e => e.key === 'Enter' && handleGenerate()}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Age Group</label>
            <select
              value={ageGroup}
              onChange={e => setAgeGroup(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              disabled={loading}
            >
              {AGE_GROUPS.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Generating lesson — this may take a minute…' : 'Generate Lesson'}
          </button>
        </div>

        <div className="text-center mt-6">
          <a href="/lessons" className="text-sm text-blue-600 hover:underline">
            View saved lessons
          </a>
        </div>
      </div>
    </main>
  )
}
