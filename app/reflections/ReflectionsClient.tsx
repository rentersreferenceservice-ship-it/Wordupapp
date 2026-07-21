'use client'

import { useState } from 'react'
import ReflectionForm from './ReflectionForm'

type Reflection = {
  id: string
  name_display: string
  role_description: string | null
  testimonial_text: string
  photo_url: string | null
}

export default function ReflectionsClient({ reflections }: { reflections: Reflection[] }) {
  const [showForm, setShowForm] = useState(false)

  return (
    <>
      {/* Intro */}
      <section className="py-20" style={{ background: '#fdf9f4' }}>
        <div className="max-w-2xl mx-auto px-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] mb-4 font-medium" style={{ color: '#a08060' }}>
            Reflections
          </p>
          <h1 className="font-bold mb-6" style={{ color: '#2a1f17', fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: '1.2' }}>
            In their own words.
          </h1>
          <p className="leading-relaxed mb-10" style={{ color: '#7a6a5a', fontSize: '1.05rem', lineHeight: '1.8' }}>
            Share your experience with Word Up and Spelling to Communicate. Whether you&apos;re a family,
            a practitioner, or someone who has witnessed this work firsthand — your reflection matters.
          </p>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="font-semibold px-8 py-4 rounded-full transition-all hover:opacity-90 shadow-md"
              style={{ background: '#C9A435', color: '#2a1f17' }}>
              Leave Your Reflection
            </button>
          )}
        </div>
      </section>

      {/* Form — revealed on button click */}
      {showForm && (
        <section style={{ background: '#fdf9f4', paddingBottom: '4rem' }}>
          <div style={{ height: '1px', background: '#e8ddd0', maxWidth: '42rem', margin: '0 auto' }} />
          <ReflectionForm onSubmitted={() => setShowForm(false)} />
        </section>
      )}

      {/* Approved reflections */}
      {reflections.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-5xl mx-auto px-8">
            <div className="grid md:grid-cols-2 gap-6">
              {reflections.map((r) => (
                <div key={r.id} className="rounded-3xl p-8 flex flex-col"
                  style={{ background: '#fdf9f4', boxShadow: '0 2px 20px rgba(90,60,30,0.06)' }}>
                  <span className="text-5xl leading-none mb-4 font-serif" style={{ color: '#C9A435' }}>&ldquo;</span>
                  <p className="leading-relaxed flex-1 mb-7" style={{ color: '#5a4a3a', fontSize: '1.02rem', lineHeight: '1.75' }}>
                    {r.testimonial_text}
                  </p>
                  <div className="flex items-center gap-3 pt-4" style={{ borderTop: '1px solid #e8ddd0' }}>
                    {r.photo_url && (
                      <img src={r.photo_url} alt={r.name_display}
                        className="w-11 h-11 rounded-full object-cover shrink-0"
                        style={{ border: '2px solid #e8ddd0' }} />
                    )}
                    <div>
                      <p className="font-semibold text-sm" style={{ color: '#2a1f17' }}>{r.name_display}</p>
                      {r.role_description && (
                        <p className="text-xs mt-0.5" style={{ color: '#a08060' }}>{r.role_description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
