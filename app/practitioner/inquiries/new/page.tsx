'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewInquiryPage() {
  const router = useRouter()
  const [channel, setChannel] = useState<'email' | 'text'>('email')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [quotedFee, setQuotedFee] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [link, setLink] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/practitioner/intake-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, recipientEmail, recipientPhone, quotedFee }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Could not create the intake.'); setLoading(false); return }
      if (channel === 'email') {
        router.push('/practitioner/inquiries')
      } else {
        setLink(data.link)
        setLoading(false)
      }
    } catch {
      setError('Something went wrong.')
      setLoading(false)
    }
  }

  if (link) {
    const message = `Hi — here's our intake form: ${link}`
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Ready to text</h1>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700 mb-4 text-left">{message}</div>
          <a href={`sms:?&body=${encodeURIComponent(message)}`} className="inline-block bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors mb-3">
            Open in Messages
          </a>
          <div>
            <button onClick={() => router.push('/practitioner/inquiries')} className="text-sm text-gray-500 hover:underline">
              Done
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-6">New Intake</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <button type="button" onClick={() => setChannel('email')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${channel === 'email' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}>
              Email
            </button>
            <button type="button" onClick={() => setChannel('text')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${channel === 'text' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}>
              Text message
            </button>
          </div>

          {channel === 'email' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Guardian or parent&apos;s email</label>
              <input type="email" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)}
                placeholder="guardian@email.com"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Guardian or parent&apos;s mobile number</label>
              <input type="tel" value={recipientPhone} onChange={e => setRecipientPhone(e.target.value)}
                placeholder="(603) 555-0148"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session fee you quoted <span className="text-gray-400 font-normal">(optional)</span></label>
            <input type="text" value={quotedFee} onChange={e => setQuotedFee(e.target.value)}
              placeholder="85"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => router.back()} className="flex-1 bg-gray-100 text-gray-700 border-2 border-blue-600 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors">
              {loading ? 'Sending…' : channel === 'email' ? 'Send' : 'Get Link'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
