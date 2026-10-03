'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const AGE_GROUPS = [
  'Early Childhood (ages 4–5)',
  'Young Children (ages 6–8)',
  'Children (ages 9–11)',
  'Tweens (ages 12–14)',
  'Teens (ages 15–17)',
  'Adults (18+)',
]

interface GeneratedPage {
  caption: string
  imagePrompt: string
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore — the text is still visible to copy manually
    }
  }
  return (
    <button onClick={handleCopy} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-200 shrink-0">
      {copied ? '✓ Copied' : 'Copy prompt'}
    </button>
  )
}

export default function GenerateBookPage() {
  const router = useRouter()
  const [topic, setTopic] = useState('')
  const [characterName, setCharacterName] = useState('')
  const [characterDescription, setCharacterDescription] = useState('')
  const [genre, setGenre] = useState('')
  const [ageGroup, setAgeGroup] = useState(AGE_GROUPS[2])
  const [pageCount, setPageCount] = useState(9)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [pages, setPages] = useState<GeneratedPage[] | null>(null)

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!topic.trim()) { setError('A topic is required.'); return }
    if (!characterName.trim()) { setError("The main character's name is required."); return }
    setGenerating(true)
    setError('')
    try {
      const res = await fetch('/api/practitioner/books/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, characterName, characterDescription, genre, ageGroup, pageCount }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to generate'); return }
      setTitle(data.title)
      setPages(data.pages)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate')
    } finally {
      setGenerating(false)
    }
  }

  function updateCaption(idx: number, caption: string) {
    setPages(prev => prev ? prev.map((p, i) => i === idx ? { ...p, caption } : p) : prev)
  }

  async function handleCreateBook() {
    if (!pages) return
    setSaving(true)
    setError('')
    try {
      const createRes = await fetch('/api/practitioner/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      const createData = await createRes.json()
      if (!createRes.ok) { setError(createData.error ?? 'Failed to create book'); setSaving(false); return }

      const bookId = createData.book.id
      const pagesRes = await fetch(`/api/practitioner/books/${bookId}/pages`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pages: pages.map(p => ({ imageUrl: '', caption: p.caption })) }),
      })
      if (!pagesRes.ok) { setError('Book created, but saving pages failed — add them manually in the editor.'); setSaving(false); return }

      router.push(`/practitioner/books/${bookId}/edit`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create book')
      setSaving(false)
    }
  }

  if (pages) {
    return (
      <main className="min-h-screen px-6 py-8 max-w-2xl mx-auto">
        <button onClick={() => setPages(null)} className="text-sm text-blue-600 hover:underline mb-4 block">← Start over</button>
        <h1 className="text-xl font-bold text-gray-900 mb-1">{title}</h1>
        <p className="text-sm text-gray-500 mb-6">
          Edit captions if you&apos;d like, then send each page straight to ChatGPT to make the picture (or copy the prompt yourself). When you&apos;re ready, create the book — you&apos;ll add each image afterward in the editor.
        </p>

        <div className="space-y-3 mb-6">
          {pages.map((page, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-400 mb-2">Page {idx + 1}</p>
              <textarea
                value={page.caption}
                onChange={e => updateCaption(idx, e.target.value)}
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none mb-3"
              />
              <div className="flex items-start gap-2 bg-gray-50 border border-gray-200 rounded-lg p-3 mb-2">
                <p className="text-xs text-gray-600 flex-1">{page.imagePrompt}</p>
                <CopyButton text={page.imagePrompt} />
              </div>
              <a
                href={`https://chatgpt.com/?q=${encodeURIComponent(page.imagePrompt)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
              >
                Open in ChatGPT →
              </a>
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <button onClick={handleCreateBook} disabled={saving} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {saving ? 'Creating…' : 'Create Book With These Captions'}
        </button>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Generate a Book</h1>
        <p className="text-sm text-gray-500 mb-6">AI drafts the story and an image prompt for each page. You generate the pictures yourself in ChatGPT, then upload them here.</p>
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
            <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="How big the universe is"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Main character&apos;s name</label>
            <input type="text" value={characterName} onChange={e => setCharacterName(e.target.value)} placeholder="Joey"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Character appearance <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea value={characterDescription} onChange={e => setCharacterDescription(e.target.value)} rows={2}
              placeholder="A young boy with brown hair, blue striped shirt, jeans"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Genre / field of study <span className="text-gray-400 font-normal">(optional)</span></label>
            <input type="text" value={genre} onChange={e => setGenre(e.target.value)} placeholder="Science, social story, life skills, history…"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age group</label>
            <select value={ageGroup} onChange={e => setAgeGroup(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white">
              {AGE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of pages</label>
            <input type="number" min={3} max={24} value={pageCount} onChange={e => setPageCount(parseInt(e.target.value, 10) || 9)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => router.back()} className="flex-1 bg-gray-100 text-gray-700 border-2 border-blue-600 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={generating} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors">
              {generating ? 'Generating…' : 'Generate'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
