'use client'

import { usePathname } from 'next/navigation'
import { useState } from 'react'

export default function PrintTranscriptButton() {
  const pathname = usePathname()
  const sessionId = pathname.split('/')[3]
  const [savingPdf, setSavingPdf] = useState(false)
  const [savingDocx, setSavingDocx] = useState(false)

  async function handleSaveFile(endpoint: string, suggestedFallback: string, mimeType: string, ext: string, description: string) {
    try {
      const res = await fetch(`/api/practitioner/sessions/${sessionId}/${endpoint}`)
      if (!res.ok) throw new Error(await res.text())
      const blob = await res.blob()
      const suggested = res.headers.get('Content-Disposition')
        ?.match(/filename="(.+?)"/)?.[1] ?? suggestedFallback

      if ('showSaveFilePicker' in window) {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: suggested,
          types: [{ description, accept: { [mimeType]: [`.${ext}`] } }],
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
    }
  }

  async function handleSavePdf() {
    setSavingPdf(true)
    await handleSaveFile('pdf', 'transcript.pdf', 'application/pdf', 'pdf', 'PDF Document')
    setSavingPdf(false)
  }

  async function handleSaveDocx() {
    setSavingDocx(true)
    await handleSaveFile('docx', 'transcript.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'docx', 'Word Document')
    setSavingDocx(false)
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => window.print()}
        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
      >
        🖨 Print
      </button>
      <button
        onClick={handleSavePdf}
        disabled={savingPdf}
        className="bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-700 disabled:opacity-60 transition-colors"
      >
        {savingPdf ? 'Preparing…' : '⬇ Save as PDF'}
      </button>
      <button
        onClick={handleSaveDocx}
        disabled={savingDocx}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
      >
        {savingDocx ? 'Preparing…' : '⬇ Save as Word'}
      </button>
    </div>
  )
}
