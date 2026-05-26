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
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Practitioner Portal</h1>
      <p className="text-gray-500 mb-6 text-center max-w-sm">Tell us about yourself to get started.</p>

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
