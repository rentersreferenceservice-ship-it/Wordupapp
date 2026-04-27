'use client'

import { usePathname } from 'next/navigation'

export default function PrintTranscriptButton() {
  const pathname = usePathname()
  const sessionId = pathname.split('/')[3]

  return (
    <button
      onClick={() => window.print()}
      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
    >
      🖨 Print / Save as PDF
    </button>
  )
}
