'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useUser, SignUpButton, SignInButton } from '@clerk/nextjs'
import { useState } from 'react'
import SubscribeButton from '@/app/SubscribeButton'

function trialEndDate() {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function SubscribeContent() {
  const { isSignedIn, isLoaded } = useUser()
  const searchParams = useSearchParams()
  const [referral, setReferral] = useState(searchParams.get('ref') ?? '')

  if (!isLoaded) return null

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 text-center">
        <img src="/word_up_clean.jpeg" alt="Word Up Logo" className="mx-auto mb-4" style={{ width: 160 }} />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Try Word Up Free for 30 Days</h1>

        {/* Key reassurance box */}
        <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 mb-5 text-left">
          <p className="text-green-800 font-semibold text-sm mb-2">✓ Your card will NOT be charged today</p>
          <ul className="text-green-700 text-xs space-y-1">
            <li>✓ Free access through <span className="font-semibold">{trialEndDate()}</span></li>
            <li>✓ Cancel anytime before then — you will never be billed</li>
            <li>✓ Only $9.99/month if you choose to continue after your trial</li>
          </ul>
        </div>

        <p className="text-gray-500 text-xs mb-1">Stripe (our payment processor) asks for your card now to set up the subscription — but nothing is charged until your 30-day trial ends.</p>
        <p className="text-gray-400 text-xs mb-5">You can cancel in one click before {trialEndDate()} and owe nothing.</p>

        <div className="text-left mb-5">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            How did you hear about us? <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            value={referral}
            onChange={e => setReferral(e.target.value)}
            placeholder="e.g. a practitioner's name, social media…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {isSignedIn ? (
          <SubscribeButton referral={referral} />
        ) : (
          <SignUpButton forceRedirectUrl="/subscribe" mode="modal">
            <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors">
              Create Account &amp; Start Free Trial
            </button>
          </SignUpButton>
        )}

        <p className="text-xs text-gray-400 mt-3">
          Questions? Email us at{' '}
          <a href="mailto:wordups2c@gmail.com" className="text-blue-600 underline">wordups2c@gmail.com</a>
        </p>

        {!isSignedIn && (
          <p className="text-xs text-gray-500 mt-2">
            Already have an account?{' '}
            <SignInButton forceRedirectUrl="/subscribe" mode="modal">
              <button className="text-blue-600 underline">Log in</button>
            </SignInButton>
          </p>
        )}

        {isSignedIn && (
          <p className="text-xs text-gray-400 mt-2">
            Already subscribed?{' '}
            <a href="/" className="text-blue-600 underline">Go to lesson generator →</a>
          </p>
        )}
      </div>
    </main>
  )
}

export default function SubscribePage() {
  return (
    <Suspense>
      <SubscribeContent />
    </Suspense>
  )
}
