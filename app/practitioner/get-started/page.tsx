'use client'

import { useState, useEffect } from 'react'
import { SignUpButton, SignInButton, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function PractitionerAccessPage() {
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', organization: '', role: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isSignedIn) router.replace('/practitioner/dashboard')
  }, [isSignedIn, router])

  if (!isLoaded || isSignedIn) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#fdf9f4' }}>
      <p className="text-sm" style={{ color: '#a08060' }}>Loading…</p>
    </div>
  )

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/practitioner/request-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setLoading(false)
    setSubmitted(true)
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
            style={{ color: '#C9A435' }}>Letterboard Communication</p>
        </div>
      </a>

      {/* Heading */}
      <div className="text-center mb-8 max-w-md">
        <p className="text-xs font-bold uppercase tracking-[0.3em] mb-3" style={{ color: '#C9A435' }}>Practitioner Dashboard</p>
        <h1 className="text-3xl font-bold mb-3" style={{ color: '#2a1f17' }}>Your full practice. One place.</h1>
        <p className="leading-relaxed" style={{ color: '#7a6a5a' }}>
          Manage your caseload, run sessions, track accuracy, generate transcripts and invoices — so you can spend more time with the student in front of you.
        </p>
      </div>

      {/* Synthesia video — hidden pending re-record */}

      {/* Trial callout */}
      <div className="rounded-2xl px-6 py-4 text-center mb-6 max-w-sm w-full"
        style={{ background: '#2a1f17' }}>
        <p className="font-bold text-white mb-1">30-day free trial</p>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
          $29.99/month or $305.89/year after. No charge until your trial ends. Cancel anytime.
        </p>
      </div>

      {/* Primary CTA */}
      <SignUpButton mode="modal" forceRedirectUrl="/practitioner/dashboard">
        <button className="w-full max-w-sm py-4 rounded-full font-bold text-base transition-all hover:opacity-90 shadow-lg mb-3"
          style={{ background: '#C9A435', color: '#2a1f17' }}>
          Start Free Trial
        </button>
      </SignUpButton>

      <SignInButton mode="modal" forceRedirectUrl="/practitioner/dashboard">
        <button className="w-full max-w-sm py-3.5 rounded-full font-semibold text-sm transition-all border-2 mb-8"
          style={{ borderColor: '#c4b49a', color: '#5a4a3a', background: 'white' }}>
          Already have an account? Sign in
        </button>
      </SignInButton>

      {/* Questions first — lead form */}
      {!showForm && !submitted && (
        <button
          onClick={() => setShowForm(true)}
          className="text-xs underline underline-offset-2 transition-colors"
          style={{ color: '#a08060' }}>
          Questions first? Send us a note
        </button>
      )}

      {showForm && !submitted && (
        <div className="w-full max-w-sm mt-4">
          <p className="text-sm text-center mb-4" style={{ color: '#7a6a5a' }}>Tell us about yourself and we&apos;ll be in touch.</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            {[
              { placeholder: 'Full name', key: 'name', type: 'text', required: true },
              { placeholder: 'Email address', key: 'email', type: 'email', required: true },
              { placeholder: 'Organization (optional)', key: 'organization', type: 'text', required: false },
              { placeholder: 'Role / Title (optional)', key: 'role', type: 'text', required: false },
            ].map(f => (
              <input
                key={f.key}
                required={f.required}
                type={f.type}
                placeholder={f.placeholder}
                value={form[f.key as keyof typeof form]}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{ border: '1.5px solid #ddd3c4', background: 'white', color: '#2a1f17' }}
              />
            ))}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full font-bold transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: '#2a1f17', color: '#f5efe6' }}>
              {loading ? 'Sending…' : 'Send Message'}
            </button>
          </form>
        </div>
      )}

      {submitted && (
        <p className="text-sm font-medium mt-4" style={{ color: '#C9A435' }}>
          Thanks — we&apos;ll be in touch soon.
        </p>
      )}
    </main>
  )
}
