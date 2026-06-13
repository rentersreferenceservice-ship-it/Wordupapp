'use client'

import { useState } from 'react'
import { BOARD_LEVELS } from '@/lib/practitionerStore'

export default function BoardLevelPills({
  sessionId,
  boardLevel,
  suggestedLevel,
}: {
  sessionId: string
  boardLevel: string | null
  suggestedLevel: string | null
}) {
  const [current, setCurrent] = useState(boardLevel)
  const [saving, setSaving] = useState(false)

  async function toggle(level: string) {
    const next = level === current ? null : level
    setSaving(true)
    const res = await fetch(`/api/practitioner/sessions/${sessionId}/board`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boardLevel: next }),
    })
    if (res.ok) setCurrent(next)
    setSaving(false)
  }

  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {BOARD_LEVELS.map(b => {
        const isActive = current === b
        const isSuggested = !current && suggestedLevel === b
        return (
          <button
            key={b}
            onClick={() => toggle(b)}
            disabled={saving}
            title={isSuggested ? 'Tap to confirm (carried from previous session)' : undefined}
            className={`px-2 py-0.5 rounded-full text-xs font-semibold border transition-colors ${
              isActive
                ? 'bg-blue-600 text-white border-blue-600'
                : isSuggested
                ? 'bg-blue-100 text-blue-500 border-blue-300'
                : 'border-gray-200 text-gray-400 hover:border-blue-400 hover:text-blue-600'
            }`}
          >
            {b}
          </button>
        )
      })}
    </div>
  )
}
