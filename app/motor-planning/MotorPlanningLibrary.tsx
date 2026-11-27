'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { MOTOR_EXERCISES, MOTOR_GROUPS, WARM_UP, type MotorExercise } from '@/lib/motorPlanning'
import { youtubeVideoUrl } from '@/lib/qrcode'
import { BrainBreakOverlay } from '@/app/components/BrainBreakCard'
import { useTabletConnection } from '@/app/components/TabletConnectionProvider'
import Link from 'next/link'

// Optional count helper for holds ("Hold 10 seconds") — counts up once a
// second so the speller and partner can see it. Nothing happens at the end
// except a "Done!", so there's no pressure.
function CountWithMe({ seconds }: { seconds: number }) {
  const [n, setN] = useState<number | null>(null)
  useEffect(() => {
    if (n === null || n >= seconds) return
    const t = setTimeout(() => setN(v => (v ?? 0) + 1), 1000)
    return () => clearTimeout(t)
  }, [n, seconds])
  if (n === null) {
    return <button type="button" onClick={() => setN(0)} className="px-4 py-2 rounded-xl border-2 border-blue-300 text-blue-700 font-semibold hover:bg-blue-50">⏱ Count with me ({seconds})</button>
  }
  return (
    <div className="flex items-center gap-3">
      <span className="text-5xl font-bold text-blue-700 w-20 text-center">{n >= seconds ? '✓' : n}</span>
      {n >= seconds && <span className="text-xl font-semibold text-green-600">Done!</span>}
      <button type="button" onClick={() => setN(0)} className="text-sm text-gray-500 underline">Again</button>
    </div>
  )
}

function DemoButtons({ ex }: { ex: MotorExercise }) {
  const tablet = useTabletConnection()
  const [sent, setSent] = useState(false)
  if (!ex.videoId) return null
  return (
    <div className="flex gap-2 flex-wrap">
      <button type="button" onClick={() => window.open(youtubeVideoUrl(ex.videoId!), '_blank', 'noopener,noreferrer')}
        className="px-3 py-1.5 rounded-lg text-sm border-2 border-sky-300 text-sky-800 bg-sky-50 hover:bg-sky-100">▶ Watch demo</button>
      {tablet.code && (
        <button type="button" onClick={() => { tablet.sendVideo(ex.videoId!, ex.videoTitle); setSent(true); setTimeout(() => setSent(false), 1500) }}
          className="px-3 py-1.5 rounded-lg text-sm border-2 border-purple-300 text-purple-700 hover:bg-purple-50">{sent ? '✓ Sent' : '📲 Send demo to tablet'}</button>
      )}
    </div>
  )
}

// One exercise, big and clear — used by the warm-up and "Show big".
function ExerciseScreen({ ex }: { ex: MotorExercise }) {
  const group = MOTOR_GROUPS.find(g => g.key === ex.group)!
  return (
    <div className="space-y-5">
      <div className="text-center">
        <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide">{group.label}</p>
        <p className="text-6xl mt-2">{ex.emoji}</p>
        <h2 className="text-3xl font-bold text-gray-900 mt-2">{ex.name}</h2>
        <p className="text-lg text-blue-700 font-semibold mt-1">{ex.reps}</p>
      </div>
      <ol className="space-y-3 max-w-xl mx-auto">
        {ex.steps.map((s, i) => (
          <li key={i} className="flex gap-3 text-xl text-gray-800"><span className="font-bold text-purple-600">{i + 1}.</span><span>{s}</span></li>
        ))}
      </ol>
      <div className="flex flex-col items-center gap-3">
        {ex.holdSeconds && <CountWithMe key={ex.id} seconds={ex.holdSeconds} />}
        <DemoButtons ex={ex} />
      </div>
    </div>
  )
}

function Overlay({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return createPortal(
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-6">
          <p className="text-lg font-bold text-purple-700">{title}</p>
          <button type="button" onClick={onClose} className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-base font-semibold hover:bg-gray-700">✕ Done</button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  )
}

function WarmUp({ onClose }: { onClose: () => void }) {
  const steps = WARM_UP.map(id => MOTOR_EXERCISES.find(e => e.id === id)!).filter(Boolean)
  const [i, setI] = useState(0)
  const finished = i >= steps.length
  return (
    <Overlay title="🔥 Pre-Session Warm-Up" onClose={onClose}>
      {finished ? (
        <div className="text-center py-16 space-y-4">
          <p className="text-6xl">🎉</p>
          <p className="text-3xl font-bold text-green-600">Warmed up and ready to spell!</p>
          <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl bg-blue-600 text-white text-lg font-semibold">Start the lesson</button>
        </div>
      ) : (
        <>
          <p className="text-center text-gray-500 mb-4">Exercise {i + 1} of {steps.length}</p>
          <ExerciseScreen ex={steps[i]} />
          <div className="flex justify-between mt-8">
            <button type="button" onClick={() => setI(v => Math.max(0, v - 1))} disabled={i === 0}
              className="px-5 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold disabled:opacity-30">← Back</button>
            <button type="button" onClick={() => setI(v => v + 1)} className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold">
              {i === steps.length - 1 ? 'Finish ✓' : 'Next →'}
            </button>
          </div>
        </>
      )}
    </Overlay>
  )
}

function ReachPokeCard() {
  const tablet = useTabletConnection()
  const [layout, setLayout] = useState<'three' | 'alphabet' | 'keyboard'>('three')
  const [count, setCount] = useState(10)
  const [playing, setPlaying] = useState(false)
  const [sent, setSent] = useState(false)
  const game = { type: 'reachpoke' as const, layout, count }
  const chip = (on: boolean) => `px-2.5 py-1 rounded-lg text-xs border-2 ${on ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-700'}`
  return (
    <div className="border-2 border-yellow-300 bg-yellow-50 rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="font-bold text-gray-900">🎯 Reach &amp; Poke</p>
          <p className="text-sm text-gray-600">A letter lights up on a letterboard layout — reach and poke it with a pointer finger. Each new letter is far from the last, so every poke is a real reach.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setPlaying(true)} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700">▶ Play here</button>
          {tablet.code && (
            <button type="button" onClick={() => { tablet.sendGame(game); setSent(true); setTimeout(() => setSent(false), 1500) }}
              className="bg-white text-purple-700 border-2 border-purple-300 px-4 py-2 rounded-lg text-sm font-semibold">{sent ? '✓ Sent' : '📲 Send to tablet'}</button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-gray-500 w-14">Board</span>
        <button type="button" className={chip(layout === 'three')} onClick={() => setLayout('three')}>3-board</button>
        <button type="button" className={chip(layout === 'alphabet')} onClick={() => setLayout('alphabet')}>26-board</button>
        <button type="button" className={chip(layout === 'keyboard')} onClick={() => setLayout('keyboard')}>Keyboard</button>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-gray-500 w-14">Pokes</span>
        {[5, 10, 15, 20].map(c => <button key={c} type="button" className={chip(count === c)} onClick={() => setCount(c)}>{c}</button>)}
      </div>
      {playing && <BrainBreakOverlay game={game} onClose={() => setPlaying(false)} />}
    </div>
  )
}

export default function MotorPlanningLibrary() {
  const [warmUp, setWarmUp] = useState(false)
  const [big, setBig] = useState<MotorExercise | null>(null)
  return (
    <div className="space-y-6">
      <Link href="/at-home" className="block border-2 border-green-300 bg-green-50 rounded-2xl px-4 py-3 hover:bg-green-100">
        <p className="font-bold text-green-800">🏠 Looking for things to do at home? →</p>
        <p className="text-sm text-green-700">35 everyday chores and play activities, with a printable sheet for families.</p>
      </Link>
      <div className="border-2 border-orange-300 bg-orange-50 rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="font-bold text-gray-900">🔥 Pre-Session Warm-Up</p>
          <p className="text-sm text-gray-600">About 3–4 minutes, one exercise at a time, from torso to pointer finger. Great right before a lesson.</p>
        </div>
        <button type="button" onClick={() => setWarmUp(true)} className="bg-orange-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-orange-600">▶ Start warm-up</button>
      </div>

      <ReachPokeCard />

      {MOTOR_GROUPS.map(group => (
        <section key={group.key}>
          <h2 className="text-lg font-bold text-gray-900">{group.label} <span className="text-sm font-normal text-gray-500">— {group.why}</span></h2>
          <div className="mt-2 space-y-2">
            {MOTOR_EXERCISES.filter(e => e.group === group.key).map(ex => (
              <div key={ex.id} className="border border-gray-200 rounded-xl p-3 bg-white">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <p className="font-semibold text-gray-900">{ex.emoji} {ex.name} <span className="ml-1 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">{ex.reps}</span>{ex.seated && <span className="ml-1 text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">Seated</span>}</p>
                    <p className="text-sm text-gray-600 mt-1">{ex.steps.join(' ')}</p>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <button type="button" onClick={() => setBig(ex)} className="px-3 py-1.5 rounded-lg text-sm bg-purple-600 text-white hover:bg-purple-700">⛶ Show big</button>
                    <DemoButtons ex={ex} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {warmUp && <WarmUp onClose={() => setWarmUp(false)} />}
      {big && <Overlay title={`🖐️ ${big.name}`} onClose={() => setBig(null)}><ExerciseScreen ex={big} /></Overlay>}
    </div>
  )
}
