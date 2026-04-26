'use client'

import { useState } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'

const TIERS = [
  {
    id: 'starter',
    name: 'Starter',
    students: 10,
    monthly: 29.99,
    annual: 305.89,
    color: 'blue',
  },
  {
    id: 'growing',
    name: 'Growing',
    students: 25,
    monthly: 69.99,
    annual: 713.89,
    color: 'green',
    popular: true,
  },
  {
    id: 'established',
    name: 'Established',
    students: 50,
    monthly: 129.99,
    annual: 1325.89,
    color: 'purple',
  },
  {
    id: 'agency',
    name: 'Agency',
    students: 100,
    monthly: 249.99,
    annual: 2549.89,
    color: 'orange',
  },
]

export default function PractitionerPricingPage() {
  const { isSignedIn } = useUser()
  const { openSignUp } = useClerk()
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function handleSubscribe(tierId: string) {
    if (!isSignedIn) {
      openSignUp()
      return
    }
    setLoading(tierId)
    setError('')
    try {
      const res = await fetch('/api/practitioner/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: tierId, billing, origin: window.location.origin }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Something went wrong')
        setLoading(null)
      }
    } catch {
      setError('Could not start checkout. Please try again.')
      setLoading(null)
    }
  }

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <img src="/word_up_clean.jpeg" alt="Word Up Logo" className="mx-auto mb-4" style={{ width: 160 }} />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Practitioner Portal</h1>
          <p className="text-gray-600 text-lg">Session tracking, student records, and transcripts for S2C practitioners and CRPs.</p>

          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${billing === 'monthly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${billing === 'annual' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Annual <span className="text-green-600 font-semibold">Save 15%</span>
            </button>
          </div>
        </div>

        {error && <p className="text-red-600 text-center mb-6">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TIERS.map(tier => {
            const price = billing === 'monthly' ? tier.monthly : tier.annual
            const perMonth = billing === 'annual' ? (tier.annual / 12).toFixed(2) : tier.monthly.toFixed(2)
            return (
              <div
                key={tier.id}
                className={`relative bg-white rounded-2xl shadow-lg p-6 border-2 ${tier.popular ? 'border-green-500' : 'border-gray-100'}`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <h2 className="text-xl font-bold text-gray-900 mb-1">{tier.name}</h2>
                <p className="text-sm text-gray-500 mb-4">Up to {tier.students} students</p>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">${perMonth}</span>
                  <span className="text-gray-500 text-sm">/mo</span>
                  {billing === 'annual' && (
                    <p className="text-xs text-gray-400 mt-1">${price.toFixed(2)} billed annually</p>
                  )}
                </div>
                <ul className="text-sm text-gray-600 space-y-2 mb-6">
                  <li>✓ Up to {tier.students} students</li>
                  <li>✓ Session tracking & transcripts</li>
                  <li>✓ Printable student records</li>
                  <li>✓ YouTube break QR codes</li>
                  <li>✓ Full lesson library access</li>
                </ul>
                <button
                  onClick={() => handleSubscribe(tier.id)}
                  disabled={loading === tier.id}
                  className={`w-full py-2.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-60 ${tier.popular ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                  {loading === tier.id ? 'Loading…' : 'Get Started'}
                </button>
              </div>
            )
          })}
        </div>

        <div className="mt-8 py-4 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-600">
            Already subscribed? <a href="/practitioner/dashboard" className="text-blue-600 font-medium hover:underline">Go to your dashboard →</a>
          </p>
        </div>
      </div>
    </main>
  )
}
