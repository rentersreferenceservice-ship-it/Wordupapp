'use client'

import { useState } from 'react'

export default function ManageSubscriptionButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleClick() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/billing-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin: window.location.origin }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Could not open billing portal.')
        setLoading(false)
      }
    } catch {
      setError('Something went wrong.')
      setLoading(false)
    }
  }

  return (
    <span>
      <button
        onClick={handleClick}
        disabled={loading}
        className={className ?? 'text-sm text-blue-600 hover:underline disabled:opacity-50'}
      >
        {loading ? 'Loading…' : 'Manage Subscription'}
      </button>
      {error && <span className="text-red-500 text-xs ml-2">{error}</span>}
    </span>
  )
}
