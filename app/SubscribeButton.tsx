'use client'

import { useState } from 'react'

export default function SubscribeButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubscribe() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin: window.location.origin }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError('Could not start checkout. Please try again.')
        setLoading(false)
      }
    } catch {
      setError('Could not start checkout. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleSubscribe}
        disabled={loading}
        className="bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-yellow-300 transition-colors disabled:opacity-60"
      >
        {loading ? 'Loading…' : 'Subscribe $9.99/mo'}
      </button>
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  )
}
