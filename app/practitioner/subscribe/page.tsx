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
    const source = document.referrer ? new URL(document.referrer).pathname : 'direct'
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
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-14"
      style={{ background: '#fdf9f4' }}>

      {/* Masthead */}
      <a href="/" className="flex items-center gap-4 mb-10">
        <img src="/word_up_clean.jpeg" alt="Word Up" className="h-16 w-auto rounded-xl shadow" />
        <div>
          <p className="font-black leading-none tracking-[0.18em]"
            style={{ color: '#2a1f17', fontSize: '1.6rem' }}>WORD UP</p>
          <p className="font-semibold tracking-[0.3em] mt-1 uppercase text-xs"
            style={{ color: '#C9A435' }}>Spelling to Communicate</p>
        </div>
      </a>

      <div className="text-center mb-10 max-w-md">
        <p className="text-xs font-bold uppercase tracking-[0.3em] mb-3" style={{ color: '#C9A435' }}>Start Your Trial</p>
        <h1 className="text-3xl font-bold mb-3" style={{ color: '#2a1f17' }}>Welcome to the Practitioner Dashboard</h1>
        <p className="leading-relaxed" style={{ color: '#7a6a5a' }}>
          Choose your plan below. Your 30-day free trial begins today — no charge until it ends.
        </p>
      </div>

      {/* Plan cards */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mb-6">

        {/* Monthly */}
        <button
          onClick={() => subscribe('monthly')}
          disabled={loading !== null}
          className="flex-1 rounded-2xl p-6 text-center transition-all disabled:opacity-50 border-2"
          style={{ borderColor: '#c4b49a', background: 'white' }}>
          <p className="text-sm font-semibold mb-1" style={{ color: '#7a6a5a' }}>Monthly</p>
          <p className="text-3xl font-black mb-1" style={{ color: '#2a1f17' }}>
            $29.99<span className="text-base font-normal" style={{ color: '#a08060' }}>/mo</span>
          </p>
          <p className="text-xs mb-3" style={{ color: '#a08060' }}>Billed monthly after trial</p>
          {loading === 'monthly'
            ? <p className="text-sm font-semibold" style={{ color: '#C9A435' }}>Redirecting…</p>
            : <p className="text-sm font-bold py-2 rounded-full" style={{ background: '#f5efe6', color: '#2a1f17' }}>Select</p>
          }
        </button>

        {/* Annual — featured */}
        <button
          onClick={() => subscribe('annual')}
          disabled={loading !== null}
          className="flex-1 rounded-2xl p-6 text-center transition-all disabled:opacity-50 relative border-2"
          style={{ borderColor: '#C9A435', background: '#2a1f17' }}>
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold"
            style={{ background: '#C9A435', color: '#2a1f17' }}>SAVE 15%</div>
          <p className="text-sm font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Annual</p>
          <p className="text-3xl font-black mb-1 text-white">
            $305.89<span className="text-base font-normal" style={{ color: 'rgba(255,255,255,0.5)' }}>/yr</span>
          </p>
          <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>~$25.49/mo, billed yearly after trial</p>
          {loading === 'annual'
            ? <p className="text-sm font-semibold" style={{ color: '#C9A435' }}>Redirecting…</p>
            : <p className="text-sm font-bold py-2 rounded-full" style={{ background: '#C9A435', color: '#2a1f17' }}>Select</p>
          }
        </button>
      </div>

      <p className="text-xs text-center max-w-sm mb-6" style={{ color: '#a08060' }}>
        Cancel anytime before your trial ends and you will not be charged. After the trial, your chosen plan renews automatically.
      </p>

      {/* Skip trial */}
      <div className="text-center mb-8">
        <p className="text-xs mb-2" style={{ color: '#c4b49a' }}>Want to skip the trial and subscribe now?</p>
        <div className="flex gap-4 justify-center">
          <button onClick={() => subscribe('monthly', true)} disabled={loading !== null}
            className="text-xs underline underline-offset-2 disabled:opacity-50" style={{ color: '#a08060' }}>
            Monthly — pay now
          </button>
          <span style={{ color: '#d4c5a9' }}>|</span>
          <button onClick={() => subscribe('annual', true)} disabled={loading !== null}
            className="text-xs underline underline-offset-2 disabled:opacity-50" style={{ color: '#a08060' }}>
            Annual — pay now
          </button>
        </div>
      </div>

      {/* Access code */}
      {!showCode ? (
        <button onClick={() => setShowCode(true)}
          className="text-xs underline underline-offset-2" style={{ color: '#c4b49a' }}>
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
              autoFocus
              className="rounded-xl px-4 py-2.5 text-sm outline-none w-48"
              style={{ border: '1.5px solid #ddd3c4', background: 'white', color: '#2a1f17' }}
            />
            <button
              type="submit"
              disabled={redeeming || !code.trim()}
              className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
              style={{ background: '#2a1f17', color: '#f5efe6' }}>
              {redeeming ? 'Checking…' : 'Redeem'}
            </button>
          </div>
          {codeError && <p className="text-xs" style={{ color: '#c0392b' }}>{codeError}</p>}
        </form>
      )}
    </main>
  )
}
