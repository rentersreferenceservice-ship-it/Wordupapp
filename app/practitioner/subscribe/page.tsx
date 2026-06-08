'use client'

import { useState } from 'react'

export default function PractitionerSubscribePage() {
  const [loading, setLoading] = useState<'monthly' | 'annual' | null>(null)

  async function subscribe(billing: 'monthly' | 'annual') {
    setLoading(billing)
    const res = await fetch('/api/practitioner/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ billing, origin: window.location.origin }),
    })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      setLoading(null)
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
    </main>
  )
}
