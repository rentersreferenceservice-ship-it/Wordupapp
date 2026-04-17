'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, SignUpButton } from '@clerk/nextjs'
import type { Lesson } from '@/lib/types'

const AGE_GROUPS = [
  'Young Children (ages 6–8)',
  'Children (ages 9–11)',
  'Tweens (ages 12–14)',
  'Teens (ages 15–17)',
  'Adults (18+)',
]

const FREE_LESSON_KEY = 'wordupFreeLessons'

function getFreeLessonsUsed(): number {
  if (typeof window === 'undefined') return 0
  return parseInt(localStorage.getItem(FREE_LESSON_KEY) || '0', 10)
}

function incrementFreeLessons(): void {
  const current = getFreeLessonsUsed()
  localStorage.setItem(FREE_LESSON_KEY, String(current + 1))
}

export default function HomePage() {
  const router = useRouter()
  const { isSignedIn } = useUser()
  const [topic, setTopic] = useState('')
  const [ageGroup, setAgeGroup] = useState(AGE_GROUPS[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSignup, setShowSignup] = useState(false)
  const [showSubscribe, setShowSubscribe] = useState(false)
  const [showLimitReached, setShowLimitReached] = useState(false)

  async function handleGenerate() {
    if (!topic.trim()) {
      setError('Please enter a topic.')
      return
    }

    // Free visitor — check localStorage count
    if (!isSignedIn && getFreeLessonsUsed() >= 2) {
      setShowSignup(true)
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
        if (data.error === 'SUBSCRIBE_REQUIRED') {
          setShowSubscribe(true)
          return
        }
        if (data.error === 'LESSON_LIMIT_REACHED') {
          setShowLimitReached(true)
          return
        }
        throw new Error(data.error || 'Generation failed')
      }

      const lesson: Lesson = await res.json()

      // Track free lesson usage in localStorage for non-signed-in users
      if (!isSignedIn) {
        incrementFreeLessons()
      }

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

        <div className="mb-6 text-center">
          <p className="text-gray-700 text-sm leading-relaxed mb-3">
            Generate professional, I-ASC Gold Standard Spelling to Communicate (S2C) lessons in minutes. Built by Word Up, LLC — designed for S2C practitioners, CRPs, and families everywhere.
          </p>
          <p className="text-gray-700 text-sm leading-relaxed mb-3">
            Each lesson includes 8 scaffolded hunks, age-appropriate vocabulary, color-coded question types, and a print-ready PDF — all aligned to the I-ASC Gold Standard.
          </p>
          <div className="text-left bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 text-sm text-gray-700 space-y-1">
            <p><span className="font-semibold">1.</span> Enter a topic — frogs, the American Revolution, managing emotions</p>
            <p><span className="font-semibold">2.</span> Select an age group — lessons are fully tailored to your student</p>
            <p><span className="font-semibold">3.</span> Generate — your lesson is ready in about a minute</p>
            <p><span className="font-semibold">4.</span> Print — a clean, formatted PDF ready for your session</p>
          </div>
        </div>

        {!isSignedIn && !showSignup && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 text-center mb-5">
            <p className="text-sm font-semibold text-blue-800">Try 2 free lessons — no account needed</p>
            <p className="text-xs text-blue-600 mt-0.5">Subscribe for $9.99/mo for up to 20 lessons and prints per month.</p>
          </div>
        )}

        {showSignup && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-5 text-center mb-4">
            <p className="font-semibold text-gray-800 mb-1">You&apos;ve used your 2 free lessons!</p>
            <p className="text-sm text-gray-600 mb-3">Create a free account and subscribe to generate more lessons.</p>
            <SignUpButton>
              <button className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                Create Account
              </button>
            </SignUpButton>
          </div>
        )}

        {showSubscribe && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-5 text-center mb-4">
            <p className="font-semibold text-gray-800 mb-1">Subscription required</p>
            <p className="text-sm text-gray-600 mb-3">Subscribe for $9.99/month for up to 20 lessons and prints per month.</p>
            <SignUpButton>
              <button className="bg-yellow-400 text-gray-900 px-5 py-2 rounded-lg text-sm font-bold hover:bg-yellow-300 transition-colors">
                Create Account to Subscribe
              </button>
            </SignUpButton>
          </div>
        )}

        {showLimitReached && (
          <div className="bg-red-50 border border-red-300 rounded-xl p-5 text-center mb-4">
            <p className="font-semibold text-gray-800 mb-1">Monthly limit reached</p>
            <p className="text-sm text-gray-600">You&apos;ve reached your 20 lesson limit this month. Your limit resets next month.</p>
          </div>
        )}

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
            View lesson library
          </a>
        </div>
      </div>
    </main>
  )
}
