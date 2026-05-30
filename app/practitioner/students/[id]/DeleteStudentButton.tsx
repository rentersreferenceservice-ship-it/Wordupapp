'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteStudentButton({ studentId }: { studentId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)

  async function handleDelete() {
    await fetch(`/api/practitioner/students/${studentId}`, { method: 'DELETE' })
    router.push('/practitioner/dashboard')
  }

  if (confirming) {
    return (
      <div className="flex gap-2">
        <button onClick={() => setConfirming(false)} className="bg-gray-100 text-gray-700 border-2 border-blue-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors">Cancel</button>
        <button onClick={handleDelete} className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors">Confirm Delete</button>
      </div>
    )
  }

  return (
    <button onClick={() => setConfirming(true)} className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
      Delete
    </button>
  )
}
