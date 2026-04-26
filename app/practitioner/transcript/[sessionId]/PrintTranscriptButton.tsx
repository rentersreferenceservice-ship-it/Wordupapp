'use client'

import { usePathname } from 'next/navigation'

export default function PrintTranscriptButton() {
  const pathname = usePathname()
  const sessionId = pathname.split('/')[3]

  return (
    <div className="flex gap-2">
      <button
        onClick={() => window.print()}
        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
      >
        Print Transcript
      </button>
      <a
        href={`/practitioner/transcript/${sessionId}/print`}
        target="_blank"
        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        ⬇ Save as PDF
      </a>
    </div>
  )
}
