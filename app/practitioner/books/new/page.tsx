'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewBookPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [author, setAuthor] = useState('')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleCoverChange(file: File | null) {
    setCoverFile(file)
    setCoverPreview(file ? URL.createObjectURL(file) : null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('A title is required.'); return }
    setLoading(true)
    setError('')
    try {
      let coverImageUrl: string | null = null
      if (coverFile) {
        const fd = new FormData()
        fd.append('file', coverFile)
        const uploadRes = await fetch('/api/practitioner/books/image-upload', { method: 'POST', body: fd })
        const uploadData = await uploadRes.json()
        if (!uploadRes.ok) { setError(uploadData.error ?? 'Failed to upload cover'); setLoading(false); return }
        coverImageUrl = uploadData.url
      }

      const res = await fetch('/api/practitioner/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, subtitle, author, coverImageUrl }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Could not create the book.'); setLoading(false); return }
      router.push(`/practitioner/books/${data.book.id}/edit`)
    } catch {
      setError('Something went wrong.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-6">New Book</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="How Big Is Joey's World?"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="text"
              value={subtitle}
              onChange={e => setSubtitle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Author / Creator <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="text"
              value={author}
              onChange={e => setAuthor(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cover image <span className="text-gray-400 font-normal">(optional, add later if you prefer)</span></label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={e => handleCoverChange(e.target.files?.[0] ?? null)}
              className="w-full text-sm"
            />
            {coverPreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverPreview} alt="Cover preview" className="mt-2 rounded-lg border border-gray-200 max-h-40" />
            )}
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => router.back()} className="flex-1 bg-gray-100 text-gray-700 border-2 border-blue-600 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors">
              {loading ? 'Creating…' : 'Create Book'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
