'use client'

import { useState } from 'react'
import type { EyeHandGame, GameSpeed, TargetSize } from '@/lib/types'
import { BrainBreakOverlay } from '@/app/components/BrainBreakCard'
import { useTabletConnection } from '@/app/components/TabletConnectionProvider'

type GameKey = EyeHandGame['type']

const GAMES: { key: GameKey; emoji: string; name: string; skill: string; how: string }[] = [
  { key: 'cardmatch', emoji: '🃏', name: 'Card Match', skill: 'Visual scanning', how: 'All cards face up — find the two that are the same and tap them both.' },
  { key: 'bubbles', emoji: '🫧', name: 'Pop the Bubbles', skill: 'Quick eye jumps', how: 'One bubble at a time appears in a new spot. Tap it to pop it.' },
  { key: 'followstar', emoji: '⭐', name: 'Follow the Star', skill: 'Smooth tracking', how: 'The star glides across the screen. When it stops and glows, tap it.' },
  { key: 'leftright', emoji: '↔️', name: 'Left–Right Jump', skill: 'Crossing the midline', how: 'Targets jump between the far left and far right. Tap each one.' },
  { key: 'dots', emoji: '🔢', name: 'Connect the Dots', skill: 'Scanning & sequencing', how: 'Tap the dots in order — 1, 2, 3… or A, B, C…' },
  { key: 'findletter', emoji: '🔤', name: 'Find the Letter', skill: 'Letterboard scanning', how: 'A letter appears — find and tap it on the board.' },
]

function Choice<T extends string | number>({ label, value, options, onChange }: {
  label: string; value: T; options: { v: T; label: string }[]; onChange: (v: T) => void
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-semibold text-gray-500 w-14">{label}</span>
      {options.map(o => (
        <button key={String(o.v)} type="button" onClick={() => onChange(o.v)}
          className={`px-2.5 py-1 rounded-lg text-xs border-2 ${value === o.v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-700'}`}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

const SIZES: { v: TargetSize; label: string }[] = [{ v: 'large', label: 'Large' }, { v: 'medium', label: 'Medium' }, { v: 'small', label: 'Small' }]
const SPEEDS: { v: GameSpeed; label: string }[] = [{ v: 'slow', label: 'Slow' }, { v: 'medium', label: 'Medium' }, { v: 'fast', label: 'Fast' }]

function GameRow({ meta }: { meta: typeof GAMES[number] }) {
  const tablet = useTabletConnection()
  const [size, setSize] = useState<TargetSize>('large')
  const [speed, setSpeed] = useState<GameSpeed>('slow')
  const [count, setCount] = useState(10)
  const [pairs, setPairs] = useState(2)
  const [mode, setMode] = useState<'numbers' | 'letters'>('numbers')
  const [board, setBoard] = useState<'three' | 'alphabet' | 'keyboard'>('three')
  const [playing, setPlaying] = useState<EyeHandGame | null>(null)
  const [sent, setSent] = useState(false)

  function build(): EyeHandGame {
    switch (meta.key) {
      case 'cardmatch': return { type: 'cardmatch', pairs }
      case 'bubbles': return { type: 'bubbles', count, size }
      case 'followstar': return { type: 'followstar', count, size, speed }
      case 'leftright': return { type: 'leftright', count, size }
      case 'dots': return { type: 'dots', count, size, mode }
      case 'findletter': return { type: 'findletter', count, board }
    }
  }

  const counts = meta.key === 'dots' ? [5, 8, 10, 15] : [5, 10, 15, 20]

  return (
    <div className="border border-gray-200 rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="font-bold text-gray-900">{meta.emoji} {meta.name} <span className="ml-1 text-xs font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">{meta.skill}</span></p>
          <p className="text-sm text-gray-500 mt-0.5">{meta.how}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setPlaying(build())} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700">▶ Play here</button>
          {tablet.code && (
            <button type="button" onClick={() => { tablet.sendGame(build()); setSent(true); setTimeout(() => setSent(false), 1500) }}
              className="bg-white text-purple-700 border-2 border-purple-300 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-50">
              {sent ? '✓ Sent' : '📲 Send to tablet'}
            </button>
          )}
        </div>
      </div>
      <div className="space-y-2">
        {meta.key === 'cardmatch' && (
          <Choice label="Cards" value={pairs} onChange={setPairs}
            options={[2, 3, 4, 6, 8, 10].map(p => ({ v: p, label: `${p * 2}${p === 2 ? ' (ages 6–8 start)' : ''}` }))} />
        )}
        {['bubbles', 'followstar', 'leftright', 'dots'].includes(meta.key) && <Choice label="Size" value={size} onChange={setSize} options={SIZES} />}
        {meta.key === 'followstar' && <Choice label="Speed" value={speed} onChange={setSpeed} options={SPEEDS} />}
        {meta.key === 'dots' && <Choice label="Use" value={mode} onChange={setMode} options={[{ v: 'numbers', label: '1, 2, 3' }, { v: 'letters', label: 'A, B, C' }]} />}
        {meta.key === 'findletter' && <Choice label="Board" value={board} onChange={setBoard} options={[{ v: 'three', label: '3-board' }, { v: 'alphabet', label: '26-board' }, { v: 'keyboard', label: 'Keyboard' }]} />}
        {meta.key !== 'cardmatch' && <Choice label={meta.key === 'dots' ? 'Dots' : 'Turns'} value={count} onChange={setCount} options={counts.map(c => ({ v: c, label: String(c) }))} />}
      </div>
      {playing && <BrainBreakOverlay game={playing} onClose={() => setPlaying(null)} />}
    </div>
  )
}

export default function OcularMotorLibrary() {
  return (
    <div className="space-y-3">
      {GAMES.map(g => <GameRow key={g.key} meta={g} />)}
    </div>
  )
}
