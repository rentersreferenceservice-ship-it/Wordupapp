'use client'

import { useState, useRef } from 'react'

export default function ReflectionForm() {
  const [nameType, setNameType] = useState<'initials' | 'full'>('initials')
  const [nameDisplay, setNameDisplay] = useState('')
  const [roleDescription, setRoleDescription] = useState('')
  const [testimonialText, setTestimonialText] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = () => setPhotoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nameDisplay.trim() || !testimonialText.trim()) return
    setSubmitting(true)
    setError('')
    const formData = new FormData()
    formData.set('nameDisplay', nameDisplay.trim())
    formData.set('roleDescription', roleDescription.trim())
    formData.set('testimonialText', testimonialText.trim())
    if (photoFile) formData.set('photo', photoFile)

    const res = await fetch('/api/testimonials/submit', { method: 'POST', body: formData })
    setSubmitting(false)
    if (res.ok) setSubmitted(true)
    else setError('Something went wrong — please try again.')
  }

  if (submitted) {
    return (
      <div className="text-center py-16 max-w-md mx-auto">
        <p className="text-3xl mb-4">✦</p>
        <h2 className="text-xl font-bold mb-3" style={{ color: '#2a1f17' }}>Thank you.</h2>
        <p className="leading-relaxed" style={{ color: '#7a6a5a' }}>
          Your reflection has been received. We review every submission personally before it appears here.
        </p>
      </div>
    )
  }

  return (
    <section className="py-20 bg-white">
      <div className="max-w-lg mx-auto px-8">
        <p className="text-xs uppercase tracking-[0.3em] mb-3 font-medium" style={{ color: '#a08060' }}>Share Yours</p>
        <h2 className="font-bold mb-3" style={{ color: '#2a1f17', fontSize: 'clamp(1.5rem, 3vw, 2rem)', lineHeight: '1.3' }}>
          What has this work meant to you?
        </h2>
        <p className="mb-10 leading-relaxed" style={{ color: '#7a6a5a' }}>
          Open to families, practitioners, and anyone whose life has been touched by Spelling to Communicate.
          Every reflection is reviewed before it appears on this page.
        </p>

        <form onSubmit={handleSubmit} className="space-y-7">

          {/* Name type */}
          <div>
            <p className="text-sm font-semibold mb-3" style={{ color: '#2a1f17' }}>How would you like your name displayed?</p>
            <div className="flex gap-4">
              {([
                { value: 'initials', label: 'Initials only', example: 'e.g. M.B.' },
                { value: 'full', label: 'First name + last initial', example: 'e.g. Michelle B.' },
              ] as const).map(opt => (
                <label key={opt.value}
                  className="flex-1 flex items-start gap-3 rounded-2xl px-4 py-3.5 cursor-pointer transition-all"
                  style={{
                    background: nameType === opt.value ? '#fff8ee' : 'white',
                    border: `2px solid ${nameType === opt.value ? '#C9A435' : '#e8ddd0'}`,
                  }}>
                  <input type="radio" name="nameType" value={opt.value}
                    checked={nameType === opt.value}
                    onChange={() => { setNameType(opt.value); setNameDisplay('') }}
                    className="mt-0.5 accent-amber-500" />
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#2a1f17' }}>{opt.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#a08060' }}>{opt.example}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#2a1f17' }}>
              {nameType === 'initials' ? 'Your initials' : 'Your first name + last initial'}
            </label>
            <input type="text" required
              placeholder={nameType === 'initials' ? 'M.B.' : 'Michelle B.'}
              value={nameDisplay}
              onChange={e => setNameDisplay(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{ border: '1.5px solid #ddd3c4', background: 'white', color: '#2a1f17' }} />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#2a1f17' }}>
              Your connection to S2C <span className="font-normal" style={{ color: '#a08060' }}>(optional)</span>
            </label>
            <input type="text"
              placeholder="e.g. Parent · S2C Practitioner · Sibling · Grandmother · CRP"
              value={roleDescription}
              onChange={e => setRoleDescription(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{ border: '1.5px solid #ddd3c4', background: 'white', color: '#2a1f17' }} />
          </div>

          {/* Text */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#2a1f17' }}>Your reflection</label>
            <textarea required rows={6}
              placeholder="Share what this work has meant to you..."
              value={testimonialText}
              onChange={e => setTestimonialText(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-y"
              style={{ border: '1.5px solid #ddd3c4', background: 'white', color: '#2a1f17', lineHeight: '1.7' }} />
          </div>

          {/* Photo */}
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: '#2a1f17' }}>
              Photo <span className="font-normal" style={{ color: '#a08060' }}>(optional)</span>
            </p>
            <p className="text-xs mb-3" style={{ color: '#a08060' }}>A small photo to appear alongside your reflection.</p>
            {photoPreview ? (
              <div className="flex items-center gap-4">
                <img src={photoPreview} alt="Preview" className="w-16 h-16 rounded-full object-cover" style={{ border: '2px solid #e8ddd0' }} />
                <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(null); if (fileRef.current) fileRef.current.value = '' }}
                  className="text-xs underline underline-offset-2" style={{ color: '#a08060' }}>Remove</button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()}
                className="rounded-xl px-5 py-3 text-sm font-medium transition-all"
                style={{ border: '1.5px dashed #c4b49a', color: '#7a6a5a', background: 'white' }}>
                + Add a photo
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </div>

          {error && <p className="text-sm" style={{ color: '#c0392b' }}>{error}</p>}

          <button type="submit"
            disabled={submitting || !nameDisplay.trim() || !testimonialText.trim()}
            className="w-full py-4 rounded-full font-bold text-base transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: '#C9A435', color: '#2a1f17' }}>
            {submitting ? 'Submitting…' : 'Submit My Reflection'}
          </button>

          <p className="text-xs text-center" style={{ color: '#c4b49a' }}>
            All reflections are reviewed personally before appearing on this page.
          </p>
        </form>
      </div>
    </section>
  )
}
