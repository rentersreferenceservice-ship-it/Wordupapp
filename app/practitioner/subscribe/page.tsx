'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PractitionerSubscribePage() {
  const router = useRouter()
  const [loading, setLoading] = useState<'monthly' | 'annual' | null>(null)
  const [showCode, setShowCode] = useState(false)
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const [redeeming, setRedeeming] = useState(false)

  async function subscribe(billing: 'monthly' | 'annual', skipTrial = false) {
    setLoading(billing)
    const source = document.referrer
      ? new URL(document.referrer).pathname
      : 'direct'
    const res = await fetch('/api/practitioner/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ billing, origin: window.location.origin, source, skipTrial }),
    })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      setLoading(null)
    }
  }

  async function redeemCode(e: React.FormEvent) {
    e.preventDefault()
    setCodeError('')
    setRedeeming(true)
    const res = await fetch('/api/practitioner/subscribe/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    setRedeeming(false)
    if (res.ok) {
      router.push('/practitioner/dashboard')
    } else {
      setCodeError('Invalid access code. Please try again.')
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <img src="/word_up_clean.jpeg" alt="Word Up" style={{ width: 100 }} className="mb-6" />
      <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Welcome to the Practitioner Dashboard</h1>
      <p className="text-gray-500 mb-2 text-center max-w-md">
        Manage your students, run sessions, generate invoices, and track progress — all in one place.
      </p>
      <p className="text-blue-700 font-semibold mb-8 text-center">
        Start your 30-day free trial today. Your card will not be charged until after your trial ends.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <button
          onClick={() => subscribe('monthly')}
          disabled={loading !== null}
          className="flex-1 border-2 border-blue-600 rounded-xl p-6 text-center hover:bg-blue-50 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <div className="text-xl font-bold text-gray-900">Monthly</div>
          <div className="text-3xl font-bold text-blue-600 my-2">$29.99<span className="text-base font-normal text-gray-500">/mo</span></div>
          <div className="text-sm text-gray-500">Billed monthly after trial</div>
          {loading === 'monthly' && <div className="text-blue-600 text-sm mt-2">Redirecting...</div>}
        </button>

        <button
          onClick={() => subscribe('annual')}
          disabled={loading !== null}
          className="flex-1 border-2 border-green-600 rounded-xl p-6 text-center hover:bg-green-50 transition-colors disabled:opacity-50 cursor-pointer relative"
        >
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">SAVE 15%</div>
          <div className="text-xl font-bold text-gray-900">Annual</div>
          <div className="text-3xl font-bold text-green-600 my-2">$305.89<span className="text-base font-normal text-gray-500">/yr</span></div>
          <div className="text-sm text-gray-500">~$25.49/mo, billed yearly after trial</div>
          {loading === 'annual' && <div className="text-green-600 text-sm mt-2">Redirecting...</div>}
        </button>
      </div>

      <p className="text-xs text-gray-400 mt-6 text-center max-w-sm">
        Cancel anytime before your trial ends and you will not be charged. After the trial, your chosen plan renews automatically.
      </p>

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-400 mb-1">Want to skip the trial and subscribe now?</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => subscribe('monthly', true)}
            disabled={loading !== null}
            className="text-xs text-blue-600 hover:text-blue-800 underline underline-offset-2 disabled:opacity-50"
          >
            Monthly — pay now
          </button>
          <span className="text-xs text-gray-300">|</span>
          <button
            onClick={() => subscribe('annual', true)}
            disabled={loading !== null}
            className="text-xs text-green-600 hover:text-green-800 underline underline-offset-2 disabled:opacity-50"
          >
            Annual — pay now
          </button>
        </div>
      </div>

      <div className="mt-6">
        {!showCode ? (
          <button onClick={() => setShowCode(true)} className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2">
            Have an access code?
          </button>
        ) : (
          <form onSubmit={redeemCode} className="flex flex-col items-center gap-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter access code"
                value={code}
                onChange={e => setCode(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 w-48"
                autoFocus
              />
              <button
                type="submit"
                disabled={redeeming || !code.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {redeeming ? 'Checking...' : 'Redeem'}
              </button>
            </div>
            {codeError && <p className="text-xs text-red-500">{codeError}</p>}
          </form>
        )}
      </div>
    </main>
  )
}
