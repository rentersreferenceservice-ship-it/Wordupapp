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

const TONES = [
  { value: 'conversational', label: 'Conversational' },
  { value: 'humor', label: 'Humor & Playful' },
  { value: 'story', label: 'Narrative Story' },
  { value: 'science', label: 'Science & Discovery' },
  { value: 'realworld', label: 'Real-World' },
]

const GENRES = [
  { value: '', label: 'General' },
  { value: 'science', label: 'Science & Nature' },
  { value: 'history', label: 'History' },
  { value: 'math', label: 'Mathematics' },
  { value: 'geography', label: 'Geography & Culture' },
  { value: 'literature', label: 'Language Arts' },
  { value: 'health', label: 'Health & Wellness' },
  { value: 'arts', label: 'Arts & Music' },
  { value: 'technology', label: 'Technology' },
  { value: 'sel', label: 'Social-Emotional' },
]

function Chip({ label, selected, onClick, disabled }: { label: string; selected: boolean; onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
        selected
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {label}
    </button>
  )
}

export default function PractitionerGeneratePage() {
  const router = useRouter()
  const [topic, setTopic] = useState('')
  const [ageGroup, setAgeGroup] = useState(AGE_GROUPS[0])
  const [styles, setStyles] = useState<string[]>(['conversational'])
  const [genre, setGenre] = useState('')
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
      const res = await fetch('/api/practitioner/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, ageGroup, style: styles, genre }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      router.push(`/practitioner/library`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen px-6 py-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <a href="/practitioner/library" className="text-sm text-blue-600 hover:underline">← My Lesson Library</a>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Generate a Lesson</h1>
        <p className="text-sm text-gray-500 mb-6">Lessons you generate here are private to your portal — families won&apos;t see them.</p>

        <div className="space-y-6">
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
              {AGE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
            <div className="flex flex-wrap gap-2">
              {GENRES.map(g => (
                <Chip
                  key={g.value}
                  label={g.label}
                  selected={genre === g.value}
                  onClick={() => setGenre(g.value)}
                  disabled={loading}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tone <span className="text-gray-400 font-normal text-xs">(pick one or more)</span></label>
            <div className="flex flex-wrap gap-2">
              {TONES.map(t => (
                <Chip
                  key={t.value}
                  label={t.label}
                  selected={styles.includes(t.value)}
                  onClick={() => setStyles(prev =>
                    prev.includes(t.value)
                      ? prev.length === 1 ? prev : prev.filter(s => s !== t.value)
                      : [...prev, t.value]
                  )}
                  disabled={loading}
                />
              ))}
            </div>
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
      </div>
    </main>
  )
}
