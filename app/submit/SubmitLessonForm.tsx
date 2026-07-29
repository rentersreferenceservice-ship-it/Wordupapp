'use client'

import { useState } from 'react'
import JSZip from 'jszip'
import type { Hunk, Question, QuestionType } from '@/lib/types'

function compressImage(base64Data: string, ext: string): Promise<string> {
  return new Promise((resolve) => {
    const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'png' ? 'image/png' : 'image/jpeg'
    const img = new Image()
    img.onload = () => {
      const MAX = 800
      let { width, height } = img
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX }
        else { width = Math.round(width * MAX / height); height = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.82).split(',')[1])
    }
    img.onerror = () => resolve(base64Data) // fallback: send original
    img.src = `data:${mimeType};base64,${base64Data}`
  })
}

function InsertButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex items-center gap-2 my-1 group">
      <div className="flex-1 h-px bg-gray-100 group-hover:bg-blue-200 transition-colors" />
      <button
        onClick={onClick}
        className="text-gray-300 hover:text-blue-500 text-xs font-medium transition-colors px-1"
        title="Insert question here"
      >
        + insert
      </button>
      <div className="flex-1 h-px bg-gray-100 group-hover:bg-blue-200 transition-colors" />
    </div>
  )
}

const AGE_GROUPS = [
  'Young Children (ages 6–8)',
  'Children (ages 9–11)',
  'Tweens (ages 12–14)',
  'Teens (ages 15–17)',
  'Adults (18+)',
]

const QUESTION_TYPES: QuestionType[] = ['KNOWN', 'SEMI-OPEN', 'PRIOR KNOWLEDGE', 'MATH', 'VAKT', 'OPEN']

const TYPE_COLORS: Record<QuestionType, string> = {
  KNOWN: 'text-green-700',
  'SEMI-OPEN': 'text-orange-500',
  'PRIOR KNOWLEDGE': 'text-blue-600',
  MATH: 'text-purple-700',
  VAKT: 'text-red-600',
  OPEN: 'text-pink-600',
}

type Step = 'upload' | 'review' | 'done'

interface Props {
  practitionerMode?: boolean
  backHref: string
}

export default function SubmitLessonForm({ practitionerMode, backHref }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [step, setStep] = useState<Step>('upload')
  const [parsing, setParsing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedId, setSavedId] = useState('')

  const [title, setTitle] = useState('')
  const [topic, setTopic] = useState('')
  const [ageGroup, setAgeGroup] = useState(AGE_GROUPS[0])
  const [hunks, setHunks] = useState<Hunk[]>([])
  const [citations, setCitations] = useState<string[]>([])
  const [scope, setScope] = useState<'public' | 'private'>(practitionerMode ? 'private' : 'public')
  const [author, setAuthor] = useState('')

  async function handleUpload() {
    const file = selectedFile
    if (!file) { setError('Please select a file.'); return }
    if (!file.name.endsWith('.docx') && !file.name.endsWith('.pdf')) { setError('Only .docx and .pdf files are supported.'); return }

    setError('')
    setParsing(true)
    try {
      // For PDFs send raw base64; for DOCX unzip in browser and send only the XML text
      let body: object
      if (file.name.toLowerCase().endsWith('.pdf')) {
        const ab = await file.arrayBuffer()
        const b64 = btoa(String.fromCharCode(...new Uint8Array(ab)))
        body = { fileName: file.name, fileData: b64, isPdf: true }
      } else {
        const ab = await file.arrayBuffer()
        const zip = await JSZip.loadAsync(ab)
        const xmlFile = zip.file('word/document.xml')
        if (!xmlFile) throw new Error('Invalid DOCX — could not find document.xml inside the file.')
        const xmlContent = await xmlFile.async('string')

        // Extract relationship map and images from the ZIP
        const zipEntries = Object.keys(zip.files)
        const relsPath = zipEntries.find(f =>
          f.toLowerCase() === 'word/_rels/document.xml.rels' ||
          f.toLowerCase().endsWith('/word/_rels/document.xml.rels')
        ) ?? 'word/_rels/document.xml.rels'
        const relsFile = zip.file(relsPath)
        const relsXml = relsFile ? await relsFile.async('string') : ''
        const mediaEntries = zipEntries.filter(f => f.toLowerCase().includes('media'))
        const images: Array<{ rId: string; fileName: string; base64Data: string }> = []
        if (relsXml) {
          const relRegex = /<Relationship\s[^>]+>/g
          let m
          while ((m = relRegex.exec(relsXml)) !== null) {
            const el = m[0]
            const idMatch = el.match(/\bId="([^"]+)"/)
            const targetMatch = el.match(/\bTarget="([^"]+)"/)
            const typeMatch = el.match(/\bType="([^"]+)"/)
            if (idMatch && targetMatch && typeMatch && typeMatch[1].includes('/image')) {
              const rId = idMatch[1]
              const target = targetMatch[1]
              const fileName = target.split('/').pop() || 'image.png'
              const mediaPath = mediaEntries.find(f => f.endsWith(fileName)) ?? `word/${target}`
              const imgFile = zip.file(mediaPath)
              if (imgFile) {
                const raw = await imgFile.async('base64')
                const ext = fileName.split('.').pop()?.toLowerCase() ?? 'png'
                const base64Data = await compressImage(raw, ext)
                images.push({ rId, fileName: fileName.replace(/\.[^.]+$/, '.jpg'), base64Data })
              }
            }
          }
        }

        body = { fileName: file.name, xmlContent, relsXml, images, isPdf: false }
      }

      let res: Response
      try {
        res = await fetch('/api/parse-lesson', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } catch (networkErr) {
        throw new Error(`Network error — could not reach server. ${networkErr instanceof Error ? networkErr.message : ''}`)
      }
      if (!res.ok) {
        let errMsg = `Server error ${res.status}`
        try { const d = await res.json(); errMsg = d.error || errMsg } catch { /* ignore */ }
        throw new Error(errMsg)
      }
      const data = await res.json()

      setTitle(data.title || '')
      setAuthor(data.author || '')
      setHunks(data.hunks || [])
      setCitations(data.citations || [])
      setStep('review')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setParsing(false)
    }
  }

  function updateQuestion(hi: number, qi: number, field: keyof Question, value: string) {
    setHunks(prev => prev.map((h, i) =>
      i !== hi ? h : {
        ...h,
        questions: h.questions.map((q, j) =>
          j !== qi ? q : { ...q, [field]: value }
        ),
      }
    ))
  }

  function updateHunkText(hi: number, value: string) {
    setHunks(prev => prev.map((h, i) => i !== hi ? h : { ...h, text: value }))
  }

  function updateHunkImage(hi: number, field: 'imageUrl' | 'imageAlt', value: string) {
    setHunks(prev => prev.map((h, i) => i !== hi ? h : { ...h, [field]: value || undefined }))
  }

  function addQuestion(hi: number, position: number) {
    setHunks(prev => prev.map((h, i) => {
      if (i !== hi) return h
      const newQ: Question = { type: 'KNOWN', question: '', answer: '' }
      const qs = [...h.questions]
      qs.splice(position, 0, newQ)
      return { ...h, questions: qs }
    }))
  }

  function removeQuestion(hi: number, qi: number) {
    setHunks(prev => prev.map((h, i) =>
      i !== hi ? h : { ...h, questions: h.questions.filter((_, j) => j !== qi) }
    ))
  }

  async function handleSave() {
    if (!title.trim()) { setError('Please add a lesson title.'); return }
    if (hunks.length === 0) { setError('Lesson has no content.'); return }

    setError('')
    setSaving(true)
    try {
      const res = await fetch('/api/save-submitted-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, topic, ageGroup, hunks, citations, scope, author }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setSavedId(data.id)
      setStep('done')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  if (step === 'done') {
    const viewHref = practitionerMode ? `/practitioner/lessons/${savedId}` : `/lessons/${savedId}`
    const libraryHref = practitionerMode ? '/practitioner/library' : '/lessons'
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Lesson Saved!</h1>
          <p className="text-gray-500 text-sm mb-6">Your lesson is ready to use.</p>
          <div className="flex flex-col gap-3">
            <a href={viewHref} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors">View Lesson</a>
            <a href={libraryHref} className="bg-gray-100 text-gray-700 border-2 border-blue-600 px-6 py-3 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors">Back to Library</a>
          </div>
        </div>
      </main>
    )
  }

  if (step === 'review') {
    return (
      <main className="min-h-screen px-6 py-8 max-w-3xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <button onClick={() => setStep('upload')} className="text-sm text-blue-600 hover:underline">← Upload different file</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {saving ? 'Saving…' : 'Save Lesson'}
          </button>
        </div>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Lesson Details</h2>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Lesson title" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Author Name</label>
            <input value={author} onChange={e => setAuthor(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Jane Smith" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Topic</label>
              <input value={topic} onChange={e => setTopic(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Photosynthesis" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Age Group</label>
              <select value={ageGroup} onChange={e => setAgeGroup(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                {AGE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          {practitionerMode && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Visibility</label>
              <div className="flex gap-4">
                {(['private', 'public'] as const).map(s => (
                  <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" value={s} checked={scope === s} onChange={() => setScope(s)} />
                    {s === 'private' ? 'Private (my portal only)' : 'Public (visible to everyone)'}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {hunks.map((hunk, hi) => (
          <div key={hi} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
            <h3 className="text-sm font-semibold text-gray-500 mb-3">Hunk {hi + 1}</h3>
            <textarea
              value={hunk.text}
              onChange={e => updateHunkText(hi, e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3 resize-none"
              placeholder="Hunk body text…"
            />
            <div className="mb-4 space-y-1.5">
              <label className="block text-xs font-medium text-gray-500">Image URL (optional)</label>
              <input
                value={hunk.imageUrl || ''}
                onChange={e => updateHunkImage(hi, 'imageUrl', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://…"
              />
              {hunk.imageUrl && (
                <>
                  <input
                    value={hunk.imageAlt || ''}
                    onChange={e => updateHunkImage(hi, 'imageAlt', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Image description (alt text)"
                  />
                  <img src={hunk.imageUrl} alt={hunk.imageAlt || ''} className="w-full h-32 object-cover rounded-lg mt-1" onError={e => (e.currentTarget.style.display = 'none')} />
                </>
              )}
            </div>
            <div>
              <InsertButton onClick={() => addQuestion(hi, 0)} />
              {hunk.questions.map((q, qi) => (
                <div key={qi}>
                  <div className="flex gap-2 items-start">
                    <select
                      value={q.type}
                      onChange={e => updateQuestion(hi, qi, 'type', e.target.value)}
                      className={`border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shrink-0 ${TYPE_COLORS[q.type]}`}
                    >
                      {QUESTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <div className="flex-1 space-y-1.5">
                      <input
                        value={q.question}
                        onChange={e => updateQuestion(hi, qi, 'question', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Question text"
                      />
                      <input
                        value={q.answer}
                        onChange={e => updateQuestion(hi, qi, 'answer', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Answer (optional)"
                      />
                    </div>
                    <button onClick={() => removeQuestion(hi, qi)} className="text-gray-300 hover:text-red-400 text-lg leading-none pt-1.5 shrink-0">×</button>
                  </div>
                  <InsertButton onClick={() => addQuestion(hi, qi + 1)} />
                </div>
              ))}
            </div>
          </div>
        ))}

        {citations.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
            <h3 className="text-sm font-semibold text-gray-500 mb-3">References</h3>
            <div className="space-y-2">
              {citations.map((c, i) => (
                <input
                  key={i}
                  value={c}
                  onChange={e => setCitations(prev => prev.map((x, j) => j === i ? e.target.value : x))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end pb-8">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {saving ? 'Saving…' : 'Save Lesson'}
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen px-6 py-8 max-w-xl mx-auto">
      <div className="mb-6">
        <a href={backHref} className="text-sm text-blue-600 hover:underline">← Back</a>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Upload a Lesson</h1>
        <p className="text-sm text-gray-500 mb-6">
          Upload your completed lesson as a Word document or PDF. We'll extract the content and take you to a review step before saving.
        </p>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Lesson File (.docx or .pdf)</label>
            <input
              type="file"
              accept=".docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg px-3 py-2 cursor-pointer bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {selectedFile && <p className="text-xs text-green-700 font-medium mt-1">✓ {selectedFile.name}</p>}
          </div>

          <div className="text-xs text-gray-400 space-y-2">
            <p><span className="font-medium text-gray-500">Word (.docx) recommended</span> — question colors and images are extracted automatically.</p>
            <p><span className="font-medium text-amber-600">PDF:</span> text and question types are read, but images will not be included.</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
              <span className="text-green-700 font-medium">KNOWN</span>
              <span className="text-orange-500 font-medium">SEMI-OPEN</span>
              <span className="text-blue-600 font-medium">PRIOR KNOWLEDGE</span>
              <span className="text-purple-700 font-medium">MATH</span>
              <span className="text-red-600 font-medium">VAKT</span>
              <span className="text-pink-600 font-medium">OPEN</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-300 rounded-xl px-4 py-3">
              <p className="text-red-700 text-sm font-semibold">Upload failed</p>
              <p className="text-red-600 text-sm mt-0.5">{error}</p>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={parsing}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {parsing ? (selectedFile?.name.endsWith('.pdf') ? 'AI is reading the lesson…' : 'Reading lesson…') : 'Upload & Review'}
          </button>
        </div>
      </div>
    </main>
  )
}
