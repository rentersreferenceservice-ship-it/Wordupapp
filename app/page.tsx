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

type VerifyStep = 'idle' | 'enterEmail' | 'enterCode' | 'verified'

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

  // Email verification state
  const [verifyStep, setVerifyStep] = useState<VerifyStep>('idle')
  const [emailInput, setEmailInput] = useState('')
  const [codeInput, setCodeInput] = useState('')
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('verifiedEmail') : null
  )
  const [verifyError, setVerifyError] = useState('')
  const [verifyLoading, setVerifyLoading] = useState(false)

  async function handleSendCode() {
    const email = emailInput.trim().toLowerCase()
    if (!email || !email.includes('@')) {
      setVerifyError('Please enter a valid email address.')
      return
    }
    setVerifyError('')
    setVerifyLoading(true)
    const res = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'request', email }),
    })
    setVerifyLoading(false)
    if (res.ok) {
      setVerifyStep('enterCode')
    } else {
      setVerifyError('Could not send email. Please try again.')
    }
  }

  async function handleConfirmCode() {
    const email = emailInput.trim().toLowerCase()
    const code = codeInput.trim()
    if (!code) {
      setVerifyError('Please enter the code from your email.')
      return
    }
    setVerifyError('')
    setVerifyLoading(true)
    const res = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'confirm', email, code }),
    })
    setVerifyLoading(false)
    if (res.ok) {
      localStorage.setItem('verifiedEmail', email)
      setVerifiedEmail(email)
      setVerifyStep('verified')
    } else {
      setVerifyError('Invalid or expired code. Please try again.')
    }
  }

  async function handleGenerate() {
    if (!topic.trim()) {
      setError('Please enter a topic.')
      return
    }

    // Visitors need a verified email first
    if (!isSignedIn && !verifiedEmail) {
      setVerifyStep('enterEmail')
      return
    }

    setError('')
    setLoading(true)
    try {
      const body: Record<string, string> = { topic, ageGroup }
      if (!isSignedIn && verifiedEmail) {
        body.verifiedEmail = verifiedEmail
      }

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        if (data.error === 'EMAIL_REQUIRED') {
          setVerifyStep('enterEmail')
          return
        }
        if (data.error === 'FREE_USED' || data.error === 'SIGNUP_REQUIRED') {
          setShowSignup(true)
          return
        }
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
      router.push(`/lessons/${lesson.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  // After verifying email, trigger generate automatically
  async function handleVerifiedAndGenerate() {
    setVerifyStep('idle')
    // Small delay to let state settle
    setTimeout(() => handleGenerate(), 100)
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

        {!isSignedIn && !showSignup && !verifiedEmail && verifyStep === 'idle' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 text-center mb-5">
            <p className="text-sm font-semibold text-blue-800">Try 2 free lessons — no account needed</p>
            <p className="text-xs text-blue-600 mt-0.5">Just verify your email to get started. Subscribe for $9.99/mo for up to 20 lessons and prints per month.</p>
          </div>
        )}

        {/* Email verification modal */}
        {verifyStep === 'enterEmail' && (
          <div className="bg-white border border-blue-200 rounded-xl p-5 mb-5 shadow-sm">
            <p className="font-semibold text-gray-800 mb-1">Verify your email</p>
            <p className="text-sm text-gray-500 mb-3">Enter your email and we&apos;ll send you a code to unlock 2 free lessons.</p>
            <input
              type="email"
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              placeholder="you@example.com"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={e => e.key === 'Enter' && handleSendCode()}
            />
            {verifyError && <p className="text-red-600 text-xs mb-2">{verifyError}</p>}
            <button
              onClick={handleSendCode}
              disabled={verifyLoading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {verifyLoading ? 'Sending…' : 'Send Code'}
            </button>
          </div>
        )}

        {verifyStep === 'enterCode' && (
          <div className="bg-white border border-blue-200 rounded-xl p-5 mb-5 shadow-sm">
            <p className="font-semibold text-gray-800 mb-1">Check your email</p>
            <p className="text-sm text-gray-500 mb-3">We sent a 6-digit code to <strong>{emailInput}</strong>.</p>
            <input
              type="text"
              value={codeInput}
              onChange={e => setCodeInput(e.target.value)}
              placeholder="123456"
              maxLength={6}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-widest text-center text-lg"
              onKeyDown={e => e.key === 'Enter' && handleConfirmCode()}
            />
            {verifyError && <p className="text-red-600 text-xs mb-2">{verifyError}</p>}
            <button
              onClick={handleConfirmCode}
              disabled={verifyLoading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {verifyLoading ? 'Verifying…' : 'Verify Code'}
            </button>
            <button onClick={() => setVerifyStep('enterEmail')} className="w-full text-xs text-gray-400 mt-2 hover:text-gray-600">
              Use a different email
            </button>
          </div>
        )}

        {verifyStep === 'verified' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5 text-center">
            <p className="font-semibold text-green-800 mb-1">Email verified!</p>
            <p className="text-sm text-green-700 mb-3">You have 2 free lessons. Enjoy!</p>
            <button
              onClick={handleVerifiedAndGenerate}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Generate My First Lesson
            </button>
          </div>
        )}

        {showSignup && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-5 text-center mb-4">
            <p className="font-semibold text-gray-800 mb-1">You&apos;ve used your 2 free lessons!</p>
            <p className="text-sm text-gray-600 mb-3">Create a free account and subscribe to generate unlimited lessons.</p>
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
            <p className="text-sm text-gray-600 mb-3">Create a free account and subscribe for $9.99/month for up to 20 lessons and prints per month.</p>
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

        {verifyStep === 'idle' && (
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
        )}

        <div className="text-center mt-6">
          <a href="/lessons" className="text-sm text-blue-600 hover:underline">
            View lesson library
          </a>
        </div>
      </div>
    </main>
  )
}
