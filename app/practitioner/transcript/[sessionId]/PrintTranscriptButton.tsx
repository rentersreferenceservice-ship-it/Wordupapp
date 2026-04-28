'use client'

import { usePathname } from 'next/navigation'
import { useState } from 'react'

export default function PrintTranscriptButton() {
  const pathname = usePathname()
  const sessionId = pathname.split('/')[3]
  const [saving, setSaving] = useState(false)

  async function handleSaveDocx() {
    setSaving(true)
    try {
      const res = await fetch(`/api/practitioner/sessions/${sessionId}/docx`)
      const blob = await res.blob()
      const suggested = res.headers.get('Content-Disposition')
        ?.match(/filename="(.+?)"/)?.[1] ?? 'transcript.docx'

      // Use file picker if available (Chrome/Edge), otherwise fall back to download
      if ('showSaveFilePicker' in window) {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: suggested,
          types: [{ description: 'Word Document', accept: { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] } }],
        })
        const writable = await handle.createWritable()
        await writable.write(blob)
        await writable.close()
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = suggested
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') alert('Could not save file: ' + e?.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => window.print()}
        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
      >
        🖨 Print / Save as PDF
      </button>
      <button
        onClick={handleSaveDocx}
        disabled={saving}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
      >
        {saving ? 'Preparing…' : '⬇ Save as Word (.docx)'}
      </button>
    </div>
  )
}
