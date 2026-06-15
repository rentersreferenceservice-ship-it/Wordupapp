'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function WelcomePage() {
  const router = useRouter()
  const [dots, setDots] = useState('.')

  useEffect(() => {
    const interval = setInterval(() => setDots(d => d.length >= 3 ? '.' : d + '.'), 500)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Poll until subscription is active, then send to dashboard
    let attempts = 0
    const check = async () => {
      attempts++
      try {
        const res = await fetch('/api/practitioner/subscription-status')
        const { active } = await res.json()
        if (active) {
          router.replace('/practitioner/dashboard')
          return
        }
      } catch { /* keep polling */ }
      if (attempts < 20) {
        setTimeout(check, 1500)
      } else {
        // Fallback after 30 seconds — go to dashboard and let it sort itself out
        router.replace('/practitioner/dashboard')
      }
    }
    setTimeout(check, 1500)
  }, [router])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <img src="/word_up_clean.jpeg" alt="Word Up" style={{ width: 120 }} className="mb-8" />
      <div className="text-4xl mb-4">🎉</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-3">Welcome to Word Up!</h1>
      <p className="text-gray-500 mb-2 max-w-sm">Your trial is active. Setting up your dashboard{dots}</p>
      <p className="text-xs text-gray-400 mt-6">This only takes a moment.</p>
    </main>
  )
}
