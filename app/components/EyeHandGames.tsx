'use client'

import { useMemo, useRef, useState } from 'react'
import type { EyeHandGame, GameSpeed, GameStyle, PuzzleLevel, PuzzleScene, TargetSize } from '@/lib/types'

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
// Short soft "pop" — auditory feedback (the A in VAKT). Silently skipped if
// the browser has no audio.
function playPop() {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AC()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.setValueAtTime(700, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.12)
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.16)
    osc.onended = () => ctx.close()
  } catch {}
}

function Bubbles({ count, size, style }: { count: number; size: TargetSize; style?: GameStyle }) {
  const px = TARGET_PX[size]
  const [n, setN] = useState(0)
  const [spot, setSpot] = useState(() => randomSpot(px))
  const [popping, setPopping] = useState(false)

  // Burst first (💥 grows and fades, with a pop sound), then the next bubble.
  function pop() {
    if (popping) return
    setPopping(true)
    playPop()
    setTimeout(() => {
      setPopping(false)
      setN(v => v + 1)
      setSpot(s => randomSpot(px, s))
    }, 380)
  }

  if (n >= count) return <Done text="🎉 All the bubbles popped!" />
  return (
    <div>
      <Progress done={n} total={count} />
      <div className={area}>
        <button
          key={n}
          type="button"
          onClick={pop}
          aria-label="bubble"
          className="absolute flex items-center justify-center rounded-full transition-all duration-300 ease-out"
          style={{
            left: `${spot.x}%`, top: `${spot.y}%`, width: px, height: px, fontSize: px * 0.7,
            transform: `translate(-50%, -50%) scale(${popping ? 1.8 : 1})`,
            opacity: popping ? 0 : 1,
          }}
        >
          {popping ? (style === 'grownup' ? '✳️' : '💥') : (style === 'grownup' ? '🔵' : '🫧')}
        </button>
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
function LeftRight({ count, size, style }: { count: number; size: TargetSize; style?: GameStyle }) {
  const px = TARGET_PX[size]
  const [n, setN] = useState(0)
  const [y, setY] = useState(50)
  const left = n % 2 === 0
  if (n >= count) return <Done text="🎉 Left, right — all done!" />
  return (
    <div>
      <Progress done={n} total={count} />
      <div className={area}>
        <Target x={left ? 9 : 91} y={y} px={px} emoji={style === 'grownup' ? (left ? '🔵' : '🟠') : (left ? '🐸' : '🦋')}
          onTap={() => { setN(v => v + 1); setY(15 + Math.random() * 70) }} />
      </div>
    </div>
  )
}

// ── Connect the Dots: tap in order, 1→N or A→… ──────────────────────────
function Dots({ count, size, mode }: { count: number; size: TargetSize; mode: 'numbers' | 'letters' | 'alternating' }) {
  const px = Math.round(TARGET_PX[size] * 0.75)
  // 'alternating' is a number–letter trail: 1, A, 2, B, 3, C…
  const labels = useMemo(() => Array.from({ length: count }, (_, i) =>
    mode === 'letters' ? String.fromCharCode(65 + i)
      : mode === 'alternating' ? (i % 2 === 0 ? String(i / 2 + 1) : String.fromCharCode(65 + (i - 1) / 2))
        : String(i + 1)), [count, mode])
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

const CARD_FACES_GROWNUP = ['♠️', '♥️', '♦️', '♣️', '⭐', '🔺', '🟦', '🟢', '🟣', '🔶', '⚫', '✳️', '➕', '🌙', '☀️', '⚡', '🎵', '❄️']

function CardMatch({ pairs, style }: { pairs: number; style?: GameStyle }) {
  const cards = useMemo(() => {
    const set = style === 'grownup' ? CARD_FACES_GROWNUP : CARD_FACES
    const faces = set.slice(0, Math.min(pairs, set.length))
    const deck = [...faces, ...faces].map((f, i) => ({ f, id: i }))
    for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]] }
    return deck
  }, [pairs, style])
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

// ── Star Maze: guide the star to the flag ────────────────────────────────
// A new maze every time (depth-first "recursive backtracker", so there is
// exactly one route). Slide mode: hold the star and slide it; slipping off
// just leaves it where it is, and walls simply stop it. Tap mode: tap the
// next open square beside the star, one step at a time.
type Walls = { n: boolean; e: boolean; s: boolean; w: boolean }

function buildMaze(n: number): Walls[][] {
  const walls: Walls[][] = Array.from({ length: n }, () => Array.from({ length: n }, () => ({ n: true, e: true, s: true, w: true })))
  const seen = Array.from({ length: n }, () => Array(n).fill(false))
  const stack: [number, number][] = [[0, 0]]
  seen[0][0] = true
  while (stack.length) {
    const [r, c] = stack[stack.length - 1]
    const options = ([[r - 1, c, 'n', 's'], [r, c + 1, 'e', 'w'], [r + 1, c, 's', 'n'], [r, c - 1, 'w', 'e']] as const)
      .filter(([y, x]) => y >= 0 && x >= 0 && y < n && x < n && !seen[y][x])
    if (!options.length) { stack.pop(); continue }
    const [y, x, side, back] = options[Math.floor(Math.random() * options.length)]
    walls[r][c][side] = false
    walls[y][x][back] = false
    seen[y][x] = true
    stack.push([y, x])
  }
  return walls
}

function canStep(walls: Walls[][], [r, c]: [number, number], [y, x]: [number, number]): boolean {
  if (y === r - 1 && x === c) return !walls[r][c].n
  if (y === r + 1 && x === c) return !walls[r][c].s
  if (y === r && x === c + 1) return !walls[r][c].e
  if (y === r && x === c - 1) return !walls[r][c].w
  return false
}

function StarMaze({ cells, mode, style }: { cells: number; mode: 'slide' | 'tap'; style?: GameStyle }) {
  const [round, setRound] = useState(0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const walls = useMemo(() => buildMaze(cells), [cells, round])
  const [pos, setPos] = useState<[number, number]>([0, 0])
  const [trail, setTrail] = useState<string[]>(['0,0'])
  const [dragging, setDragging] = useState(false)
  const done = pos[0] === cells - 1 && pos[1] === cells - 1
  const star = style === 'grownup' ? '🔵' : '⭐'

  // Step one square at a time toward the finger, stopping at walls.
  function moveToward(target: [number, number]) {
    let p = pos
    const visited: string[] = []
    for (let i = 0; i < cells * 2; i++) {
      if (p[0] === target[0] && p[1] === target[1]) break
      const dy = Math.sign(target[0] - p[0]), dx = Math.sign(target[1] - p[1])
      const tries: [number, number][] = Math.abs(target[0] - p[0]) >= Math.abs(target[1] - p[1])
        ? [[p[0] + dy, p[1]], [p[0], p[1] + dx]] : [[p[0], p[1] + dx], [p[0] + dy, p[1]]]
      const next = tries.find(t => (t[0] !== p[0] || t[1] !== p[1]) && canStep(walls, p, t))
      if (!next) break
      p = next
      visited.push(`${p[0]},${p[1]}`)
    }
    if (visited.length) {
      setPos(p)
      setTrail(tr => [...tr, ...visited.filter(k => !tr.includes(k))])
    }
  }

  function cellFromPoint(e: React.PointerEvent<HTMLDivElement>): [number, number] {
    const rect = e.currentTarget.getBoundingClientRect()
    const c = Math.min(cells - 1, Math.max(0, Math.floor(((e.clientX - rect.left) / rect.width) * cells)))
    const r = Math.min(cells - 1, Math.max(0, Math.floor(((e.clientY - rect.top) / rect.height) * cells)))
    return [r, c]
  }

  function newMaze() { setRound(v => v + 1); setPos([0, 0]); setTrail(['0,0']) }

  const wallColor = '#1f2937'
  const wall = `3px solid ${wallColor}`
  return (
    <div>
      <p className="text-center text-gray-500 mb-3">
        {mode === 'slide' ? `Hold the ${star} and slide it to the 🏁.` : `Tap the square next to the ${star} to move it. Find the way to the 🏁.`}
      </p>
      <div
        className="grid mx-auto w-full max-w-[min(90vw,520px)] aspect-square bg-white select-none"
        style={{ gridTemplateColumns: `repeat(${cells}, 1fr)`, touchAction: 'none', border: `4px solid ${wallColor}` }}
        onPointerDown={e => {
          if (done) return
          const [r, c] = cellFromPoint(e)
          if (mode === 'slide') {
            if (r === pos[0] && c === pos[1]) { setDragging(true); e.currentTarget.setPointerCapture(e.pointerId) }
          } else if (canStep(walls, pos, [r, c])) {
            setPos([r, c])
            setTrail(tr => (tr.includes(`${r},${c}`) ? tr : [...tr, `${r},${c}`]))
          }
        }}
        onPointerMove={e => { if (dragging && !done) moveToward(cellFromPoint(e)) }}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
      >
        {walls.flatMap((row, r) => row.map((w, c) => {
          const here = pos[0] === r && pos[1] === c
          const goal = r === cells - 1 && c === cells - 1
          return (
            <div key={`${r},${c}`} className={`flex items-center justify-center ${trail.includes(`${r},${c}`) ? 'bg-yellow-100' : ''}`}
              style={{
                borderTop: w.n ? wall : undefined, borderBottom: w.s ? wall : undefined,
                borderLeft: w.w ? wall : undefined, borderRight: w.e ? wall : undefined,
                fontSize: `min(${Math.round(60 / cells)}vw, ${Math.round(300 / cells)}px)`,
              }}>
              {here ? <span className={dragging ? 'inline-block scale-125 transition-transform' : ''}>{star}</span> : goal ? '🏁' : ''}
            </div>
          )
        }))}
      </div>
      {done && (
        <div className="text-center">
          <Done text="🎉 You made it through the maze!" />
          <button type="button" onClick={newMaze} className="mt-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold">New maze</button>
        </div>
      )}
    </div>
  )
}

// ── Number Grid (Schulte table): tap 1→N in order ────────────────────────
function NumberGrid({ grid, mode }: { grid: number; mode: 'numbers' | 'letters' }) {
  const total = grid * grid
  const labels = useMemo(() => Array.from({ length: total }, (_, i) => (mode === 'letters' ? String.fromCharCode(65 + i) : String(i + 1))), [total, mode])
  const order = useMemo(() => {
    const a = labels.map((_, i) => i)
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
    return a
  }, [labels])
  const [next, setNext] = useState(0)
  const [shake, setShake] = useState<number | null>(null)
  function tap(i: number) {
    if (i === next) setNext(v => v + 1)
    else if (i > next) { setShake(i); setTimeout(() => setShake(null), 500) }
  }
  return (
    <div>
      <p className="text-center text-gray-500 mb-3">{next < total ? <>Tap them in order. Next: <b className="text-2xl text-blue-700">{labels[next]}</b></> : ''}</p>
      <div className="grid gap-2 mx-auto w-full max-w-[min(90vw,520px)]" style={{ gridTemplateColumns: `repeat(${grid}, minmax(0, 1fr))` }}>
        {order.map(i => (
          <button key={i} type="button" onClick={() => tap(i)}
            className={`aspect-square rounded-xl border-2 font-bold flex items-center justify-center ${grid > 5 ? 'text-xl' : 'text-3xl'} ${
              i < next ? 'bg-gray-100 text-gray-300 border-gray-200' : shake === i ? 'bg-red-50 border-red-300' : 'bg-white border-gray-300 text-gray-900'
            }`}>
            {labels[i]}
          </button>
        ))}
      </div>
      {next >= total && <Done text="🎉 All in order!" />}
    </div>
  )
}

// ── Odd One Out: one symbol is different — find it ───────────────────────
const ODD_PLAYFUL: [string, string][] = [['🐶', '🐱'], ['🍎', '🍏'], ['🚗', '🚕'], ['🐟', '🐠'], ['⭐', '🌟'], ['🌸', '🌼'], ['🐻', '🐼'], ['🍩', '🍪']]
const ODD_GROWNUP: [string, string][] = [['O', 'Q'], ['b', 'd'], ['p', 'q'], ['E', 'F'], ['M', 'N'], ['6', '9'], ['C', 'G'], ['u', 'v'], ['8', 'B']]

function OddOneOut({ grid, rounds, style }: { grid: number; rounds: number; style?: GameStyle }) {
  const [round, setRound] = useState(0)
  const [wrong, setWrong] = useState<number | null>(null)
  const [found, setFound] = useState(false)
  const puzzle = useMemo(() => {
    const pairs = style === 'grownup' ? ODD_GROWNUP : ODD_PLAYFUL
    const [same, odd] = pairs[Math.floor(Math.random() * pairs.length)]
    return { same, odd, at: Math.floor(Math.random() * grid * grid) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, grid, style])
  if (round >= rounds) return <Done text="🎉 Sharp eyes!" />
  function tap(i: number) {
    if (found) return
    if (i === puzzle.at) { setFound(true); setTimeout(() => { setFound(false); setRound(v => v + 1) }, 600) }
    else { setWrong(i); setTimeout(() => setWrong(null), 500) }
  }
  return (
    <div>
      <Progress done={round} total={rounds} />
      <p className="text-center text-gray-500 mb-3">One of these is different. Find it!</p>
      <div className="grid gap-1.5 mx-auto w-full max-w-[min(90vw,520px)]" style={{ gridTemplateColumns: `repeat(${grid}, minmax(0, 1fr))` }}>
        {Array.from({ length: grid * grid }, (_, i) => (
          <button key={`${round}-${i}`} type="button" onClick={() => tap(i)}
            className={`aspect-square rounded-lg border-2 flex items-center justify-center font-semibold ${grid > 6 ? 'text-xl' : 'text-3xl'} ${
              found && i === puzzle.at ? 'bg-green-200 border-green-500' : wrong === i ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200'
            }`}>
            {i === puzzle.at ? puzzle.odd : puzzle.same}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Cup Shuffle: watch the cup with the ball as the cups swap ────────────
const SWAP_SECONDS: Record<GameSpeed, number> = { slow: 1.4, medium: 0.9, fast: 0.6 }

function CupShuffle({ cups, swaps, speed, rounds, style }: { cups: number; swaps: number; speed: GameSpeed; rounds: number; style?: GameStyle }) {
  const [round, setRound] = useState(0)
  // slotOf[cupId] = which slot (left→right) that cup is in. Cup 0 has the ball.
  const [slotOf, setSlotOf] = useState<number[]>(() => Array.from({ length: cups }, (_, i) => i))
  const [phase, setPhase] = useState<'show' | 'shuffle' | 'guess' | 'reveal'>('show')
  const [picked, setPicked] = useState<number | null>(null)
  const ball = style === 'grownup' ? '⚪' : '⚽'
  const sec = SWAP_SECONDS[speed]

  function start() {
    setPhase('shuffle')
    let i = 0
    const step = () => {
      if (i >= swaps) { setPhase('guess'); return }
      setSlotOf(prev => {
        const a = Math.floor(Math.random() * cups)
        let b = Math.floor(Math.random() * (cups - 1)); if (b >= a) b++
        const next = [...prev]
        const ca = next.indexOf(a), cb = next.indexOf(b)
        next[ca] = b; next[cb] = a
        return next
      })
      i++
      setTimeout(step, sec * 1000 + 150)
    }
    setTimeout(step, 400)
  }

  function guess(cupId: number) {
    if (phase !== 'guess') return
    setPicked(cupId)
    setPhase('reveal')
  }

  function nextRound() {
    setRound(r => r + 1); setPhase('show'); setPicked(null)
    setSlotOf(Array.from({ length: cups }, (_, i) => i))
  }

  if (round >= rounds) return <Done text="🎉 Great tracking!" />
  const width = 100 / cups
  return (
    <div>
      <Progress done={round} total={rounds} />
      <p className="text-center text-gray-500 mb-3">
        {phase === 'show' ? `The ${ball} is under this cup. Watch it!` : phase === 'shuffle' ? 'Keep your eyes on the cup…' : phase === 'guess' ? `Where is the ${ball}? Tap that cup.` : picked === 0 ? '🎉 You found it!' : `Here it was! Nice try.`}
      </p>
      <div className="relative w-full max-w-xl mx-auto h-56">
        {Array.from({ length: cups }, (_, id) => {
          const lifted = phase === 'show' ? id === 0 : phase === 'reveal' ? id === 0 || id === picked : false
          return (
            <button key={id} type="button" onClick={() => guess(id)} aria-label="cup"
              className="absolute bottom-6 flex flex-col items-center"
              style={{ left: `${slotOf[id] * width + width / 2}%`, transform: 'translateX(-50%)', transition: `left ${sec}s ease-in-out`, width: `${Math.min(width * 0.8, 28)}%` }}>
              {/* Cup sits on top of the ball (z-10) so the ball only shows when it's lifted */}
              <div className="relative z-10 w-full transition-transform duration-300" style={{ transform: lifted ? 'translateY(-70px)' : 'none' }}>
                <div className={`w-full aspect-[4/5] rounded-t-[40%] rounded-b-lg border-4 ${style === 'grownup' ? 'bg-slate-500 border-slate-700' : 'bg-red-500 border-red-700'}`} />
              </div>
              <span className={`absolute bottom-0 z-0 text-4xl ${id === 0 ? '' : 'invisible'}`}>{ball}</span>
            </button>
          )
        })}
      </div>
      <div className="text-center">
        {phase === 'show' && <button type="button" onClick={start} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold">Start shuffling</button>}
        {phase === 'reveal' && <button type="button" onClick={nextRound} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold">Next round</button>}
      </div>
    </div>
  )
}

// ── Find Them All: tap every target hidden among other symbols ───────────
const FIND_SETS: Record<GameStyle, { target: string; others: string[] }[]> = {
  playful: [{ target: '⭐', others: ['🔺', '🟦', '🟢', '🟣', '🔶'] }, { target: '🐸', others: ['🐢', '🐍', '🦎', '🐊'] }, { target: '🍎', others: ['🍅', '🍒', '🍓', '🌶️'] }],
  grownup: [{ target: 'E', others: ['F', 'P', 'B', 'R', 'H'] }, { target: 'b', others: ['d', 'p', 'q', 'h'] }, { target: '7', others: ['1', '4', 'T', 'L'] }],
}

function FindAll({ grid, targets, style }: { grid: number; targets: number; style?: GameStyle }) {
  const board = useMemo(() => {
    const sets = FIND_SETS[style ?? 'playful']
    const set = sets[Math.floor(Math.random() * sets.length)]
    const total = grid * grid
    const spots = new Set<number>()
    while (spots.size < Math.min(targets, total - 1)) spots.add(Math.floor(Math.random() * total))
    return { set, cells: Array.from({ length: total }, (_, i) => (spots.has(i) ? set.target : set.others[Math.floor(Math.random() * set.others.length)])), count: spots.size }
  }, [grid, targets, style])
  const [found, setFound] = useState<number[]>([])
  const [wrong, setWrong] = useState<number | null>(null)
  function tap(i: number) {
    if (found.includes(i)) return
    if (board.cells[i] === board.set.target) setFound(f => [...f, i])
    else { setWrong(i); setTimeout(() => setWrong(null), 500) }
  }
  const left = board.count - found.length
  return (
    <div>
      <p className="text-center mb-3 text-gray-600">Find every <span className="text-3xl font-bold align-middle mx-1">{board.set.target}</span> {left > 0 ? `— ${left} left` : ''}</p>
      <div className="grid gap-1 mx-auto w-full max-w-[min(90vw,520px)]" style={{ gridTemplateColumns: `repeat(${grid}, minmax(0, 1fr))` }}>
        {board.cells.map((sym, i) => (
          <button key={i} type="button" onClick={() => tap(i)}
            className={`aspect-square rounded-lg border-2 flex items-center justify-center font-semibold ${grid > 7 ? 'text-lg' : 'text-2xl'} ${
              found.includes(i) ? 'bg-green-200 border-green-500' : wrong === i ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200'
            }`}>
            {sym}
          </button>
        ))}
      </div>
      {left === 0 && <Done text="🎉 You found them all!" />}
    </div>
  )
}

// ── Copy the Pattern: remember the lit squares, then tap them ────────────
function CopyPattern({ grid, squares, rounds }: { grid: number; squares: number; rounds: number }) {
  const [round, setRound] = useState(0)
  const pattern = useMemo(() => {
    const total = grid * grid
    const s = new Set<number>()
    while (s.size < Math.min(squares, total - 1)) s.add(Math.floor(Math.random() * total))
    return s
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, squares, round])
  const [phase, setPhase] = useState<'look' | 'tap'>('look')
  const [hits, setHits] = useState<number[]>([])
  const [miss, setMiss] = useState<number | null>(null)
  const complete = hits.length === pattern.size

  function tap(i: number) {
    if (phase !== 'tap' || hits.includes(i) || complete) return
    if (pattern.has(i)) {
      const next = [...hits, i]
      setHits(next)
      if (next.length === pattern.size) setTimeout(() => { setRound(r => r + 1); setPhase('look'); setHits([]) }, 800)
    } else { setMiss(i); setTimeout(() => setMiss(null), 500) }
  }

  if (round >= rounds) return <Done text="🎉 Great memory!" />
  return (
    <div>
      <Progress done={round} total={rounds} />
      <p className="text-center text-gray-500 mb-3">{phase === 'look' ? 'Look at the blue squares. Tap “I’m ready” when you remember them.' : 'Now tap the squares that were blue.'}</p>
      <div className="grid gap-2 mx-auto w-full max-w-[min(80vw,420px)]" style={{ gridTemplateColumns: `repeat(${grid}, minmax(0, 1fr))` }}>
        {Array.from({ length: grid * grid }, (_, i) => (
          <button key={`${round}-${i}`} type="button" onClick={() => tap(i)}
            className={`aspect-square rounded-xl border-2 ${
              phase === 'look' && pattern.has(i) ? 'bg-blue-500 border-blue-600'
                : hits.includes(i) ? 'bg-green-400 border-green-500'
                  : miss === i ? 'bg-red-100 border-red-300' : 'bg-white border-gray-300'
            }`} />
        ))}
      </div>
      {phase === 'look' && (
        <div className="text-center mt-4">
          <button type="button" onClick={() => setPhase('tap')} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold">I’m ready</button>
        </div>
      )}
    </div>
  )
}

// ── Spot the Difference: two grids, one picture changed ──────────────────
const SPOT_SETS: Record<GameStyle, string[]> = {
  playful: ['🐶', '🐱', '🐸', '🐵', '🦁', '🐷', '🐰', '🐻', '🍎', '🍌', '🚗', '⭐', '🌸', '🐟'],
  grownup: ['♠️', '♥️', '♦️', '♣️', '⭐', '🔺', '🟦', '🟢', '🟣', '🔶', '⚫', '🌙', '☀️', '⚡'],
}

function SpotDiff({ grid, rounds, style }: { grid: number; rounds: number; style?: GameStyle }) {
  const [round, setRound] = useState(0)
  const puzzle = useMemo(() => {
    const set = SPOT_SETS[style ?? 'playful']
    const left = Array.from({ length: grid * grid }, () => set[Math.floor(Math.random() * set.length)])
    const at = Math.floor(Math.random() * left.length)
    const right = [...left]
    let swap = set[Math.floor(Math.random() * set.length)]
    while (swap === left[at]) swap = set[Math.floor(Math.random() * set.length)]
    right[at] = swap
    return { left, right, at }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, style, round])
  const [found, setFound] = useState(false)
  const [wrong, setWrong] = useState<string | null>(null)
  function tap(side: string, i: number) {
    if (found) return
    if (i === puzzle.at) { setFound(true); setTimeout(() => { setFound(false); setRound(r => r + 1) }, 900) }
    else { setWrong(`${side}${i}`); setTimeout(() => setWrong(null), 500) }
  }
  if (round >= rounds) return <Done text="🎉 Eagle eyes!" />
  const panel = (side: string, cells: string[]) => (
    <div className="grid gap-1 w-full" style={{ gridTemplateColumns: `repeat(${grid}, minmax(0, 1fr))` }}>
      {cells.map((sym, i) => (
        <button key={`${round}-${side}-${i}`} type="button" onClick={() => tap(side, i)}
          className={`aspect-square rounded-md border flex items-center justify-center ${grid > 4 ? 'text-lg' : 'text-2xl sm:text-3xl'} ${
            found && i === puzzle.at ? 'bg-green-200 border-green-500' : wrong === `${side}${i}` ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200'
          }`}>
          {sym}
        </button>
      ))}
    </div>
  )
  return (
    <div>
      <Progress done={round} total={rounds} />
      <p className="text-center text-gray-500 mb-3">One picture is different on the right. Find it and tap it.</p>
      <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
        {panel('L', puzzle.left)}
        {panel('R', puzzle.right)}
      </div>
    </div>
  )
}

// ── Reach & Poke: practice the real letterboard reach ────────────────────
// A letter on a letterboard-style layout lights up; reach and poke it with
// the pointer finger. The next letter is always far from the last one, so
// every poke is a real reach (often across the middle).
const REACH_LAYOUTS: Record<'three' | 'alphabet' | 'keyboard', string[]> = {
  three: ['ABC', 'DEF', 'GHI'],
  alphabet: ['ABCDEFG', 'HIJKLMN', 'OPQRSTU', 'VWXYZ'],
  keyboard: ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'],
}

function ReachPoke({ layout, count }: { layout: 'three' | 'alphabet' | 'keyboard'; count: number }) {
  const rows = REACH_LAYOUTS[layout]
  const cells = useMemo(() => rows.flatMap((row, r) => row.split('').map((l, c) => ({ l, r, c }))), [rows])
  const pickFar = (prev?: { r: number; c: number }) => {
    if (!prev) return cells[Math.floor(Math.random() * cells.length)]
    const far = cells.filter(x => Math.hypot(x.r - prev.r, (x.c - prev.c) / 1.5) >= (layout === 'three' ? 1.5 : 2.5))
    const pool = far.length ? far : cells
    return pool[Math.floor(Math.random() * pool.length)]
  }
  const [n, setN] = useState(0)
  const [target, setTarget] = useState(() => pickFar())
  const [hit, setHit] = useState(false)
  const [miss, setMiss] = useState<string | null>(null)

  function poke(l: string) {
    if (hit) return
    if (l === target.l) {
      setHit(true)
      setTimeout(() => { setHit(false); setN(v => v + 1); setTarget(t => pickFar(t)) }, 450)
    } else { setMiss(l); setTimeout(() => setMiss(null), 400) }
  }

  if (n >= count) return <Done text="🎉 Great reaching!" />
  const big = layout === 'three'
  return (
    <div>
      <Progress done={n} total={count} />
      <p className="text-center text-gray-500 mb-4">Make a pointer finger ☝️ and poke the glowing letter. Bring your hand back between pokes.</p>
      <div className="space-y-2 select-none">
        {rows.map(row => (
          <div key={row} className="flex justify-center gap-2">
            {row.split('').map(l => {
              const isTarget = l === target.l
              return (
                <button key={l} type="button" onClick={() => poke(l)}
                  className={`rounded-xl border-4 font-bold flex items-center justify-center transition-colors ${big ? 'w-24 h-24 text-5xl' : 'w-10 h-14 sm:w-14 sm:h-16 text-2xl'} ${
                    isTarget && hit ? 'bg-green-500 text-white border-green-600'
                      : isTarget ? 'bg-yellow-300 border-yellow-500 animate-pulse'
                        : miss === l ? 'bg-red-50 border-red-300' : 'bg-white border-gray-300 text-gray-700'
                  }`}>
                  {l}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Picture Puzzle: rebuild a bright cartoon picture, level by level ────
// Each level is a picture (a cartoon emoji scene — or a photo for older
// puzzles) cut into grid×grid pieces, with more pieces each level. Drag a
// piece to its spot, or tap a piece then its spot; pieces only snap into
// their own spot (a wrong spot wiggles it back).

// Puzzle pictures are ONE big emoji filling the board over colored stripes
// (one color per row), so every tile has a clear part of the picture and a
// color cue. Sparse scenes left most tiles blank sky — too hard for spellers
// working on motor planning.
const PUZZLE_STRIPES: string[][] = [
  ['#fde68a', '#fca5a5', '#93c5fd'],
  ['#bbf7d0', '#fde68a', '#f9a8d4'],
  ['#c7d2fe', '#a7f3d0', '#fed7aa'],
  ['#fecaca', '#bfdbfe', '#d9f99d'],
]

export function simpleScene(emoji: string, i = 0): PuzzleScene {
  const [a, b, c] = PUZZLE_STRIPES[i % PUZZLE_STRIPES.length]
  return { bg: `linear-gradient(${a} 0 33.4%, ${b} 33.4% 66.7%, ${c} 66.7% 100%)`, items: [{ e: emoji, x: 50, y: 52, s: 86 }] }
}

/** Picture sets for the Ocular Motor Games page — three pictures each, one per level. */
export const PUZZLE_SETS: { label: string; emoji: string[] }[] = [
  { label: '🐶 Animals', emoji: ['🐶', '🦁', '🐢'] },
  { label: '🚒 Vehicles', emoji: ['🚒', '🚌', '🚀'] },
  { label: '🌻 Nature', emoji: ['🌻', '🦋', '🌈'] },
  { label: '🍎 Food', emoji: ['🍎', '🍕', '🍦'] },
  { label: '⛄ Seasons', emoji: ['⛄', '🎃', '🌷'] },
]

// A cartoon scene that fills its box; emoji sizes scale with the box.
function SceneView({ scene }: { scene: PuzzleScene }) {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: scene.bg, containerType: 'size' } as React.CSSProperties}>
      {scene.items.map((it, i) => (
        <span key={i} className="absolute leading-none" style={{ left: `${it.x}%`, top: `${it.y}%`, transform: 'translate(-50%, -50%)', fontSize: `${it.s}cqmin` }}>{it.e}</span>
      ))}
    </div>
  )
}

// One piece: a window onto the full picture, offset to its row and column.
function PuzzlePiece({ level, piece }: { level: PuzzleLevel; piece: number }) {
  const g = level.grid, col = piece % g, row = Math.floor(piece / g)
  if (level.imageUrl) {
    return <div className="absolute inset-0" style={{ backgroundImage: `url("${level.imageUrl}")`, backgroundSize: `${g * 100}% ${g * 100}%`, backgroundPosition: `${col * (100 / (g - 1))}% ${row * (100 / (g - 1))}%` }} />
  }
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute" style={{ width: `${g * 100}%`, height: `${g * 100}%`, left: `${-col * 100}%`, top: `${-row * 100}%` }}>
        {level.scene && <SceneView scene={level.scene} />}
      </div>
    </div>
  )
}

function PuzzleLevelView({ level, ghost, onDone }: { level: PuzzleLevel; ghost?: boolean; onDone: () => void }) {
  const grid = level.grid, total = grid * grid
  const tray = useMemo(() => {
    const a = Array.from({ length: total }, (_, i) => i)
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
    return a
  }, [total])
  const [placed, setPlaced] = useState<number[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [wrong, setWrong] = useState<number | null>(null)
  const [drag, setDrag] = useState<{ piece: number; x: number; y: number; w: number } | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const done = placed.length === total

  function tryPlace(piece: number, slot: number) {
    if (piece === slot) {
      const next = [...placed, piece]
      setPlaced(next); setSelected(null)
      if (next.length === total) onDone()
    } else { setWrong(piece); setTimeout(() => setWrong(null), 500) }
  }

  function slotAt(x: number, y: number): number | null {
    const r = boardRef.current?.getBoundingClientRect()
    if (!r || x < r.left || x > r.right || y < r.top || y > r.bottom) return null
    return Math.floor(((y - r.top) / r.height) * grid) * grid + Math.floor(((x - r.left) / r.width) * grid)
  }

  const pieceW = `min(${Math.round(80 / Math.max(3, grid))}vw, ${Math.round(420 / Math.max(3, grid))}px)`
  return (
    <div className="select-none" style={{ touchAction: 'none' }}
      onPointerMove={e => { if (drag) setDrag({ ...drag, x: e.clientX, y: e.clientY }) }}
      onPointerUp={e => {
        if (!drag) return
        const slot = slotAt(e.clientX, e.clientY)
        if (slot !== null) tryPlace(drag.piece, slot)
        setDrag(null)
      }}>
      <div ref={boardRef} className="relative mx-auto w-full max-w-[min(90vw,480px)] aspect-[4/3] rounded-xl border-4 border-gray-700 overflow-hidden bg-gray-100"
        style={{ display: 'grid', gridTemplateColumns: `repeat(${grid}, 1fr)`, gridTemplateRows: `repeat(${grid}, 1fr)` }}>
        {ghost && !done && (
          <div className="absolute inset-0 opacity-25 pointer-events-none">
            {level.scene ? <SceneView scene={level.scene} /> : <div className="absolute inset-0" style={{ backgroundImage: `url("${level.imageUrl}")`, backgroundSize: 'cover' }} />}
          </div>
        )}
        {Array.from({ length: total }, (_, slot) => (
          <button key={slot} type="button" aria-label="puzzle spot"
            onClick={() => { if (selected !== null && !placed.includes(slot)) tryPlace(selected, slot) }}
            className={`relative ${done ? '' : 'border border-white/80'}`}>
            {placed.includes(slot) && <PuzzlePiece level={level} piece={slot} />}
          </button>
        ))}
      </div>
      {!done && (
        <div className="flex flex-wrap justify-center gap-2 mt-4 mx-auto max-w-[min(90vw,520px)]">
          {tray.filter(p => !placed.includes(p)).map(piece => (
            <div key={piece}
              onPointerDown={e => {
                const w = (e.currentTarget as HTMLDivElement).getBoundingClientRect().width
                setSelected(piece)
                setDrag({ piece, x: e.clientX, y: e.clientY, w })
              }}
              className={`relative rounded-lg border-4 overflow-hidden cursor-grab ${selected === piece ? 'border-blue-500' : wrong === piece ? 'border-red-400 animate-bounce' : 'border-white shadow'} ${drag?.piece === piece ? 'opacity-30' : ''}`}
              style={{ width: pieceW, aspectRatio: '4 / 3' }}>
              <PuzzlePiece level={level} piece={piece} />
            </div>
          ))}
        </div>
      )}
      {drag && (
        <div className="fixed pointer-events-none rounded-lg border-4 border-blue-500 shadow-2xl z-[60] overflow-hidden"
          style={{ width: drag.w, aspectRatio: '4 / 3', left: drag.x - drag.w / 2, top: drag.y - (drag.w * 3) / 8 }}>
          <PuzzlePiece level={level} piece={drag.piece} />
        </div>
      )}
    </div>
  )
}

function PicturePuzzle({ levels, ghost }: { levels: PuzzleLevel[]; ghost?: boolean }) {
  const [k, setK] = useState(0)
  const [levelDone, setLevelDone] = useState(false)
  if (k >= levels.length) return <Done text="🎉 You finished every puzzle!" />
  const last = k === levels.length - 1
  return (
    <div>
      <p className="text-center text-gray-500 mb-3">
        Puzzle {k + 1} of {levels.length} · {levels[k].grid * levels[k].grid} pieces — drag each piece to its spot, or tap a piece then where it goes.
      </p>
      <PuzzleLevelView key={k} level={levels[k]} ghost={ghost} onDone={() => setLevelDone(true)} />
      {levelDone && (
        <div className="text-center mt-4">
          <p className="text-2xl font-bold text-green-600">🎉 Puzzle {k + 1} done!</p>
          <button type="button" onClick={() => { setLevelDone(false); setK(v => v + 1) }}
            className="mt-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold">{last ? 'Finish' : 'Next puzzle →'}</button>
        </div>
      )}
    </div>
  )
}

export default function EyeHandGameView({ game }: { game: EyeHandGame }) {
  switch (game.type) {
    case 'bubbles': return <Bubbles count={game.count} size={game.size} style={game.style} />
    case 'followstar': return <FollowStar count={game.count} size={game.size} speed={game.speed} />
    case 'maze': return <StarMaze cells={game.cells} mode={game.mode} style={game.style} />
    case 'leftright': return <LeftRight count={game.count} size={game.size} style={game.style} />
    case 'dots': return <Dots count={game.count} size={game.size} mode={game.mode} />
    case 'findletter': return <FindLetter count={game.count} board={game.board} />
    case 'cardmatch': return <CardMatch pairs={game.pairs} style={game.style} />
    case 'numbergrid': return <NumberGrid grid={game.grid} mode={game.mode} />
    case 'oddone': return <OddOneOut grid={game.grid} rounds={game.rounds} style={game.style} />
    case 'cups': return <CupShuffle cups={game.cups} swaps={game.swaps} speed={game.speed} rounds={game.rounds} style={game.style} />
    case 'findall': return <FindAll grid={game.grid} targets={game.targets} style={game.style} />
    case 'pattern': return <CopyPattern grid={game.grid} squares={game.squares} rounds={game.rounds} />
    case 'spotdiff': return <SpotDiff grid={game.grid} rounds={game.rounds} style={game.style} />
    case 'reachpoke': return <ReachPoke layout={game.layout} count={game.count} />
    case 'puzzle': return <PicturePuzzle levels={game.levels?.length ? game.levels : [{ grid: game.grid ?? 3, imageUrl: game.imageUrl }]} ghost={game.ghost} />
  }
}
