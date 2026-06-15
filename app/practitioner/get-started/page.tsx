'use client'

import { useState, useEffect } from 'react'
import { SignUpButton, SignInButton, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function PractitionerAccessPage() {
  const { isSignedIn } = useUser()
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', organization: '', role: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isSignedIn) router.replace('/practitioner/dashboard')
  }, [isSignedIn, router])

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
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
      <img src="/word_up_clean.jpeg" alt="Word Up" style={{ width: 120 }} className="mb-6" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Practitioner Dashboard</h1>
      <p className="text-gray-500 mb-5 text-center max-w-sm text-sm">
        Manage your caseload, run S2C sessions, generate invoices, and track student progress.
      </p>

      <div className="w-full max-w-sm mb-6" style={{ position: 'relative', overflow: 'hidden', aspectRatio: '1920/1080' }}>
        <iframe
          src="https://share.synthesia.io/embeds/videos/72ceac1f-a07e-46c8-b2ed-ae3dae6fee7e"
          loading="lazy"
          title="Synthesia video player - Manage S2C Sessions with Word Up Practitioner Dashboard"
          allowFullScreen
          allow="encrypted-media; fullscreen; microphone; screen-wake-lock;"
          style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, border: 'none', padding: 0, margin: 0, overflow: 'hidden' }}
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3 text-center mb-6 max-w-sm w-full">
        <p className="text-sm font-bold text-blue-900">30-day free trial</p>
        <p className="text-xs text-blue-700 mt-0.5">$29.99/month or $305.89/year after. No charge until your trial ends. Cancel anytime.</p>
      </div>

      {/* Primary CTA — Clerk signup directly */}
      <SignUpButton mode="modal" forceRedirectUrl="/practitioner/dashboard">
        <button className="w-full max-w-sm bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors mb-3 text-base">
          Start Free Trial
        </button>
      </SignUpButton>

      <SignInButton mode="modal" forceRedirectUrl="/practitioner/dashboard">
        <button className="w-full max-w-sm bg-gray-100 text-gray-800 border border-gray-200 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors mb-6 text-sm">
          Already have an account? Sign in
        </button>
      </SignInButton>

      {/* Optional lead form — collapsed by default */}
      {!showForm && !submitted && (
        <button
          onClick={() => setShowForm(true)}
          className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2"
        >
          Questions first? Send us a note
        </button>
      )}

      {showForm && !submitted && (
        <div className="w-full max-w-sm">
          <p className="text-sm text-gray-500 mb-4 text-center">Tell us about yourself and we&apos;ll be in touch.</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              required
              placeholder="Full name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              required
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              placeholder="Organization (optional)"
              value={form.organization}
              onChange={e => setForm({ ...form, organization: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              placeholder="Role / Title (optional)"
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      )}

      {submitted && (
        <p className="text-sm text-green-600 font-medium text-center">Thanks! We&apos;ll be in touch soon.</p>
      )}
    </main>
  )
}
