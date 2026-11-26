'use client'

import { useMemo, useState } from 'react'
import type { BrainBreak } from '@/lib/types'
import EyeHandGameView from './EyeHandGames'

// VAKT sensory-break games. Built for spellers: tap-only (no dragging),
// big targets, no timers, no penalties beyond the game itself.

export const BRAIN_BREAK_NAMES: Record<BrainBreak['type'], string> = {
  hangman: 'Word Guess',
  match: 'Picture Match',
  wordsearch: 'Word Search',
  tictactoe: 'Tic-Tac-Toe',
  bubbles: 'Pop the Bubbles',
  followstar: 'Follow the Star',
  leftright: 'Left–Right Jump',
  dots: 'Connect the Dots',
  findletter: 'Find the Letter',
  cardmatch: 'Card Match',
  maze: 'Star Maze',
  numbergrid: 'Number Grid',
  oddone: 'Odd One Out',
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function shuffle<T>(items: T[]): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function Done({ text }: { text: string }) {
  return <p className="text-center text-2xl font-bold text-green-600 mt-4">{text}</p>
}

// ── Word Guess (hangman, shown as balloons popping) ──────────────────────
function WordGuess({ word, hint }: { word: string; hint: string }) {
  const target = word.toUpperCase()
  const [guessed, setGuessed] = useState<string[]>([])
  const MAX_MISSES = 6
  const misses = guessed.filter(l => !target.includes(l)).length
  const won = target.split('').every(l => guessed.includes(l))
  const lost = misses >= MAX_MISSES
  const over = won || lost

  return (
    <div className="space-y-5">
      <p className="text-center text-gray-500">{hint}</p>
      <p className="text-center text-4xl tracking-widest" aria-label={`${MAX_MISSES - misses} balloons left`}>
        {'🎈'.repeat(MAX_MISSES - misses)}<span className="opacity-20">{'🎈'.repeat(misses)}</span>
      </p>
      <div className="flex justify-center gap-2 flex-wrap">
        {target.split('').map((l, i) => (
          <span key={i} className="w-10 h-12 sm:w-12 sm:h-14 border-b-4 border-gray-700 text-3xl font-bold flex items-end justify-center">
            {guessed.includes(l) || lost ? l : ''}
          </span>
        ))}
      </div>
      {won && <Done text={`🎉 You spelled ${target}!`} />}
      {lost && <p className="text-center text-xl text-gray-600">The word was <b>{target}</b>. Nice try!</p>}
      <div className="grid grid-cols-7 gap-2 max-w-lg mx-auto">
        {ALPHABET.map(l => {
          const used = guessed.includes(l)
          return (
            <button
              key={l}
              type="button"
              disabled={used || over}
              onClick={() => setGuessed(g => [...g, l])}
              className={`h-12 sm:h-14 rounded-xl text-xl font-bold border-2 transition-colors ${
                !used ? 'bg-white border-gray-300 hover:bg-blue-50' : target.includes(l) ? 'bg-green-100 border-green-400 text-green-700' : 'bg-gray-100 border-gray-200 text-gray-300'
              }`}
            >
              {l}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Picture Match: tap a picture, then its partner ───────────────────────
function PictureMatch({ pairs }: { pairs: { a: string; aLabel: string; b: string; bLabel: string }[] }) {
  const right = useMemo(() => shuffle(pairs.map((p, i) => ({ ...p, i }))), [pairs])
  const [picked, setPicked] = useState<number | null>(null)
  const [matched, setMatched] = useState<number[]>([])
  const [wrong, setWrong] = useState<number | null>(null)
  const done = matched.length === pairs.length

  function tapRight(i: number) {
    if (picked === null || matched.includes(i)) return
    if (picked === i) {
      setMatched(m => [...m, i])
      setPicked(null)
    } else {
      setWrong(i)
      setTimeout(() => setWrong(null), 600)
    }
  }

  const card = 'w-full flex items-center gap-3 px-3 py-3 rounded-2xl border-4 text-left transition-colors'
  return (
    <div>
      <p className="text-center text-gray-500 mb-4">Tap a picture on the left, then the one it goes with on the right.</p>
      <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto">
        <div className="space-y-3">
          {pairs.map((p, i) => (
            <button key={i} type="button" disabled={matched.includes(i)} onClick={() => setPicked(i)}
              className={`${card} ${matched.includes(i) ? 'border-green-400 bg-green-50' : picked === i ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
              <span className="text-4xl">{p.a}</span><span className="text-base font-medium">{p.aLabel}</span>
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {right.map(p => (
            <button key={p.i} type="button" disabled={matched.includes(p.i)} onClick={() => tapRight(p.i)}
              className={`${card} ${matched.includes(p.i) ? 'border-green-400 bg-green-50' : wrong === p.i ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'}`}>
              <span className="text-4xl">{p.b}</span><span className="text-base font-medium">{p.bLabel}</span>
            </button>
          ))}
        </div>
      </div>
      {done && <Done text="🎉 All matched!" />}
    </div>
  )
}

// ── Word Search: tap the first letter, then the last letter ──────────────
type Cell = [number, number]

function buildGrid(words: string[], size: number): { grid: string[][]; placed: { word: string; cells: Cell[] }[] } {
  for (let attempt = 0; attempt < 50; attempt++) {
    const grid: string[][] = Array.from({ length: size }, () => Array(size).fill(''))
    const placed: { word: string; cells: Cell[] }[] = []
    let ok = true
    for (const word of [...words].sort((a, b) => b.length - a.length)) {
      let done = false
      for (let tries = 0; tries < 200 && !done; tries++) {
        const horizontal = Math.random() < 0.5 // only left→right or top→down: easier to spot
        const r = Math.floor(Math.random() * (horizontal ? size : size - word.length + 1))
        const c = Math.floor(Math.random() * (horizontal ? size - word.length + 1 : size))
        if (r < 0 || c < 0) continue
        const cells: Cell[] = word.split('').map((_, k) => (horizontal ? [r, c + k] : [r + k, c]))
        if (cells.every(([y, x], k) => grid[y][x] === '' || grid[y][x] === word[k])) {
          cells.forEach(([y, x], k) => { grid[y][x] = word[k] })
          placed.push({ word, cells })
          done = true
        }
      }
      if (!done) { ok = false; break }
    }
    if (!ok) continue
    for (const row of grid) for (let x = 0; x < size; x++) if (!row[x]) row[x] = ALPHABET[Math.floor(Math.random() * 26)]
    return { grid, placed }
  }
  return { grid: [], placed: [] }
}

function WordSearch({ words, size }: { words: string[]; size: number }) {
  const list = useMemo(() => words.map(w => w.toUpperCase()).filter(w => w.length <= size), [words, size])
  const { grid, placed } = useMemo(() => buildGrid(list, size), [list, size])
  const [start, setStart] = useState<Cell | null>(null)
  const [found, setFound] = useState<string[]>([])
  const [miss, setMiss] = useState(false)
  const foundCells = new Set(placed.filter(p => found.includes(p.word)).flatMap(p => p.cells.map(([y, x]) => `${y},${x}`)))
  const done = placed.length > 0 && found.length === placed.length

  function tap(y: number, x: number) {
    if (!start) { setStart([y, x]); return }
    const [y0, x0] = start
    setStart(null)
    const hit = placed.find(p => {
      const a = p.cells[0], b = p.cells[p.cells.length - 1]
      return (a[0] === y0 && a[1] === x0 && b[0] === y && b[1] === x) || (b[0] === y0 && b[1] === x0 && a[0] === y && a[1] === x)
    })
    if (hit && !found.includes(hit.word)) setFound(f => [...f, hit.word])
    else if (!(y0 === y && x0 === x)) { setMiss(true); setTimeout(() => setMiss(false), 600) }
  }

  if (!grid.length) return <p className="text-center text-gray-500">Couldn&apos;t build this puzzle — try another break.</p>
  return (
    <div>
      <p className="text-center text-gray-500 mb-3">Find each word: tap its <b>first</b> letter, then its <b>last</b> letter.</p>
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        {placed.map(p => (
          <span key={p.word} className={`px-3 py-1 rounded-full text-base font-semibold ${found.includes(p.word) ? 'bg-green-100 text-green-700 line-through' : 'bg-gray-100 text-gray-700'}`}>{p.word}</span>
        ))}
      </div>
      <div className={`grid gap-1 mx-auto max-w-lg ${miss ? 'animate-pulse' : ''}`} style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}>
        {grid.map((row, y) => row.map((l, x) => {
          const key = `${y},${x}`
          const isStart = start && start[0] === y && start[1] === x
          return (
            <button key={key} type="button" onClick={() => tap(y, x)}
              className={`aspect-square rounded-lg font-bold flex items-center justify-center border-2 ${size > 9 ? 'text-base' : 'text-xl'} ${
                isStart ? 'bg-blue-500 text-white border-blue-500' : foundCells.has(key) ? 'bg-green-200 border-green-300' : 'bg-white border-gray-200'
              }`}>
              {l}
            </button>
          )
        }))}
      </div>
      {done && <Done text="🎉 You found them all!" />}
    </div>
  )
}

// ── Tic-Tac-Toe: speller vs. partner or vs. the computer ─────────────────
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]]
function winner(b: (string | null)[]): string | null {
  for (const [a, c, d] of LINES) if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a]
  return null
}
function computerMove(b: (string | null)[]): number {
  const free = b.map((v, i) => (v ? -1 : i)).filter(i => i >= 0)
  for (const mark of ['O', 'X']) {
    for (const i of free) { const t = [...b]; t[i] = mark; if (winner(t) === mark) return i } // win, else block
  }
  if (free.includes(4)) return 4
  return free[Math.floor(Math.random() * free.length)]
}

function TicTacToe({ x, o }: { x: string; o: string }) {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null))
  const [vsComputer, setVsComputer] = useState(true)
  const w = winner(board)
  const full = board.every(Boolean)
  const xTurn = board.filter(Boolean).length % 2 === 0

  function tap(i: number) {
    if (board[i] || w) return
    const next = [...board]
    next[i] = xTurn ? 'X' : 'O'
    if (vsComputer && xTurn && !winner(next) && next.some(v => !v)) next[computerMove(next)] = 'O'
    setBoard(next)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-2">
        <button type="button" onClick={() => { setVsComputer(true); setBoard(Array(9).fill(null)) }} className={`px-3 py-1.5 rounded-lg text-sm border-2 ${vsComputer ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300'}`}>Play the computer</button>
        <button type="button" onClick={() => { setVsComputer(false); setBoard(Array(9).fill(null)) }} className={`px-3 py-1.5 rounded-lg text-sm border-2 ${!vsComputer ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300'}`}>Take turns with a partner</button>
      </div>
      <p className="text-center text-gray-500">{w ? '' : full ? '' : vsComputer ? `You are ${x}` : `${xTurn ? x : o}'s turn`}</p>
      <div className="grid grid-cols-3 gap-2 w-72 sm:w-80 mx-auto">
        {board.map((v, i) => (
          <button key={i} type="button" onClick={() => tap(i)} className="aspect-square rounded-2xl border-4 border-gray-300 bg-white text-6xl flex items-center justify-center hover:bg-blue-50">
            {v === 'X' ? x : v === 'O' ? o : ''}
          </button>
        ))}
      </div>
      {(w || full) && (
        <div className="text-center space-y-2">
          <p className="text-2xl font-bold text-green-600">{w ? `${w === 'X' ? x : o} wins!` : "It's a tie!"}</p>
          <button type="button" onClick={() => setBoard(Array(9).fill(null))} className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold">Play again</button>
        </div>
      )}
    </div>
  )
}

export default function BrainBreakGame({ game }: { game: BrainBreak }) {
  switch (game.type) {
    case 'hangman': return <WordGuess word={game.word} hint={game.hint} />
    case 'match': return <PictureMatch pairs={game.pairs} />
    case 'wordsearch': return <WordSearch words={game.words} size={game.size} />
    case 'tictactoe': return <TicTacToe x={game.x} o={game.o} />
    default: return <EyeHandGameView game={game} />
  }
}
