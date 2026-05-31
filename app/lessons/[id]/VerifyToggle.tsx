'use client'

import { useState } from 'react'

export default function VerifyToggle({ lessonId, initialVerified }: { lessonId: string; initialVerified: boolean }) {
  const [verified, setVerified] = useState(initialVerified)
  const [saving, setSaving] = useState(false)

  async function toggle() {
    setSaving(true)
    const next = !verified
    const res = await fetch(`/api/lessons/${lessonId}/verify`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verified: next }),
    })
    if (res.ok) setVerified(next)
    setSaving(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={saving}
      className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-colors disabled:opacity-50 ${
        verified
          ? 'bg-green-100 text-green-800 border-green-500 hover:bg-green-200'
          : 'bg-gray-100 text-gray-600 border-gray-400 hover:bg-gray-200'
      }`}
    >
      {saving ? 'Saving…' : verified ? '✓ Verified' : 'Mark Verified'}
    </button>
  )
}
