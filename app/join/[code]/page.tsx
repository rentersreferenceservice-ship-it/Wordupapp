'use client'

import { use, useEffect, useState } from 'react'
import { useUser, SignUpButton, SignInButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const upperCode = code.toUpperCase()
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'redeeming' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!isLoaded || !isSignedIn || status !== 'idle') return
    setStatus('redeeming')
    fetch('/api/redeem-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: upperCode }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.ok) {
          setStatus('success')
          setTimeout(() => router.push('/'), 2500)
        } else {
          setStatus('error')
          setErrorMsg(data.error ?? 'Something went wrong.')
        }
      })
      .catch(() => { setStatus('error'); setErrorMsg('Something went wrong.') })
  }, [isLoaded, isSignedIn, status, upperCode, router])

  if (!isLoaded) return null

  if (isSignedIn) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <img src="/word_up_clean.jpeg" alt="Word Up" className="mx-auto mb-5" style={{ width: 140 }} />
          {status === 'redeeming' && <p className="text-gray-500">Activating your access…</p>}
          {status === 'success' && (
            <>
              <p className="text-2xl font-bold text-green-600 mb-2">You&apos;re all set!</p>
              <p className="text-gray-600">Your access has been activated. Taking you to the generator…</p>
            </>
          )}
          {status === 'error' && (
            <>
              <p className="text-red-600 font-semibold text-lg mb-2">Code issue</p>
              <p className="text-gray-500 text-sm mb-4">{errorMsg}</p>
              <p className="text-xs text-gray-400">Please check the code with your practitioner and try again.</p>
            </>
          )}
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <img src="/word_up_clean.jpeg" alt="Word Up" className="mx-auto mb-5" style={{ width: 140 }} />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">You&apos;ve been invited!</h1>
        <p className="text-gray-600 mb-2 text-sm leading-relaxed">
          Your practitioner has given you access to the Word Up Letterboard Lesson Generator.
          Create a free account to get started.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 mb-6 inline-block">
          <p className="text-xs text-blue-500 font-medium">Access code</p>
          <p className="font-mono font-bold text-blue-800 text-lg tracking-widest">{upperCode}</p>
        </div>
        <div className="space-y-3">
          <SignUpButton forceRedirectUrl={`/join/${upperCode}`}>
            <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
              Create Account
            </button>
          </SignUpButton>
          <SignInButton forceRedirectUrl={`/join/${upperCode}`}>
            <button className="w-full bg-gray-100 text-gray-700 border-2 border-blue-600 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors text-sm">
              Already have an account? Sign In
            </button>
          </SignInButton>
        </div>
      </div>
    </main>
  )
}
