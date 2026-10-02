'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteIntakeButton({ id }: { id: string }) {
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDeleting(true)
    await fetch(`/api/practitioner/inquiries/${id}/delete`, { method: 'DELETE' })
    router.refresh()
  }

  function stop(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
  }

  if (confirm) {
    return (
      <span className="flex items-center gap-1 shrink-0" onClick={stop}>
        <button onClick={handleDelete} disabled={deleting} className="text-xs text-red-600 font-semibold hover:underline">
          {deleting ? 'Deleting…' : 'Confirm'}
        </button>
        <button onClick={e => { stop(e); setConfirm(false) }} className="text-xs text-gray-400 hover:underline">Cancel</button>
      </span>
    )
  }

  return (
    <button onClick={e => { stop(e); setConfirm(true) }} className="text-xs text-gray-300 hover:text-red-500 transition-colors shrink-0">
      Delete
    </button>
  )
}
