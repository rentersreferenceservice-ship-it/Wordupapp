'use client'

import { useMemo, useState } from 'react'
import type { EyeHandGame, GameSpeed, TargetSize } from '@/lib/types'

// Eye-hand (oculomotor) practice for spellers. Tap-only, no timers, no
// penalties: a wrong tap just gives a gentle shake. Size, speed and count
// are set by the practitioner on the Ocular Motor Games page.

const TARGET_PX: Record<TargetSize, number> = { small: 64, medium: 96, large: 136 }
const MOVE_SECONDS: Record<GameSpeed, number> = { slow: 3, medium: 2, fast: 1.2 }

function Done({ text }: { text: string }) {
  return <p className="text-center text-2xl font-bold text-green-600 mt-4">{text}</p>
}

function Progress({ done, total }: { done: number; total: number }) {
  return <p className="text-center text-gray-500 mb-2">{done} of {total}</p>
}

// Random spot (in %) that keeps a target of `px` fully inside the play area.
function randomSpot(px: number, avoid?: { x: number; y: number }): { x: number; y: number } {
  for (let i = 0; i < 20; i++) {
    const x = 8 + Math.random() * 84
    const y = 10 + Math.random() * 80
    if (!avoid || Math.hypot(x - avoid.x, y - avoid.y) > 30) return { x, y }
  }
  return { x: 50, y: 50 }
  void px
}

const area = 'relative w-full h-[62vh] min-h-[360px] rounded-2xl bg-sky-50 border-2 border-sky-100 overflow-hidden'

function Target({ x, y, px, emoji, onTap, glow, transitionSeconds, onArrive }: {
  x: number; y: number; px: number; emoji: string; onTap: () => void
  glow?: boolean; transitionSeconds?: number; onArrive?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onTap}
      onTransitionEnd={onArrive}
      aria-label="target"
      className={`absolute flex items-center justify-center rounded-full ${glow ? 'animate-pulse ring-8 ring-yellow-300' : ''}`}
      style={{
        left: `${x}%`, top: `${y}%`, width: px, height: px,
        transform: 'translate(-50%, -50%)', fontSize: px * 0.7,
        transition: transitionSeconds ? `left ${transitionSeconds}s ease-in-out, top ${transitionSeconds}s ease-in-out` : undefined,
      }}
    >
      {emoji}
    </button>
  )
}

// ── Pop the Bubbles: one at a time, each in a new spot ───────────────────
function Bubbles({ count, size }: { count: number; size: TargetSize }) {
  const px = TARGET_PX[size]
  const [n, setN] = useState(0)
  const [spot, setSpot] = useState(() => randomSpot(px))
  if (n >= count) return <Done text="🎉 All the bubbles popped!" />
  return (
    <div>
      <Progress done={n} total={count} />
      <div className={area}>
        <Target x={spot.x} y={spot.y} px={px} emoji="🫧" onTap={() => { setN(v => v + 1); setSpot(s => randomSpot(px, s)) }} />
      </div>
    </div>
  )
}

// ── Follow the Star: glides, stops and glows — tap it then ───────────────
function FollowStar({ count, size, speed }: { count: number; size: TargetSize; speed: GameSpeed }) {
  const px = TARGET_PX[size]
  const [n, setN] = useState(0)
  const [spot, setSpot] = useState({ x: 50, y: 50 })
  const [arrived, setArrived] = useState(true)
  function tap() {
    if (!arrived) return // still moving: just keep watching, no penalty
    setN(v => v + 1)
    setArrived(false)
    setSpot(s => randomSpot(px, s))
  }
  if (n >= count) return <Done text="🎉 Great eyes — you followed the star!" />
  return (
    <div>
      <Progress done={n} total={count} />
      <p className="text-center text-sm text-gray-400 mb-2">{arrived ? 'Tap the star!' : 'Watch the star…'}</p>
      <div className={area}>
        <Target x={spot.x} y={spot.y} px={px} emoji="⭐" glow={arrived} onTap={tap}
          transitionSeconds={MOVE_SECONDS[speed]} onArrive={() => setArrived(true)} />
      </div>
    </div>
  )
}

// ── Left–Right Jump: far left, far right, across the middle ──────────────
function LeftRight({ count, size }: { count: number; size: TargetSize }) {
  const px = TARGET_PX[size]
  const [n, setN] = useState(0)
  const [y, setY] = useState(50)
  const left = n % 2 === 0
  if (n >= count) return <Done text="🎉 Left, right — all done!" />
  return (
    <div>
      <Progress done={n} total={count} />
      <div className={area}>
        <Target x={left ? 9 : 91} y={y} px={px} emoji={left ? '🐸' : '🦋'}
          onTap={() => { setN(v => v + 1); setY(15 + Math.random() * 70) }} />
      </div>
    </div>
  )
}

// ── Connect the Dots: tap in order, 1→N or A→… ──────────────────────────
function Dots({ count, size, mode }: { count: number; size: TargetSize; mode: 'numbers' | 'letters' }) {
  const px = Math.round(TARGET_PX[size] * 0.75)
  const labels = useMemo(() => Array.from({ length: count }, (_, i) => (mode === 'letters' ? String.fromCharCode(65 + i) : String(i + 1))), [count, mode])
  const spots = useMemo(() => {
    const placed: { x: number; y: number }[] = []
    for (let i = 0; i < count; i++) {
      let best = { x: 50, y: 50 }, bestGap = -1
      for (let t = 0; t < 40; t++) { // keep dots apart
        const c = { x: 8 + Math.random() * 84, y: 10 + Math.random() * 80 }
        const gap = Math.min(999, ...placed.map(p => Math.hypot(p.x - c.x, p.y - c.y)))
        if (gap > bestGap) { best = c; bestGap = gap }
      }
      placed.push(best)
    }
    return placed
  }, [count])
  const [next, setNext] = useState(0)
  const [shake, setShake] = useState<number | null>(null)
  function tap(i: number) {
    if (i === next) setNext(v => v + 1)
    else if (i > next) { setShake(i); setTimeout(() => setShake(null), 500) }
  }
  return (
    <div>
      <p className="text-center text-gray-500 mb-2">{next < count ? <>Tap <b className="text-xl">{labels[next]}</b></> : ''}</p>
      <div className={area}>
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          {spots.slice(0, Math.max(0, next)).map((p, i) => i > 0 && (
            <line key={i} x1={spots[i - 1].x} y1={spots[i - 1].y} x2={p.x} y2={p.y} stroke="#2563eb" strokeWidth="0.8" vectorEffect="non-scaling-stroke" style={{ strokeWidth: 4 }} />
          ))}
        </svg>
        {spots.map((p, i) => (
          <button key={i} type="button" onClick={() => tap(i)}
            className={`absolute rounded-full border-4 font-bold flex items-center justify-center ${i < next ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-400 text-gray-800'} ${shake === i ? 'animate-bounce' : ''}`}
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: px, height: px, transform: 'translate(-50%, -50%)', fontSize: px * 0.42 }}>
            {labels[i]}
          </button>
        ))}
      </div>
      {next >= count && <Done text="🎉 You connected all the dots!" />}
    </div>
  )
}

// ── Find the Letter: on a letterboard-style layout ───────────────────────
const THREE_BOARDS = ['ABCDEFGH', 'IJKLMNOPQ', 'RSTUVWXYZ']
const ALPHA_ROWS = ['ABCDEFG', 'HIJKLMN', 'OPQRSTU', 'VWXYZ']
const KEY_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM']

function FindLetter({ count, board }: { count: number; board: 'three' | 'alphabet' | 'keyboard' }) {
  const letters = useMemo(() => Array.from({ length: count }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))), [count])
  const [n, setN] = useState(0)
  const [wrong, setWrong] = useState<string | null>(null)
  const [right, setRight] = useState<string | null>(null)
  if (n >= count) return <Done text="🎉 You found every letter!" />
  const target = letters[n]
  const rows = board === 'keyboard' ? KEY_ROWS : board === 'alphabet' ? ALPHA_ROWS : [THREE_BOARDS.find(b => b.includes(target))!]
  function tap(l: string) {
    if (right) return
    if (l === target) { setRight(l); setTimeout(() => { setRight(null); setN(v => v + 1) }, 500) }
    else { setWrong(l); setTimeout(() => setWrong(null), 500) }
  }
  return (
    <div>
      <Progress done={n} total={count} />
      <p className="text-center mb-4">Find <span className="inline-block text-6xl font-bold text-blue-700 align-middle ml-2">{target}</span></p>
      <div className="space-y-2">
        {rows.map(row => (
          <div key={row} className={`flex justify-center gap-2 ${board === 'three' ? 'flex-wrap max-w-md mx-auto' : ''}`}>
            {row.split('').map(l => (
              <button key={l} type="button" onClick={() => tap(l)}
                className={`rounded-xl border-2 font-bold flex items-center justify-center ${board === 'three' ? 'w-16 h-16 text-3xl' : 'w-9 h-12 sm:w-12 sm:h-14 text-xl sm:text-2xl'} ${
                  right === l ? 'bg-green-500 text-white border-green-500' : wrong === l ? 'bg-red-100 border-red-300' : 'bg-white border-gray-300'
                }`}>
                {l}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Card Match: all cards face up — find the two that are the same ───────
const CARD_FACES = ['🐶', '🐱', '🦊', '🐸', '🐵', '🦁', '🐷', '🐰', '🐻', '🐼', '🐢', '🐙', '🦋', '🐝', '🍎', '🍌', '🚗', '🚀']

function CardMatch({ pairs }: { pairs: number }) {
  const cards = useMemo(() => {
    const faces = CARD_FACES.slice(0, Math.min(pairs, CARD_FACES.length))
    const deck = [...faces, ...faces].map((f, i) => ({ f, id: i }))
    for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]] }
    return deck
  }, [pairs])
  const [picked, setPicked] = useState<number | null>(null)
  const [matched, setMatched] = useState<number[]>([])
  const [wrong, setWrong] = useState<number[]>([])
  const cols = cards.length <= 4 ? 2 : cards.length <= 12 ? 4 : 5

  function tap(id: number) {
    if (matched.includes(id) || wrong.length) return
    if (picked === null) { setPicked(id); return }
    if (picked === id) { setPicked(null); return }
    const a = cards.find(c => c.id === picked)!, b = cards.find(c => c.id === id)!
    if (a.f === b.f) { setMatched(m => [...m, a.id, b.id]); setPicked(null) }
    else { setWrong([picked, id]); setTimeout(() => { setWrong([]); setPicked(null) }, 600) }
  }

  return (
    <div>
      <p className="text-center text-gray-500 mb-3">Find the two cards that are the same, and tap them both.</p>
      <div className="grid gap-3 mx-auto max-w-xl" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {cards.map(c => (
          <button key={c.id} type="button" onClick={() => tap(c.id)} disabled={matched.includes(c.id)}
            className={`aspect-square rounded-2xl border-4 flex items-center justify-center ${cards.length <= 4 ? 'text-7xl' : 'text-5xl'} ${
              matched.includes(c.id) ? 'opacity-30 border-green-400 bg-green-50' : wrong.includes(c.id) ? 'border-red-400 bg-red-50' : picked === c.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
            }`}>
            {c.f}
          </button>
        ))}
      </div>
      {matched.length === cards.length && <Done text="🎉 All matched!" />}
    </div>
  )
}

export default function EyeHandGameView({ game }: { game: EyeHandGame }) {
  switch (game.type) {
    case 'bubbles': return <Bubbles count={game.count} size={game.size} />
    case 'followstar': return <FollowStar count={game.count} size={game.size} speed={game.speed} />
    case 'leftright': return <LeftRight count={game.count} size={game.size} />
    case 'dots': return <Dots count={game.count} size={game.size} mode={game.mode} />
    case 'findletter': return <FindLetter count={game.count} board={game.board} />
    case 'cardmatch': return <CardMatch pairs={game.pairs} />
  }
}
