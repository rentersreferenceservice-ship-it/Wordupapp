'use client'

import { useState } from 'react'
import type { EyeHandGame, GameSpeed, GameStyle, TargetSize } from '@/lib/types'
import { BrainBreakOverlay } from '@/app/components/BrainBreakCard'
import { useTabletConnection } from '@/app/components/TabletConnectionProvider'

type GameKey = 'cardmatch' | 'bubbles' | 'maze' | 'leftright' | 'dots' | 'findletter' | 'numbergrid' | 'oddone' | 'cups' | 'findall' | 'pattern' | 'spotdiff' | 'puzzle'

const GROWNUP_ICON: Partial<Record<GameKey, string>> = { cardmatch: '♠️', bubbles: '🔵', maze: '🔵', leftright: '🟠', cups: '⚪', findall: '🔠', spotdiff: '♦️' }

const GAMES: { key: GameKey; emoji: string; name: string; skill: string; ages: string; how: string }[] = [
  { key: 'cardmatch', emoji: '🃏', name: 'Card Match', skill: 'Visual scanning', ages: 'All ages', how: 'All cards face up — find the two that are the same and tap them both.' },
  { key: 'bubbles', emoji: '🫧', name: 'Pop the Bubbles', skill: 'Quick eye jumps', ages: 'All ages', how: 'One bubble at a time appears in a new spot. Tap it to pop it.' },
  { key: 'maze', emoji: '⭐', name: 'Star Maze', skill: 'Eye-guided movement', ages: 'All ages', how: 'Guide the star through the maze to the flag — slide it, or tap one square at a time.' },
  { key: 'leftright', emoji: '↔️', name: 'Left–Right Jump', skill: 'Crossing the midline', ages: 'All ages', how: 'Targets jump between the far left and far right. Tap each one.' },
  { key: 'dots', emoji: '🔢', name: 'Connect the Dots', skill: 'Scanning & sequencing', ages: 'All ages', how: 'Tap the dots in order — 1, 2, 3… or A, B, C… or the trail 1, A, 2, B…' },
  { key: 'findletter', emoji: '🔤', name: 'Find the Letter', skill: 'Letterboard scanning', ages: 'All ages', how: 'A letter appears — find and tap it on the board.' },
  { key: 'numbergrid', emoji: '🔲', name: 'Number Grid', skill: 'Wide-field scanning', ages: 'Teens & adults', how: 'Numbers are scattered in a grid — tap them in order, 1 to the end.' },
  { key: 'oddone', emoji: '🔍', name: 'Odd One Out', skill: 'Visual discrimination', ages: 'All ages', how: 'One symbol is different from the rest (like Q among O’s). Find it.' },
  { key: 'cups', emoji: '🥤', name: 'Cup Shuffle', skill: 'Smooth tracking', ages: 'All ages', how: 'Watch the cup with the ball as the cups slowly swap — then tap where it ended up.' },
  { key: 'findall', emoji: '⭐', name: 'Find Them All', skill: 'Visual scanning', ages: 'All ages', how: 'Tap every target hidden among other shapes — like every ⭐, or every E among F, P and B.' },
  { key: 'pattern', emoji: '🟦', name: 'Copy the Pattern', skill: 'Visual memory', ages: 'All ages', how: 'Some squares light up. Remember them, tap “I’m ready”, then tap the same squares.' },
  { key: 'puzzle', emoji: '🧩', name: 'Picture Puzzle', skill: 'Planning & placing', ages: 'All ages', how: 'Drag each piece to its spot to rebuild the picture — or tap a piece, then tap where it goes.' },
  { key: 'spotdiff', emoji: '👀', name: 'Spot the Difference', skill: 'Comparing side to side', ages: 'All ages', how: 'Two grids side by side — one picture is different. Find it.' },
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

// Photos from the lesson library for the stand-alone puzzle (lesson brain
// breaks use that lesson's own photo).
const PUZZLE_PICS: { label: string; url: string }[] = [
  { label: '🐙 Octopus', url: 'https://images.unsplash.com/photo-1683163826671-7c79d06088b7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080' },
  { label: '🐶 Dog', url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080' },
  { label: '🌊 Beach', url: 'https://images.unsplash.com/photo-1506252374453-ef5237291d83?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080' },
  { label: '🦋 Butterfly', url: 'https://images.unsplash.com/photo-1586190605851-4a26c9ec04bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080' },
]

const SIZES: { v: TargetSize; label: string }[] = [{ v: 'large', label: 'Large' }, { v: 'medium', label: 'Medium' }, { v: 'small', label: 'Small' }]

function GameRow({ meta, style }: { meta: typeof GAMES[number]; style: GameStyle }) {
  const tablet = useTabletConnection()
  // Teens & adults start a step harder; everything is still adjustable.
  const teen = style === 'grownup'
  const [size, setSize] = useState<TargetSize>(teen ? 'medium' : 'large')
  const [count, setCount] = useState(10)
  const [pairs, setPairs] = useState(teen ? 6 : 2)
  const [dotMode, setDotMode] = useState<'numbers' | 'letters' | 'alternating'>(teen ? 'alternating' : 'numbers')
  const [board, setBoard] = useState<'three' | 'alphabet' | 'keyboard'>(teen ? 'keyboard' : 'three')
  const [cells, setCells] = useState(teen ? 8 : 4)
  const [mazeMode, setMazeMode] = useState<'slide' | 'tap'>('slide')
  const [grid, setGrid] = useState(teen ? 5 : 4)
  const [gridMode, setGridMode] = useState<'numbers' | 'letters'>('numbers')
  const [oddGrid, setOddGrid] = useState(teen ? 6 : 4)
  const [cupCount, setCupCount] = useState(3)
  const [swaps, setSwaps] = useState(teen ? 8 : 3)
  const [speed, setSpeed] = useState<GameSpeed>(teen ? 'medium' : 'slow')
  const [findGrid, setFindGrid] = useState(teen ? 8 : 5)
  const [findTargets, setFindTargets] = useState(teen ? 8 : 4)
  const [patGrid, setPatGrid] = useState(teen ? 4 : 3)
  const [patSquares, setPatSquares] = useState(teen ? 5 : 2)
  const [spotGrid, setSpotGrid] = useState(teen ? 5 : 3)
  const [rounds, setRounds] = useState(5)
  const [pic, setPic] = useState(PUZZLE_PICS[0].url)
  const [pieces, setPieces] = useState(teen ? 4 : 2)
  const [playing, setPlaying] = useState<EyeHandGame | null>(null)
  const [sent, setSent] = useState(false)

  function build(): EyeHandGame {
    switch (meta.key) {
      case 'cardmatch': return { type: 'cardmatch', pairs, style }
      case 'bubbles': return { type: 'bubbles', count, size, style }
      case 'maze': return { type: 'maze', cells, mode: mazeMode, style }
      case 'leftright': return { type: 'leftright', count, size, style }
      case 'dots': return { type: 'dots', count, size, mode: dotMode }
      case 'findletter': return { type: 'findletter', count, board }
      case 'numbergrid': return { type: 'numbergrid', grid, mode: gridMode }
      case 'oddone': return { type: 'oddone', grid: oddGrid, rounds: count, style }
      case 'cups': return { type: 'cups', cups: cupCount, swaps, speed, rounds, style }
      case 'findall': return { type: 'findall', grid: findGrid, targets: findTargets, style }
      case 'pattern': return { type: 'pattern', grid: patGrid, squares: patSquares, rounds }
      case 'spotdiff': return { type: 'spotdiff', grid: spotGrid, rounds, style }
      case 'puzzle': return { type: 'puzzle', imageUrl: pic, grid: pieces, ghost: pieces <= 3 }
    }
  }

  const counts = meta.key === 'dots' ? [6, 8, 10, 16] : [5, 10, 15, 20]
  const showCount = ['bubbles', 'leftright', 'dots', 'findletter', 'oddone'].includes(meta.key)

  return (
    <div className="border border-gray-200 rounded-2xl p-4 space-y-3 bg-white">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="font-bold text-gray-900">
            {(teen && GROWNUP_ICON[meta.key]) || meta.emoji} {meta.name}
            <span className="ml-2 text-xs font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">{meta.skill}</span>
            <span className="ml-1 text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">{meta.ages}</span>
          </p>
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
        {meta.key === 'maze' && (
          <>
            <Choice label="Mode" value={mazeMode} onChange={setMazeMode} options={[{ v: 'slide', label: 'Slide the star' }, { v: 'tap', label: 'Tap the path' }]} />
            <Choice label="Maze" value={cells} onChange={setCells} options={[{ v: 3, label: 'Tiny (3×3)' }, { v: 4, label: 'Small (4×4)' }, { v: 6, label: 'Medium (6×6)' }, { v: 8, label: 'Large (8×8)' }, { v: 10, label: 'Expert (10×10)' }]} />
          </>
        )}
        {['bubbles', 'leftright', 'dots'].includes(meta.key) && <Choice label="Size" value={size} onChange={setSize} options={SIZES} />}
        {meta.key === 'dots' && <Choice label="Use" value={dotMode} onChange={setDotMode} options={[{ v: 'numbers', label: '1, 2, 3' }, { v: 'letters', label: 'A, B, C' }, { v: 'alternating', label: '1, A, 2, B (teens & adults)' }]} />}
        {meta.key === 'findletter' && <Choice label="Board" value={board} onChange={setBoard} options={[{ v: 'three', label: '3-board' }, { v: 'alphabet', label: '26-board' }, { v: 'keyboard', label: 'Keyboard' }]} />}
        {meta.key === 'numbergrid' && (
          <>
            <Choice label="Grid" value={grid} onChange={setGrid} options={[{ v: 3, label: '3×3 (1–9)' }, { v: 4, label: '4×4 (1–16)' }, { v: 5, label: '5×5 (1–25)' }]} />
            <Choice label="Use" value={gridMode} onChange={setGridMode} options={[{ v: 'numbers', label: 'Numbers' }, { v: 'letters', label: 'Letters' }]} />
          </>
        )}
        {meta.key === 'oddone' && <Choice label="Grid" value={oddGrid} onChange={setOddGrid} options={[3, 4, 5, 6, 8].map(g => ({ v: g, label: `${g}×${g}` }))} />}
        {meta.key === 'cups' && (
          <>
            <Choice label="Cups" value={cupCount} onChange={setCupCount} options={[3, 4, 5].map(c => ({ v: c, label: String(c) }))} />
            <Choice label="Swaps" value={swaps} onChange={setSwaps} options={[2, 3, 5, 8, 12].map(c => ({ v: c, label: String(c) }))} />
            <Choice label="Speed" value={speed} onChange={setSpeed} options={[{ v: 'slow', label: 'Slow' }, { v: 'medium', label: 'Medium' }, { v: 'fast', label: 'Fast' }]} />
          </>
        )}
        {meta.key === 'findall' && (
          <>
            <Choice label="Grid" value={findGrid} onChange={setFindGrid} options={[4, 5, 6, 8, 10].map(g => ({ v: g, label: `${g}×${g}` }))} />
            <Choice label="Find" value={findTargets} onChange={setFindTargets} options={[3, 4, 6, 8, 12].map(c => ({ v: c, label: String(c) }))} />
          </>
        )}
        {meta.key === 'pattern' && (
          <>
            <Choice label="Grid" value={patGrid} onChange={setPatGrid} options={[3, 4, 5].map(g => ({ v: g, label: `${g}×${g}` }))} />
            <Choice label="Squares" value={patSquares} onChange={setPatSquares} options={[2, 3, 4, 5, 7].map(c => ({ v: c, label: String(c) }))} />
          </>
        )}
        {meta.key === 'puzzle' && (
          <>
            <Choice label="Picture" value={pic} onChange={setPic} options={PUZZLE_PICS.map(p => ({ v: p.url, label: p.label }))} />
            <Choice label="Pieces" value={pieces} onChange={setPieces} options={[{ v: 2, label: '4' }, { v: 3, label: '9' }, { v: 4, label: '16' }]} />
          </>
        )}
        {meta.key === 'spotdiff' && <Choice label="Grid" value={spotGrid} onChange={setSpotGrid} options={[3, 4, 5, 6].map(g => ({ v: g, label: `${g}×${g}` }))} />}
        {['cups', 'pattern', 'spotdiff'].includes(meta.key) && <Choice label="Rounds" value={rounds} onChange={setRounds} options={[3, 5, 8, 10].map(c => ({ v: c, label: String(c) }))} />}
        {showCount && <Choice label={meta.key === 'dots' ? 'Dots' : meta.key === 'oddone' ? 'Rounds' : 'Turns'} value={count} onChange={setCount} options={counts.map(c => ({ v: c, label: String(c) }))} />}
      </div>
      {playing && <BrainBreakOverlay game={playing} onClose={() => setPlaying(null)} />}
    </div>
  )
}

export default function OcularMotorLibrary() {
  // Kids: playful emoji and gentle starting settings. Teens & adults: plain
  // shapes and letters, harder starting settings, teen/adult games first.
  const [style, setStyle] = useState<GameStyle>('playful')
  const teen = style === 'grownup'
  const games = teen ? [...GAMES].sort((a, b) => Number(b.ages === 'Teens & adults') - Number(a.ages === 'Teens & adults')) : GAMES
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap bg-gray-50 rounded-xl px-4 py-3">
        <span className="text-sm font-semibold text-gray-700">Age group:</span>
        <button type="button" onClick={() => setStyle('playful')} className={`px-3 py-1.5 rounded-lg text-sm border-2 ${!teen ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300'}`}>🐸 Kids</button>
        <button type="button" onClick={() => setStyle('grownup')} className={`px-3 py-1.5 rounded-lg text-sm border-2 ${teen ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300'}`}>🔵 Teens & adults</button>
        <p className="w-full text-xs text-gray-500">
          {teen
            ? 'Teens & adults: plain shapes and letters instead of animals, harder starting settings, and the teen & adult games first.'
            : 'Kids: playful pictures and easy starting settings (large targets, small mazes, 4 cards).'}
        </p>
      </div>
      {games.map(g => <GameRow key={`${g.key}-${style}`} meta={g} style={style} />)}
    </div>
  )
}
