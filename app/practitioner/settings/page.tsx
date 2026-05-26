'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function PractitionerSettingsPage() {
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [businessName, setBusinessName] = useState('')
  const [businessAddress, setBusinessAddress] = useState('')
  const [businessPhone, setBusinessPhone] = useState('')
  const [businessEmail, setBusinessEmail] = useState('')
  const [sessionRate, setSessionRate] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('Due upon receipt')
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState('101')
  const [logoUrl, setLogoUrl] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')

  useEffect(() => {
    fetch('/api/practitioner/settings')
      .then(r => r.json())
      .then(data => {
        if (data.settings) {
          const s = data.settings
          setBusinessName(s.businessName ?? '')
          setBusinessAddress(s.businessAddress ?? '')
          setBusinessPhone(s.businessPhone ?? '')
          setBusinessEmail(s.businessEmail ?? '')
          setSessionRate(s.sessionRate ? String(s.sessionRate) : '')
          setPaymentTerms(s.paymentTerms ?? 'Due upon receipt')
          setNextInvoiceNumber(String(s.nextInvoiceNumber ?? 101))
          setLogoUrl(s.logoUrl ?? '')
          setWebsiteUrl(s.websiteUrl ?? '')
        }
        setLoaded(true)
      })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError('')
    const res = await fetch('/api/practitioner/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessName, businessAddress, businessPhone, businessEmail, sessionRate, paymentTerms, nextInvoiceNumber, logoUrl, websiteUrl }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error ?? 'Failed to save'); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (!loaded) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Loading…</p></div>

  return (
    <main className="min-h-screen px-6 py-8 max-w-2xl mx-auto">
      <Link href="/practitioner/dashboard" className="text-sm text-blue-600 hover:underline mb-4 block">← Dashboard</Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Practice Settings</h1>
      <p className="text-sm text-gray-500 mb-6">This information appears on every invoice you generate.</p>

      <form onSubmit={handleSave} className="space-y-6">

        {/* Branding */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Branding</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL <span className="text-gray-400 font-normal">(paste a link to your logo image)</span></label>
            <input type="url" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://yoursite.com/logo.png"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {logoUrl && <img src={logoUrl} alt="Logo preview" className="mt-2 h-12 object-contain rounded border border-gray-100" />}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
            <input type="url" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://yourpractice.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {/* Business Info */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Business Information</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business / Practice Name</label>
            <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} required placeholder="Word Up, LLC"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea value={businessAddress} onChange={e => setBusinessAddress(e.target.value)} rows={2} placeholder="123 Main St&#10;City, State 00000"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" value={businessPhone} onChange={e => setBusinessPhone(e.target.value)} placeholder="(555) 000-0000"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={businessEmail} onChange={e => setBusinessEmail(e.target.value)} placeholder="you@practice.com"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        {/* Billing */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Billing Defaults</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Session Rate ($)</label>
              <input type="number" min="0" step="0.01" value={sessionRate} onChange={e => setSessionRate(e.target.value)} placeholder="150.00"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Starting Invoice Number</label>
              <input type="number" min="1" value={nextInvoiceNumber} onChange={e => setNextInvoiceNumber(e.target.value)} required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
            <input type="text" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} placeholder="Due upon receipt"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={saving}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-60 transition-colors">
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Settings'}
        </button>
      </form>
    </main>
  )
}
