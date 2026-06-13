'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteReportButton({ studentId, reportId }: { studentId: string; reportId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setDeleting(true)
    await fetch(`/api/practitioner/report/${studentId}/save`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: reportId }),
    })
    router.refresh()
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <button onClick={handleDelete} disabled={deleting} className="text-xs text-red-500 font-semibold hover:text-red-700">
          {deleting ? 'Deleting…' : 'Confirm'}
        </button>
        <button onClick={() => setConfirming(false)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
      </div>
    )
  }

  return (
    <button onClick={() => setConfirming(true)} className="text-xs text-gray-300 hover:text-red-400 transition-colors">
      Delete
    </button>
  )
}
