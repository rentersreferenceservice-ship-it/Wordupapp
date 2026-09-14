'use client'

import { useRef, useState } from 'react'
import TypeToTalkSurface, { type TypeToTalkSurfaceHandle } from '../components/TypeToTalkSurface'

export default function PublicSurface({ rows }: { rows?: number }) {
  const surfaceRef = useRef<TypeToTalkSurfaceHandle>(null)
  const [saved, setSaved] = useState(false)

  function handleSave() {
    const paragraphs = surfaceRef.current?.getAllParagraphs() ?? []
    const text = paragraphs.map(p => p.text).join('\n\n')
    if (!text.trim()) return
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `type-to-talk-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-3">
      <TypeToTalkSurface ref={surfaceRef} rows={rows} />
      <button
        type="button"
        onClick={handleSave}
        className="w-full bg-purple-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
      >
        {saved ? '✓ Saved to your device' : 'Save to my device'}
      </button>
    </div>
  )
}
