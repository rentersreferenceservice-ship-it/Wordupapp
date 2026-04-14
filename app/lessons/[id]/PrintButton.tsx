'use client'

import { useParams } from 'next/navigation'

export default function PrintButton() {
  const params = useParams()
  const id = params?.id as string

  return (
    <a
      href={`/lessons/${id}/print`}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
    >
      Print
    </a>
  )
}
