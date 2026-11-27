'use client'

import { useEffect, useMemo, useState } from 'react'
import type { GameStyle } from '@/lib/types'
import BrainBreakGame from './BrainBreakGame'
import { GameCompleteContext } from './gameComplete'
import { levelsFor } from './gameLevels'

// Plays a game's level ladder: finish a level, then "Next level →". The
// device remembers the furthest level reached for each game, so the next
// session picks up there (any level can still be chosen).
const storageKey = (game: string, style: GameStyle) => `ocular-level-${game}-${style}`

export function savedLevel(game: string, style: GameStyle): number {
  try { return Math.max(0, parseInt(localStorage.getItem(storageKey(game, style)) ?? '0', 10) || 0) } catch { return 0 }
}

export default function LevelRunner({ game, style = 'playful', start }: { game: string; style?: GameStyle; start?: number }) {
  const levels = useMemo(() => levelsFor(game, style), [game, style])
  const [k, setK] = useState(() => Math.min(start ?? 0, Math.max(0, levels.length - 1)))
  const [done, setDone] = useState(false)
  const [round, setRound] = useState(0) // remounts the game for "Play again"

  useEffect(() => {
    if (!done) return
    try {
      const best = savedLevel(game, style)
      if (k + 1 > best) localStorage.setItem(storageKey(game, style), String(Math.min(k + 1, levels.length - 1)))
    } catch {}
  }, [done, k, game, style, levels.length])

  if (!levels.length) return <p className="text-center text-gray-500">No levels for this game yet.</p>
  const last = k === levels.length - 1

  function go(to: number) { setK(to); setDone(false); setRound(r => r + 1) }

  return (
    <div>
      <div className="flex items-center justify-center gap-1.5 flex-wrap mb-2">
        {levels.map((_, i) => (
          <button key={i} type="button" onClick={() => go(i)} title={`Level ${i + 1}`}
            className={`h-3 rounded-full transition-all ${i === k ? 'w-8 bg-purple-600' : i < k ? 'w-3 bg-purple-300' : 'w-3 bg-gray-200'}`} />
        ))}
      </div>
      <p className="text-center text-sm font-bold text-purple-700 mb-3">Level {k + 1} of {levels.length}</p>

      <GameCompleteContext.Provider value={() => setDone(true)}>
        <BrainBreakGame key={`${k}-${round}`} game={levels[k]} />
      </GameCompleteContext.Provider>

      {done && (
        <div className="text-center mt-4 space-y-2">
          <p className="text-2xl font-bold text-purple-700">⭐ Level {k + 1} complete!</p>
          <div className="flex justify-center gap-2">
            <button type="button" onClick={() => go(k)} className="px-4 py-2.5 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold">↻ Play again</button>
            {!last && <button type="button" onClick={() => go(k + 1)} className="px-5 py-2.5 rounded-xl bg-purple-600 text-white font-semibold">Next level →</button>}
          </div>
          {last && <p className="text-lg font-semibold text-green-600">🏆 You finished every level!</p>}
        </div>
      )}
    </div>
  )
}
