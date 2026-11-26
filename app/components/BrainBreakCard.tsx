'use client'

import { useState } from 'react'
import type { BrainBreak } from '@/lib/types'
import BrainBreakGame, { BRAIN_BREAK_NAMES } from './BrainBreakGame'
import { useTabletConnection } from './TabletConnectionProvider'

// Full-screen game layer. Like the video overlay it sits ON TOP of the page,
// so the speller's work underneath is untouched when it's closed.
export function BrainBreakOverlay({ game, onClose }: { game: BrainBreak; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-lg font-bold text-purple-700">🧠 Brain Break — {BRAIN_BREAK_NAMES[game.type]}</p>
          <button type="button" onClick={onClose} className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-base font-semibold hover:bg-gray-700">
            ✕ Done
          </button>
        </div>
        <BrainBreakGame game={game} />
      </div>
    </div>
  )
}

// Card shown between pages: play here, or send it to the speller's tablet.
// In a session (no TabletConnectionProvider) pass the session's own sender.
export default function BrainBreakCard({ game, onSendToTablet }: { game: BrainBreak; onSendToTablet?: () => void }) {
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const tablet = useTabletConnection()
  const send = onSendToTablet ?? (tablet.code ? () => tablet.sendGame(game) : null)

  return (
    <div className="print:hidden my-4 border-2 border-dashed border-purple-300 bg-purple-50 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
      <div>
        <p className="text-sm font-bold text-purple-800">🧠 Brain Break: {BRAIN_BREAK_NAMES[game.type]}</p>
        <p className="text-xs text-purple-600">A quick sensory break before the next page.</p>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen(true)} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700">
          ▶ Play here
        </button>
        {send && (
          <button type="button" onClick={() => { send(); setSent(true); setTimeout(() => setSent(false), 1500) }} className="bg-white text-purple-700 border-2 border-purple-300 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-100">
            {sent ? '✓ Sent' : '📲 Send to tablet'}
          </button>
        )}
      </div>
      {open && <BrainBreakOverlay game={game} onClose={() => setOpen(false)} />}
    </div>
  )
}
