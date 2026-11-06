'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/lib/supabaseClient'

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
        // Let the tablet's own screen show that a new device just connected.
        const supabase = getSupabaseBrowserClient()
        const channel = supabase.channel(`tt:${code.toUpperCase()}`, { config: { broadcast: { self: false } } })
        channel.subscribe(status => {
          if (status === 'SUBSCRIBED') {
            channel.send({ type: 'broadcast', event: 'device-connected', payload: {} })
            setTimeout(() => supabase.removeChannel(channel), 1000)
          }
        })
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
        A notice just appeared on their screen letting them know this device connected.
        This connection stays active here from now on — you won&apos;t need to scan again, even if you close this page or come back tomorrow.
      </p>
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-left text-sm text-blue-900 space-y-2">
        <p className="font-semibold">What you can do now:</p>
        <p><span className="font-semibold">Ask a Question</span> — type anything and it appears right away on their screen for them to answer.</p>
        <p><span className="font-semibold">Browse Lessons</span> — open any lesson and tap &quot;Send&quot; next to a question to send that exact question to their screen instead.</p>
      </div>
      <div className="space-y-3 pt-2">
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
