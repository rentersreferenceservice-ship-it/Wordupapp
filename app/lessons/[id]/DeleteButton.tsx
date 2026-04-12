'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'

export default function DeleteButton() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    await fetch(`/api/lessons/${id}/delete`, { method: 'DELETE' })
    router.push('/lessons')
  }

  if (confirming) {
    return (
      <div className="flex gap-2 items-center">
        <span className="text-sm text-gray-600">Delete this lesson?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-60"
        >
          {loading ? 'Deleting…' : 'Yes, delete'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
    >
      Delete
    </button>
  )
}
