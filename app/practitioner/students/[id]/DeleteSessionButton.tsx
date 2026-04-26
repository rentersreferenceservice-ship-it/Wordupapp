'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteSessionButton({ sessionId }: { sessionId: string }) {
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setDeleting(true)
    await fetch(`/api/practitioner/sessions/${sessionId}`, { method: 'DELETE' })
    router.refresh()
  }

  if (confirm) {
    return (
      <span className="flex items-center gap-1">
        <button onClick={handleDelete} disabled={deleting} className="text-xs text-red-600 font-semibold hover:underline">
          {deleting ? 'Deleting…' : 'Confirm'}
        </button>
        <button onClick={() => setConfirm(false)} className="text-xs text-gray-400 hover:underline">Cancel</button>
      </span>
    )
  }

  return (
    <button onClick={() => setConfirm(true)} className="text-xs text-gray-300 hover:text-red-500 transition-colors">
      Delete
    </button>
  )
}
