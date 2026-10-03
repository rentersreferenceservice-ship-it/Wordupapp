'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Book, BookPage, BookVisibility } from '@/lib/bookStore'

const AGE_GROUPS = [
  'Early Childhood (ages 4–5)',
  'Young Children (ages 6–8)',
  'Children (ages 9–11)',
  'Tweens (ages 12–14)',
  'Teens (ages 15–17)',
  'Adults (18+)',
]

export default function BookEditor({ book }: { book: Book }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [title, setTitle] = useState(book.title)
  const [subtitle, setSubtitle] = useState(book.subtitle)
  const [author, setAuthor] = useState(book.author)
  const [ageGroup, setAgeGroup] = useState(book.ageGroup)
  const [coverImageUrl, setCoverImageUrl] = useState(book.coverImageUrl)
  const [visibility, setVisibility] = useState<BookVisibility>(book.visibility)
  const [pages, setPages] = useState<BookPage[]>(book.pages)
  const [savingDetails, setSavingDetails] = useState(false)
  const [detailsSaved, setDetailsSaved] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingPage, setUploadingPage] = useState(false)
  const [newCaption, setNewCaption] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/books/${book.id}` : ''

  async function uploadImage(file: File): Promise<string | null> {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/practitioner/books/image-upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Upload failed'); return null }
    return data.url
  }

  async function handleCoverUpload(file: File) {
    setUploadingCover(true)
    setError('')
    const url = await uploadImage(file)
    if (url) setCoverImageUrl(url)
    setUploadingCover(false)
  }

  async function saveDetails() {
    setSavingDetails(true)
    setError('')
    try {
      const res = await fetch(`/api/practitioner/books/${book.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, subtitle, author, coverImageUrl, ageGroup, visibility }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to save'); return }
      setDetailsSaved(true)
      setTimeout(() => setDetailsSaved(false), 2000)
    } finally {
      setSavingDetails(false)
    }
  }

  async function savePages(next: BookPage[]) {
    setPages(next)
    await fetch(`/api/practitioner/books/${book.id}/pages`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pages: next }),
    })
  }

  async function handleAddPage(file: File) {
    setUploadingPage(true)
    setError('')
    const url = await uploadImage(file)
    if (url) {
      await savePages([...pages, { imageUrl: url, caption: newCaption }])
      setNewCaption('')
    }
    setUploadingPage(false)
  }

  function moveUp(idx: number) {
    if (idx === 0) return
    const next = [...pages]
    ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
    savePages(next)
  }

  function moveDown(idx: number) {
    if (idx === pages.length - 1) return
    const next = [...pages]
    ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
    savePages(next)
  }

  function duplicatePage(idx: number) {
    const next = [...pages]
    next.splice(idx + 1, 0, { ...pages[idx] })
    savePages(next)
  }

  function deletePage(idx: number) {
    const next = pages.filter((_, i) => i !== idx)
    savePages(next)
  }

  function updateCaption(idx: number, caption: string) {
    const next = pages.map((p, i) => i === idx ? { ...p, caption } : p)
    setPages(next)
  }

  function captionBlur(idx: number) {
    savePages(pages)
  }

  async function handleDelete() {
    if (!confirm(`Delete "${book.title}"? This can't be undone.`)) return
    setDeleting(true)
    const res = await fetch(`/api/practitioner/books/${book.id}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/practitioner/books')
    } else {
      setError('Could not delete this book.')
      setDeleting(false)
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore — the link is still visible to copy manually
    }
  }

  return (
    <div className="space-y-6">
      {/* Book details */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-4">Book Details</h1>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
            <input value={subtitle} onChange={e => setSubtitle(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Author / Creator</label>
            <input value={author} onChange={e => setAuthor(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age group</label>
            <select value={ageGroup} onChange={e => setAgeGroup(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
              <option value="">Not set</option>
              {AGE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cover image</label>
            {coverImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverImageUrl} alt="Cover" className="rounded-lg border border-gray-200 max-h-40 mb-2" />
            )}
            <input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploadingCover}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f) }} className="text-sm" />
          </div>

          <div className="pt-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setVisibility('private')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-colors ${visibility === 'private' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                Private
              </button>
              <button type="button" onClick={() => setVisibility('link')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-colors ${visibility === 'link' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                Shared by Link
              </button>
              <button type="button" onClick={() => setVisibility('public')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-colors ${visibility === 'public' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                Public (in library)
              </button>
            </div>
            {visibility === 'public' && (
              <p className="text-xs text-gray-500 mt-2">Anyone can find and read this in the public Book Library — no link needed.</p>
            )}
            {(visibility === 'link' || visibility === 'public') && (
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <code className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 break-all">{shareUrl}</code>
                <button type="button" onClick={copyLink} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-200">
                  {copied ? '✓ Copied' : 'Copy link'}
                </button>
                <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">Preview</a>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex items-center justify-between">
            <button onClick={saveDetails} disabled={savingDetails} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {savingDetails ? 'Saving…' : detailsSaved ? '✓ Saved' : 'Save Details'}
            </button>
            <button onClick={handleDelete} disabled={deleting} className="text-red-500 text-sm font-medium hover:text-red-700 disabled:opacity-50">
              {deleting ? 'Deleting…' : 'Delete Book'}
            </button>
          </div>
        </div>
      </div>

      {/* Pages */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pages</h2>

        <div className="space-y-3 mb-6">
          {pages.map((page, idx) => (
            <div key={idx} className="flex gap-3 border border-gray-100 rounded-xl p-3">
              {page.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={page.imageUrl} alt={`Page ${idx + 1}`} className="w-20 h-20 object-cover rounded-lg border border-gray-200 shrink-0" />
              ) : (
                <div className="w-20 h-20 shrink-0 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center">
                  <label className="text-xs text-blue-600 text-center cursor-pointer px-1">
                    Upload
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                      onChange={async e => {
                        const f = e.target.files?.[0]
                        if (!f) return
                        const url = await uploadImage(f)
                        if (url) await savePages(pages.map((p, i) => i === idx ? { ...p, imageUrl: url } : p))
                      }} />
                  </label>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-400 mb-1">Page {idx + 1}</p>
                <textarea
                  value={page.caption}
                  onChange={e => updateCaption(idx, e.target.value)}
                  onBlur={() => captionBlur(idx)}
                  placeholder="Caption for this page…"
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm resize-none"
                />
              </div>
              <div className="flex flex-col gap-1 shrink-0 text-xs">
                <button onClick={() => moveUp(idx)} disabled={idx === 0} className="text-gray-400 hover:text-gray-700 disabled:opacity-30">▲ Up</button>
                <button onClick={() => moveDown(idx)} disabled={idx === pages.length - 1} className="text-gray-400 hover:text-gray-700 disabled:opacity-30">▼ Down</button>
                <button onClick={() => duplicatePage(idx)} className="text-purple-500 hover:text-purple-700">Duplicate</button>
                <button onClick={() => deletePage(idx)} className="text-red-400 hover:text-red-600">Delete</button>
              </div>
            </div>
          ))}
          {pages.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No pages yet — add your first one below.</p>}
        </div>

        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">Add a page</p>
          <textarea
            value={newCaption}
            onChange={e => setNewCaption(e.target.value)}
            placeholder="Caption (you can edit it after too)"
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none mb-2"
          />
          <input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploadingPage}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleAddPage(f) }} className="text-sm" />
          {uploadingPage && <p className="text-xs text-gray-400 mt-1">Uploading…</p>}
        </div>
      </div>
    </div>
  )
}
