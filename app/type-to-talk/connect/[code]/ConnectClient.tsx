'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'tt-tablet-code'

export default function ConnectClient({ code }: { code: string }) {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking')

  useEffect(() => {
    let cancelled = false
    fetch(`/api/type-to-talk/pairing/${code}`)
      .then(res => res.json())
      .then(data => {
        if (cancelled) return
        if (data.error) { setStatus('error'); return }
        try { localStorage.setItem(STORAGE_KEY, code.toUpperCase()) } catch { /* ignore */ }
        setStatus('connected')
      })
      .catch(() => { if (!cancelled) setStatus('error') })
    return () => { cancelled = true }
  }, [code])

  if (status === 'checking') {
    return <div className="max-w-md mx-auto px-4 py-16 text-center text-gray-400">Connecting…</div>
  }

  if (status === 'error') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-red-600 font-medium">This code wasn&apos;t found. Ask the student to show you their QR code again.</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center space-y-6">
      <p className="text-2xl">✓</p>
      <p className="text-lg font-semibold text-gray-900">Connected on this device</p>
      <p className="text-sm text-gray-500">
        This connection will stay active here until you disconnect — you won&apos;t need to scan again.
      </p>
      <div className="space-y-3 pt-4">
        <Link href="/type-to-talk/ask" className="block bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors">
          Ask a Question
        </Link>
        <Link href="/lessons" className="block bg-white text-purple-700 border-2 border-purple-600 py-3 rounded-xl font-semibold hover:bg-purple-50 transition-colors">
          Browse Lessons
        </Link>
      </div>
    </div>
  )
}
