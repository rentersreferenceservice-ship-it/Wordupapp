'use client'

import { useState } from 'react'
import { SignUpButton, SignInButton } from '@clerk/nextjs'

export default function PractitionerAccessPage() {
  const [form, setForm] = useState({ name: '', email: '', organization: '', role: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

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

  if (submitted) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6">
        <img src="/word_up_clean.jpeg" alt="Word Up" style={{ width: 120 }} className="mb-8" />
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Welcome</h1>
        <p className="text-gray-500 mb-8 text-center max-w-sm">Please create your account to access the practitioner portal.</p>
        <SignUpButton mode="modal" forceRedirectUrl="/practitioner/dashboard">
          <button className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
            Create Account
          </button>
        </SignUpButton>
        <p className="text-sm text-gray-400 mt-4">Already have an account?{' '}
          <SignInButton mode="modal" forceRedirectUrl="/practitioner/dashboard">
            <button className="text-blue-600 underline">Sign in</button>
          </SignInButton>
        </p>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <img src="/word_up_clean.jpeg" alt="Word Up" style={{ width: 120 }} className="mb-8" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Practitioner Dashboard</h1>
      <p className="text-gray-500 mb-3 text-center max-w-sm">Manage your caseload, run sessions, generate invoices, and track student progress.</p>
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
        <p className="text-xs text-blue-700 mt-0.5">$29.99/month or $305.89/year after your trial ends. Your card will not be charged until the trial period is complete. Cancel anytime.</p>
      </div>
      <p className="text-gray-500 mb-4 text-center max-w-sm text-sm">Tell us about yourself to get started.</p>

      <SignInButton>
        <button className="w-full max-w-sm bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors mb-6">
          Already have an account? Sign in
        </button>
      </SignInButton>

      <p className="text-sm text-gray-400 mb-4">— or fill out the form below to request access —</p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
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
          required
          placeholder="Organization"
          value={form.organization}
          onChange={e => setForm({ ...form, organization: e.target.value })}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          required
          placeholder="Role / Title"
          value={form.role}
          onChange={e => setForm({ ...form, role: e.target.value })}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Get Access'}
        </button>
      </form>
    </main>
  )
}
