'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, SignUpButton } from '@clerk/nextjs'
import SubscribeButton from './SubscribeButton'
import ManageSubscriptionButton from './ManageSubscriptionButton'
import type { Lesson } from '@/lib/types'

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

export default function HomePage() {
  const router = useRouter()
  const { isSignedIn } = useUser()

  const [topic, setTopic] = useState('')
  const [ageGroup, setAgeGroup] = useState(AGE_GROUPS[0])
  const [styles, setStyles] = useState<string[]>(['conversational'])
  const [genre, setGenre] = useState('')
  const [email, setEmail] = useState('')
  const [referral, setReferral] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSubscribe, setShowSubscribe] = useState(false)
  const [showLimitReached, setShowLimitReached] = useState(false)

  useEffect(() => {
    const saved = sessionStorage.getItem('wordupEmail')
    if (saved) setEmail(saved)
  }, [])

  function toggleStyle(value: string) {
    setStyles(prev =>
      prev.includes(value)
        ? prev.length === 1 ? prev : prev.filter(s => s !== value)
        : [...prev, value]
    )
  }

  async function handleGenerate() {
    if (!topic.trim()) {
      setError('Please enter a topic.')
      return
    }
    if (!isSignedIn) {
      if (!email.trim()) {
        setError('Please enter your email address to generate a free lesson.')
        return
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setError('Please enter a valid email address.')
        return
      }
    }

    setError('')
    setLoading(true)
    try {
      const body: Record<string, unknown> = { topic, ageGroup, style: styles, genre }
      if (!isSignedIn) body.email = email.trim().toLowerCase()

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
      if (!isSignedIn) sessionStorage.setItem('wordupEmail', email.trim().toLowerCase())
      router.push(`/lessons/${lesson.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      {isSignedIn && (
        <div className="w-full max-w-lg mb-3 bg-blue-600 text-white text-sm rounded-xl px-4 py-2.5 flex items-center justify-between">
          <ManageSubscriptionButton className="text-white/80 hover:text-white text-xs underline underline-offset-2" />
          <a href="/practitioner/dashboard" className="font-semibold underline hover:no-underline">Go to Dashboard →</a>
        </div>
      )}
      <div className="w-full max-w-lg bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8">
        <div className="text-center mb-6">
          <img src="/word_up_clean.jpeg" alt="Word Up Logo" className="mx-auto mb-1" style={{ width: 220 }} />
          <p className="text-gray-500 text-sm">S2C Lesson Generator</p>
          <p className="text-gray-500 text-sm mt-0.5 font-medium">worduplessongenerator.com</p>
          <p className="text-gray-500 text-sm font-medium">wordups2c@gmail.com</p>
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

        {!isSignedIn && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 text-center mb-3">
            <p className="text-sm font-semibold text-blue-800">2 free lessons — no account needed</p>
            <p className="text-xs text-blue-600 mt-0.5">Try 1 month free — no risk. Your card won&apos;t be charged until after your 30-day trial. Just $9.99/month after that, cancel anytime.</p>
          </div>
        )}
        <div className="text-center mb-5">
          <a
            href="/lessons"
            className="inline-block bg-yellow-200 text-gray-800 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-yellow-300 transition-colors shadow-sm"
          >
            📚 View Lesson Library
          </a>
        </div>

        {showSubscribe && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-5 mb-4">
            <p className="font-semibold text-gray-800 mb-1 text-center">Try 1 month free</p>
            <p className="text-sm text-gray-600 mb-4 text-center">Try 1 month free — no risk. Your card won&apos;t be charged until after your 30-day trial. Just $9.99/month after that, cancel anytime.</p>
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">How did you hear about us? <span className="text-gray-400">(optional)</span></label>
              <input
                type="text"
                value={referral}
                onChange={e => setReferral(e.target.value)}
                placeholder="e.g. a practitioner's name, community room, social media…"
                className="w-full border border-yellow-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
              />
            </div>
            <div className="text-center">
              {isSignedIn ? (
                <SubscribeButton referral={referral} />
              ) : (
                <SignUpButton>
                  <button className="bg-yellow-200 text-gray-800 px-5 py-2 rounded-lg text-sm font-bold hover:bg-yellow-300 transition-colors">
                    Create Account to Subscribe
                  </button>
                </SignUpButton>
              )}
            </div>
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
                  onClick={() => toggleStyle(t.value)}
                  disabled={loading}
                />
              ))}
            </div>
          </div>

          {!isSignedIn && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Your Email <span className="text-gray-400 font-normal">(required for free access)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
          )}

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
          <a href="/submit" className="text-sm text-blue-600 hover:underline">Submit a lesson</a>
        </div>
      </div>
    </main>
  )
}
