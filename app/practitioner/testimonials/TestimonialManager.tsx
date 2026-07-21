'use client'

import { useState } from 'react'

type Testimonial = {
  id: string
  name_display: string
  role_description: string | null
  testimonial_text: string
  photo_url: string | null
  approved: boolean
  submitted_at: string
}

export default function TestimonialManager({ testimonials: initial }: { testimonials: Testimonial[] }) {
  const [testimonials, setTestimonials] = useState(initial)
  const [working, setWorking] = useState<string | null>(null)

  const pending = testimonials.filter(t => !t.approved)
  const approved = testimonials.filter(t => t.approved)

  async function setApproved(id: string, approved: boolean) {
    setWorking(id)
    await fetch('/api/testimonials/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, approved }),
    })
    setTestimonials(prev => prev.map(t => t.id === id ? { ...t, approved } : t))
    setWorking(null)
  }

  async function remove(id: string) {
    if (!confirm('Delete this testimonial permanently?')) return
    setWorking(id)
    await fetch('/api/testimonials/approve', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setTestimonials(prev => prev.filter(t => t.id !== id))
    setWorking(null)
  }

  function Card({ t }: { t: Testimonial }) {
    return (
      <div className="rounded-2xl border p-5 bg-white"
        style={{ borderColor: t.approved ? '#d4edda' : '#fde8cc' }}>
        <div className="flex items-start gap-3 mb-3">
          {t.photo_url && (
            <img src={t.photo_url} alt={t.name_display}
              className="w-10 h-10 rounded-full object-cover shrink-0"
              style={{ border: '2px solid #e8ddd0' }} />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-900">{t.name_display}</p>
            {t.role_description && <p className="text-xs text-gray-500">{t.role_description}</p>}
            <p className="text-xs text-gray-400 mt-0.5">{new Date(t.submitted_at).toLocaleDateString()}</p>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${t.approved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
            {t.approved ? 'Live' : 'Pending'}
          </span>
        </div>

        <p className="text-sm text-gray-700 leading-relaxed mb-4 italic">&ldquo;{t.testimonial_text}&rdquo;</p>

        <div className="flex gap-2 flex-wrap">
          {!t.approved ? (
            <button
              onClick={() => setApproved(t.id, true)}
              disabled={working === t.id}
              className="text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
              style={{ background: '#C9A435', color: '#2a1f17' }}>
              {working === t.id ? 'Approving…' : '✓ Approve — publish to site'}
            </button>
          ) : (
            <button
              onClick={() => setApproved(t.id, false)}
              disabled={working === t.id}
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-gray-100 text-gray-700 disabled:opacity-50">
              {working === t.id ? 'Removing…' : 'Unpublish'}
            </button>
          )}
          <button
            onClick={() => remove(t.id)}
            disabled={working === t.id}
            className="text-xs px-4 py-2 rounded-lg bg-red-50 text-red-600 disabled:opacity-50">
            Delete
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-base font-bold text-gray-800 mb-4">
          Pending Review <span className="ml-1 text-amber-600">({pending.length})</span>
        </h2>
        {pending.length === 0
          ? <p className="text-sm text-gray-400">No pending submissions.</p>
          : <div className="space-y-4">{pending.map(t => <Card key={t.id} t={t} />)}</div>
        }
      </div>

      <div>
        <h2 className="text-base font-bold text-gray-800 mb-4">
          Published <span className="ml-1 text-green-600">({approved.length})</span>
        </h2>
        {approved.length === 0
          ? <p className="text-sm text-gray-400">No published testimonials yet.</p>
          : <div className="space-y-4">{approved.map(t => <Card key={t.id} t={t} />)}</div>
        }
      </div>
    </div>
  )
}
