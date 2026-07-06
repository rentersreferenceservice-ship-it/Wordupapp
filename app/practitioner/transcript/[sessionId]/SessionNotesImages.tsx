'use client'

import { useRef, useState } from 'react'

export default function SessionNotesImages({
  sessionId,
  initialImages,
}: {
  sessionId: string
  initialImages: string[]
}) {
  const [images, setImages] = useState<string[]>(initialImages)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(`/api/practitioner/sessions/${sessionId}/notes-images`, {
      method: 'POST',
      body: fd,
    })
    setUploading(false)
    if (res.ok) {
      const { url } = await res.json()
      setImages(prev => [...prev, url])
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleDelete(url: string) {
    await fetch(`/api/practitioner/sessions/${sessionId}/notes-images`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
    setImages(prev => prev.filter(u => u !== url))
  }

  return (
    <div className="mt-2">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-2">
          {images.map((url, i) => (
            <div key={i} className="relative group">
              <img
                src={url}
                alt={`Session note image ${i + 1}`}
                className="w-32 h-32 object-cover rounded-lg border border-gray-200"
              />
              <button
                onClick={() => handleDelete(url)}
                className="print:hidden absolute top-1 right-1 bg-black/60 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove image"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <label className="print:hidden inline-flex items-center gap-2 cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
        {uploading ? 'Uploading…' : '+ Add Photo'}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
          disabled={uploading}
        />
      </label>
    </div>
  )
}
