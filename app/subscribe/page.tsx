'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useUser, SignUpButton, SignInButton } from '@clerk/nextjs'
import { useState } from 'react'
import SubscribeButton from '@/app/SubscribeButton'

function SubscribeContent() {
  const { isSignedIn, isLoaded } = useUser()
  const searchParams = useSearchParams()
  const [referral, setReferral] = useState(searchParams.get('ref') ?? '')

  if (!isLoaded) return null

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 text-center">
        <img src="/word_up_clean.jpeg" alt="Word Up Logo" className="mx-auto mb-4" style={{ width: 160 }} />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Start Your Free Month</h1>
        <p className="text-gray-600 text-sm mb-1">
          Try Word Up free for 30 days — no charge until your trial ends.
        </p>
        <p className="text-gray-500 text-xs mb-6">Just $9.99/month after that. Cancel anytime.</p>

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

        {!isSignedIn && (
          <p className="text-xs text-gray-500 mt-3">
            Already have an account?{' '}
            <SignInButton forceRedirectUrl="/subscribe" mode="modal">
              <button className="text-blue-600 underline">Log in</button>
            </SignInButton>
          </p>
        )}

        {isSignedIn && (
          <p className="text-xs text-gray-400 mt-3">
            Already subscribed?{' '}
            <a href="/practitioner/dashboard" className="text-blue-600 underline">Go to dashboard →</a>
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
