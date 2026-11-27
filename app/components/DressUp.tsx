'use client'

import { useMemo, useRef, useState } from 'react'
import { useSignalComplete } from './gameComplete'

// "Dress for the Day" — a paper-doll motor planning game. Poke a piece of
// clothing to pick it up, then poke where it goes on the person — tap only,
// no dragging, because the two pokes practice the same reach-and-point used
// on the letterboard. While something is picked up, round targets show on
// the body. Items only stick to their own spot; at higher levels clothes
// for a different outing (flip-flops on a snow day) wiggle back with a hint,
// so the speller has to choose by looking at the scene.

type Zone = 'head' | 'neck' | 'torso' | 'legs' | 'feet' | 'hand'
interface Item { e: string; label: string; zone: Zone }

// Where each zone sits on the doll (percent of the doll box) and how big an
// item looks there (percent of box width).
const ZONES: Record<Zone, { x: number; y: number; size: number }> = {
  head: { x: 50, y: 9, size: 26 },
  neck: { x: 50, y: 25, size: 22 },
  torso: { x: 50, y: 37, size: 36 },
  legs: { x: 50, y: 64, size: 36 },
  feet: { x: 50, y: 90, size: 30 },
  hand: { x: 77, y: 52, size: 22 },
}

// Each outing has a few choices per body spot (one is picked at random each
// time, so replays look different) and a pool of things that DON'T fit the
// scene (a few are picked at random at higher levels).
type Slot = { zone: Zone; options: { e: string; label: string }[] }
const o = (e: string, label: string) => ({ e, label })

export const DRESSUP_SCENARIOS: Record<string, { title: string; emoji: string; bg: string; decor: string[]; slots: Slot[]; wrong: Item[] }> = {
  snow: { title: 'Snow day', emoji: '❄️', bg: 'linear-gradient(#dbeafe, #f8fafc)', decor: ['❄️', '🏔️', '❄️', '⛷️'],
    slots: [{ zone: 'head', options: [o('🥽', 'Ski goggles')] }, { zone: 'neck', options: [o('🧣', 'Scarf')] }, { zone: 'torso', options: [o('🧥', 'Winter coat')] }, { zone: 'legs', options: [o('👖', 'Snow pants')] }, { zone: 'feet', options: [o('👢', 'Snow boots')] }, { zone: 'hand', options: [o('🧤', 'Mittens')] }],
    wrong: [{ e: '🩳', label: 'Shorts', zone: 'legs' }, { e: '🩴', label: 'Flip-flops', zone: 'feet' }, { e: '👒', label: 'Sun hat', zone: 'head' }, { e: '🩱', label: 'Swimsuit', zone: 'torso' }, { e: '🍦', label: 'Ice cream', zone: 'hand' }] },
  summer: { title: 'Hot summer day', emoji: '☀️', bg: 'linear-gradient(#fef3c7, #fde68a)', decor: ['☀️', '🌳', '🌻', '🦋'],
    slots: [{ zone: 'head', options: [o('🧢', 'Cap'), o('👒', 'Sun hat')] }, { zone: 'torso', options: [o('👕', 'T-shirt'), o('🎽', 'Tank top')] }, { zone: 'legs', options: [o('🩳', 'Shorts')] }, { zone: 'feet', options: [o('👡', 'Sandals'), o('🩴', 'Flip-flops')] }, { zone: 'hand', options: [o('🍦', 'Ice cream'), o('🍉', 'Watermelon'), o('🥤', 'Cold drink')] }],
    wrong: [{ e: '🧥', label: 'Winter coat', zone: 'torso' }, { e: '🧤', label: 'Mittens', zone: 'hand' }, { e: '👢', label: 'Snow boots', zone: 'feet' }, { e: '🧣', label: 'Scarf', zone: 'neck' }] },
  rain: { title: 'Rainy day', emoji: '🌧️', bg: 'linear-gradient(#cbd5e1, #e2e8f0)', decor: ['🌧️', '☁️', '💧', '🌈'],
    slots: [{ zone: 'torso', options: [o('🧥', 'Raincoat')] }, { zone: 'legs', options: [o('👖', 'Pants')] }, { zone: 'feet', options: [o('👢', 'Rain boots')] }, { zone: 'hand', options: [o('☂️', 'Umbrella')] }],
    wrong: [{ e: '🩳', label: 'Shorts', zone: 'legs' }, { e: '🩴', label: 'Flip-flops', zone: 'feet' }, { e: '🕶️', label: 'Sunglasses', zone: 'head' }, { e: '👒', label: 'Sun hat', zone: 'head' }] },
  picnic: { title: 'Picnic in the park', emoji: '🧺', bg: 'linear-gradient(#bae6fd 0 55%, #bbf7d0 55%)', decor: ['☀️', '🌳', '🦋', '🌼'],
    slots: [{ zone: 'head', options: [o('👒', 'Sun hat'), o('🧢', 'Cap')] }, { zone: 'torso', options: [o('👕', 'T-shirt'), o('👚', 'Blouse')] }, { zone: 'legs', options: [o('👖', 'Jeans'), o('🩳', 'Shorts')] }, { zone: 'feet', options: [o('👟', 'Sneakers')] }, { zone: 'hand', options: [o('🧺', 'Picnic basket'), o('🥪', 'Sandwich')] }],
    wrong: [{ e: '🧣', label: 'Scarf', zone: 'neck' }, { e: '👢', label: 'Snow boots', zone: 'feet' }, { e: '🧤', label: 'Mittens', zone: 'hand' }, { e: '🥽', label: 'Ski goggles', zone: 'head' }] },
  school: { title: 'Off to school', emoji: '🏫', bg: 'linear-gradient(#fef9c3, #fde68a)', decor: ['🏫', '✏️', '📚', '🍎'],
    slots: [{ zone: 'torso', options: [o('👕', 'Shirt'), o('👚', 'Blouse')] }, { zone: 'legs', options: [o('👖', 'Pants')] }, { zone: 'feet', options: [o('👟', 'Sneakers')] }, { zone: 'hand', options: [o('🎒', 'Backpack'), o('📚', 'Books')] }],
    wrong: [{ e: '🩱', label: 'Swimsuit', zone: 'torso' }, { e: '🩴', label: 'Flip-flops', zone: 'feet' }, { e: '🛟', label: 'Swim ring', zone: 'hand' }, { e: '👑', label: 'Crown', zone: 'head' }] },
  beach: { title: 'Day at the beach', emoji: '🏖️', bg: 'linear-gradient(#7dd3fc 0 55%, #fde68a 55%)', decor: ['☀️', '🌴', '🌊', '🐚'],
    slots: [{ zone: 'head', options: [o('👒', 'Sun hat'), o('🕶️', 'Sunglasses')] }, { zone: 'torso', options: [o('🩱', 'Swimsuit')] }, { zone: 'feet', options: [o('🩴', 'Flip-flops')] }, { zone: 'hand', options: [o('🪣', 'Sand bucket'), o('🏐', 'Beach ball')] }],
    wrong: [{ e: '🧥', label: 'Winter coat', zone: 'torso' }, { e: '👢', label: 'Snow boots', zone: 'feet' }, { e: '🧤', label: 'Mittens', zone: 'hand' }, { e: '🧣', label: 'Scarf', zone: 'neck' }] },
  pool: { title: 'Swimming pool', emoji: '🏊', bg: 'linear-gradient(#a5f3fc, #22d3ee)', decor: ['☀️', '🌊', '🏊', '💦'],
    slots: [{ zone: 'head', options: [o('🥽', 'Swim goggles')] }, { zone: 'legs', options: [o('🩲', 'Swim trunks')] }, { zone: 'feet', options: [o('🩴', 'Flip-flops')] }, { zone: 'hand', options: [o('🛟', 'Swim ring')] }],
    wrong: [{ e: '🧥', label: 'Winter coat', zone: 'torso' }, { e: '👢', label: 'Snow boots', zone: 'feet' }, { e: '👔', label: 'Dress shirt', zone: 'torso' }, { e: '🧣', label: 'Scarf', zone: 'neck' }] },
  party: { title: 'Party (suit)', emoji: '🎉', bg: 'linear-gradient(#fce7f3, #ede9fe)', decor: ['🎈', '🎊', '🎂', '🎈'],
    slots: [{ zone: 'head', options: [o('👑', 'Party crown')] }, { zone: 'torso', options: [o('👔', 'Dress shirt')] }, { zone: 'legs', options: [o('👖', 'Nice pants')] }, { zone: 'feet', options: [o('👞', 'Dress shoes')] }, { zone: 'hand', options: [o('🎁', 'Present'), o('🎈', 'Balloon')] }],
    wrong: [{ e: '🥾', label: 'Hiking boots', zone: 'feet' }, { e: '🦺', label: 'Safety vest', zone: 'torso' }, { e: '🧤', label: 'Mittens', zone: 'hand' }, { e: '🩱', label: 'Swimsuit', zone: 'torso' }] },
  partydress: { title: 'Party (dress)', emoji: '💃', bg: 'linear-gradient(#fce7f3, #fbcfe8)', decor: ['🎈', '🎊', '🎂', '🎈'],
    slots: [{ zone: 'head', options: [o('🎀', 'Bow'), o('👑', 'Party crown')] }, { zone: 'torso', options: [o('👗', 'Party dress')] }, { zone: 'feet', options: [o('🥿', 'Flat shoes')] }, { zone: 'hand', options: [o('🎁', 'Present'), o('🎈', 'Balloon')] }],
    wrong: [{ e: '🥾', label: 'Hiking boots', zone: 'feet' }, { e: '🦺', label: 'Safety vest', zone: 'torso' }, { e: '🧤', label: 'Mittens', zone: 'hand' }, { e: '⛑️', label: 'Hard hat', zone: 'head' }] },
  soccer: { title: 'Soccer game', emoji: '⚽', bg: 'linear-gradient(#bbf7d0, #86efac)', decor: ['🥅', '☀️', '🏆', '⚽'],
    slots: [{ zone: 'head', options: [o('🧢', 'Cap')] }, { zone: 'torso', options: [o('🎽', 'Jersey')] }, { zone: 'legs', options: [o('🩳', 'Shorts')] }, { zone: 'feet', options: [o('👟', 'Cleats')] }, { zone: 'hand', options: [o('⚽', 'Soccer ball')] }],
    wrong: [{ e: '👞', label: 'Dress shoes', zone: 'feet' }, { e: '🧥', label: 'Winter coat', zone: 'torso' }, { e: '☂️', label: 'Umbrella', zone: 'hand' }, { e: '👗', label: 'Party dress', zone: 'torso' }] },
  baseball: { title: 'Baseball game', emoji: '⚾', bg: 'linear-gradient(#bae6fd 0 50%, #bbf7d0 50%)', decor: ['☀️', '🏟️', '⚾', '🌭'],
    slots: [{ zone: 'head', options: [o('🧢', 'Baseball cap')] }, { zone: 'torso', options: [o('👕', 'Team shirt')] }, { zone: 'legs', options: [o('👖', 'Pants')] }, { zone: 'feet', options: [o('👟', 'Sneakers')] }, { zone: 'hand', options: [o('⚾', 'Baseball'), o('🌭', 'Hot dog')] }],
    wrong: [{ e: '🩱', label: 'Swimsuit', zone: 'torso' }, { e: '👞', label: 'Dress shoes', zone: 'feet' }, { e: '🎀', label: 'Bow', zone: 'head' }, { e: '☂️', label: 'Umbrella', zone: 'hand' }] },
  fall: { title: 'Fall leaves', emoji: '🍂', bg: 'linear-gradient(#fed7aa, #fdba74)', decor: ['🍁', '🌳', '🍂', '🎃'],
    slots: [{ zone: 'neck', options: [o('🧣', 'Scarf')] }, { zone: 'torso', options: [o('🧥', 'Jacket')] }, { zone: 'legs', options: [o('👖', 'Jeans')] }, { zone: 'feet', options: [o('🥾', 'Boots')] }, { zone: 'hand', options: [o('🍂', 'Leaves'), o('🎃', 'Pumpkin')] }],
    wrong: [{ e: '🩳', label: 'Shorts', zone: 'legs' }, { e: '🩱', label: 'Swimsuit', zone: 'torso' }, { e: '🩴', label: 'Flip-flops', zone: 'feet' }, { e: '🍦', label: 'Ice cream', zone: 'hand' }] },
  hiking: { title: 'Hiking trip', emoji: '🥾', bg: 'linear-gradient(#bae6fd 0 50%, #a3e635 50%)', decor: ['⛰️', '🌲', '🦅', '🌲'],
    slots: [{ zone: 'head', options: [o('🧢', 'Cap'), o('👒', 'Sun hat')] }, { zone: 'torso', options: [o('👕', 'T-shirt')] }, { zone: 'legs', options: [o('👖', 'Pants')] }, { zone: 'feet', options: [o('🥾', 'Hiking boots')] }, { zone: 'hand', options: [o('🎒', 'Backpack'), o('🧭', 'Compass')] }],
    wrong: [{ e: '👞', label: 'Dress shoes', zone: 'feet' }, { e: '🩴', label: 'Flip-flops', zone: 'feet' }, { e: '👗', label: 'Party dress', zone: 'torso' }, { e: '🎈', label: 'Balloon', zone: 'hand' }] },
  camping: { title: 'Camping at night', emoji: '🏕️', bg: 'linear-gradient(#c7d2fe, #a5b4fc)', decor: ['🌙', '⛺', '⭐', '🔥'],
    slots: [{ zone: 'head', options: [o('🧢', 'Cap')] }, { zone: 'torso', options: [o('🧥', 'Warm jacket')] }, { zone: 'legs', options: [o('👖', 'Pants')] }, { zone: 'feet', options: [o('🥾', 'Boots')] }, { zone: 'hand', options: [o('🔦', 'Flashlight')] }],
    wrong: [{ e: '🩱', label: 'Swimsuit', zone: 'torso' }, { e: '🥿', label: 'Flat shoes', zone: 'feet' }, { e: '👑', label: 'Crown', zone: 'head' }, { e: '🍦', label: 'Ice cream', zone: 'hand' }] },
  gardening: { title: 'Working in the garden', emoji: '🌱', bg: 'linear-gradient(#fef9c3 0 45%, #a16207 45%)', decor: ['☀️', '🌻', '🐝', '🌷'],
    slots: [{ zone: 'head', options: [o('👒', 'Sun hat')] }, { zone: 'torso', options: [o('👕', 'Old T-shirt')] }, { zone: 'legs', options: [o('👖', 'Work pants')] }, { zone: 'feet', options: [o('🥾', 'Boots')] }, { zone: 'hand', options: [o('🪴', 'Plant'), o('🌱', 'Seedling')] }],
    wrong: [{ e: '👔', label: 'Dress shirt', zone: 'torso' }, { e: '🩱', label: 'Swimsuit', zone: 'torso' }, { e: '👑', label: 'Crown', zone: 'head' }, { e: '🛟', label: 'Swim ring', zone: 'hand' }] },
  construction: { title: 'Construction worker', emoji: '👷', bg: 'linear-gradient(#fef08a, #facc15)', decor: ['🏗️', '🚧', '🧱', '🚜'],
    slots: [{ zone: 'head', options: [o('⛑️', 'Hard hat')] }, { zone: 'torso', options: [o('🦺', 'Safety vest')] }, { zone: 'legs', options: [o('👖', 'Work pants')] }, { zone: 'feet', options: [o('🥾', 'Work boots')] }, { zone: 'hand', options: [o('🔨', 'Hammer'), o('🔧', 'Wrench')] }],
    wrong: [{ e: '🩴', label: 'Flip-flops', zone: 'feet' }, { e: '👗', label: 'Party dress', zone: 'torso' }, { e: '🎀', label: 'Bow', zone: 'head' }, { e: '🩱', label: 'Swimsuit', zone: 'torso' }] },
  doctor: { title: 'Doctor at work', emoji: '🩺', bg: 'linear-gradient(#e0f2fe, #f0f9ff)', decor: ['🏥', '💊', '❤️', '🩹'],
    slots: [{ zone: 'neck', options: [o('🩺', 'Stethoscope')] }, { zone: 'torso', options: [o('🥼', 'White coat')] }, { zone: 'legs', options: [o('👖', 'Pants')] }, { zone: 'feet', options: [o('👟', 'Comfy shoes')] }, { zone: 'hand', options: [o('📋', 'Clipboard')] }],
    wrong: [{ e: '🩱', label: 'Swimsuit', zone: 'torso' }, { e: '⛑️', label: 'Hard hat', zone: 'head' }, { e: '🍦', label: 'Ice cream', zone: 'hand' }, { e: '🩴', label: 'Flip-flops', zone: 'feet' }] },
  skating: { title: 'Ice skating', emoji: '⛸️', bg: 'linear-gradient(#e0f2fe, #bae6fd)', decor: ['❄️', '⛄', '❄️', '🌲'],
    slots: [{ zone: 'neck', options: [o('🧣', 'Scarf')] }, { zone: 'torso', options: [o('🧥', 'Warm coat')] }, { zone: 'legs', options: [o('👖', 'Warm pants')] }, { zone: 'feet', options: [o('⛸️', 'Ice skates')] }, { zone: 'hand', options: [o('🧤', 'Mittens')] }],
    wrong: [{ e: '🩴', label: 'Flip-flops', zone: 'feet' }, { e: '🩱', label: 'Swimsuit', zone: 'torso' }, { e: '👒', label: 'Sun hat', zone: 'head' }, { e: '🍦', label: 'Ice cream', zone: 'hand' }] },
  graduation: { title: 'Graduation day', emoji: '🎓', bg: 'linear-gradient(#ede9fe, #ddd6fe)', decor: ['🎉', '🏫', '⭐', '🎊'],
    slots: [{ zone: 'head', options: [o('🎓', 'Graduation cap')] }, { zone: 'torso', options: [o('👔', 'Dress shirt')] }, { zone: 'legs', options: [o('👖', 'Nice pants')] }, { zone: 'feet', options: [o('👞', 'Dress shoes')] }, { zone: 'hand', options: [o('📜', 'Diploma')] }],
    wrong: [{ e: '🥾', label: 'Hiking boots', zone: 'feet' }, { e: '🩱', label: 'Swimsuit', zone: 'torso' }, { e: '🧤', label: 'Mittens', zone: 'hand' }, { e: '🛟', label: 'Swim ring', zone: 'hand' }] },
  art: { title: 'Art class', emoji: '🎨', bg: 'linear-gradient(#fae8ff, #f5d0fe)', decor: ['🖼️', '✏️', '🌈', '🖍️'],
    slots: [{ zone: 'torso', options: [o('🥼', 'Paint smock')] }, { zone: 'legs', options: [o('👖', 'Old pants')] }, { zone: 'feet', options: [o('👟', 'Sneakers')] }, { zone: 'hand', options: [o('🎨', 'Paint palette'), o('🖌️', 'Paintbrush')] }],
    wrong: [{ e: '🧤', label: 'Mittens', zone: 'hand' }, { e: '👑', label: 'Crown', zone: 'head' }, { e: '🩱', label: 'Swimsuit', zone: 'torso' }, { e: '👢', label: 'Snow boots', zone: 'feet' }] },
}

// Things that come in pairs show on both feet / both hands (the left one
// mirrored so they look like a real pair); things you hold go in one hand.
const PAIRED_HANDS = new Set(['🧤'])
function wornAt(i: Item): { x: number; y: number; size: number; flip?: boolean }[] {
  if (i.zone === 'feet') return [{ x: 40, y: 89, size: 20, flip: true }, { x: 60, y: 89, size: 20 }]
  if (i.zone === 'hand' && PAIRED_HANDS.has(i.e)) return [{ x: 23, y: 52, size: 16, flip: true }, { x: 77, y: 52, size: 16 }]
  if (i.e === '👗') return [{ x: 50, y: 50, size: 56 }]
  // Held things sit just above the hand so the hand looks like it's gripping them.
  if (i.zone === 'hand') return [{ x: 79, y: 45, size: 22 }]
  const z = ZONES[i.zone]
  return [{ x: z.x, y: z.y, size: z.size }]
}

const SKIN = ['#f9d7b5', '#e8b98f', '#c68a5b', '#8d5a3b', '#5c3a25']

function Doll({ skin }: { skin: string }) {
  return (
    <svg viewBox="0 0 100 140" className="absolute inset-0 w-full h-full" aria-hidden>
      <circle cx="50" cy="16" r="11" fill={skin} />
      <rect x="45" y="26" width="10" height="6" fill={skin} />
      <rect x="33" y="31" width="34" height="38" rx="9" fill={skin} />
      <rect x="18" y="33" width="10" height="36" rx="5" fill={skin} transform="rotate(8 23 33)" />
      <rect x="72" y="33" width="10" height="36" rx="5" fill={skin} transform="rotate(-8 77 33)" />
      <rect x="37" y="66" width="11" height="54" rx="5" fill={skin} />
      <rect x="52" y="66" width="11" height="54" rx="5" fill={skin} />
      <ellipse cx="42" cy="124" rx="8" ry="4" fill={skin} />
      <ellipse cx="58" cy="124" rx="8" ry="4" fill={skin} />
    </svg>
  )
}

// Hands drawn on top of the clothes, so short sleeves still show hands and
// held things (ice cream, umbrella) look gripped.
function Hands({ skin }: { skin: string }) {
  return (
    <svg viewBox="0 0 100 140" className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden>
      <circle cx="23" cy="72" r="6" fill={skin} stroke="#00000022" strokeWidth="0.8" />
      <circle cx="77" cy="72" r="6" fill={skin} stroke="#00000022" strokeWidth="0.8" />
    </svg>
  )
}

function Done({ text }: { text: string }) {
  useSignalComplete()
  return <p className="text-center text-2xl font-bold text-green-600 mt-4">{text}</p>
}

export default function DressUp({ scenario, distractors }: { scenario: string; distractors: number }) {
  const sc = DRESSUP_SCENARIOS[scenario] ?? DRESSUP_SCENARIOS.snow
  // Pick one option per spot and a random few wrong things — different each time.
  const items = useMemo(() => sc.slots.map(sl => ({ ...sl.options[Math.floor(Math.random() * sl.options.length)], zone: sl.zone })), [sc])
  const tray = useMemo(() => {
    const wrong = [...sc.wrong].sort(() => Math.random() - 0.5).filter(w => !items.some(i => i.e === w.e)).slice(0, distractors)
    const all = [...items.map(i => ({ ...i, ok: true })), ...wrong.map(i => ({ ...i, ok: false }))]
    for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [all[i], all[j]] = [all[j], all[i]] }
    return all
  }, [sc, items, distractors])
  const [skin, setSkin] = useState(SKIN[2])
  const [placed, setPlaced] = useState<string[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [wiggle, setWiggle] = useState<number | null>(null)
  const [hint, setHint] = useState('')
  const dollRef = useRef<HTMLDivElement>(null)
  const done = items.every(i => placed.includes(i.e + i.zone))

  function zoneAt(x: number, y: number): Zone | null {
    const r = dollRef.current?.getBoundingClientRect()
    if (!r || x < r.left || x > r.right || y < r.top || y > r.bottom) return null
    const px = ((x - r.left) / r.width) * 100, py = ((y - r.top) / r.height) * 100
    let best: Zone | null = null, bestD = 999
    for (const [z, p] of Object.entries(ZONES) as [Zone, typeof ZONES[Zone]][]) {
      const d = Math.hypot(px - p.x, (py - p.y) * 0.8)
      if (d < bestD) { best = z; bestD = d }
    }
    return bestD < 28 ? best : null
  }

  function place(idx: number, zone: Zone | null) {
    const it = tray[idx]
    if (!zone) return
    if (!it.ok) {
      setWiggle(idx); setHint(`Not for ${sc.title.toLowerCase()} — try something else!`)
      setTimeout(() => { setWiggle(null); setHint('') }, 1400)
    } else if (it.zone === zone) {
      setPlaced(p => [...p, it.e + it.zone]); setSelected(null); setHint('')
    } else {
      setWiggle(idx); setTimeout(() => setWiggle(null), 500)
    }
  }

  return (
    <div className="select-none">
      <p className="text-center text-lg font-bold text-gray-800">{sc.emoji} {sc.title}</p>
      <p className="text-center text-gray-500 mb-2">
        {selected !== null ? <b className="text-blue-700">Now poke where the {tray[selected].label.toLowerCase()} goes ☝️</b> : <>Poke something to pick it up, then poke where it goes.{distractors > 0 ? ' Look at the picture — not everything belongs!' : ''}</>}
      </p>
      <div className="flex justify-center gap-1.5 mb-2">
        {SKIN.map(c => <button key={c} type="button" onClick={() => setSkin(c)} aria-label="skin tone"
          className={`w-7 h-7 rounded-full border-2 ${skin === c ? 'border-blue-600 scale-110' : 'border-white shadow'}`} style={{ background: c }} />)}
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <div ref={dollRef} className="relative w-56 sm:w-64 aspect-[100/140] rounded-2xl border-4 border-gray-300"
          style={{ background: sc.bg }}
          onClick={e => { if (selected !== null) place(selected, zoneAt(e.clientX, e.clientY)) }}>
          {/* Scene decorations — so the speller can tell where they're going */}
          {sc.decor.map((d, i) => (
            <span key={i} className="absolute text-2xl sm:text-3xl opacity-70 pointer-events-none" style={{ left: `${[8, 92, 10, 90][i]}%`, top: `${[8, 10, 78, 80][i]}%`, transform: 'translate(-50%, -50%)' }}>{d}</span>
          ))}
          <Doll skin={skin} />
          {/* Poke targets while something is picked up */}
          {selected !== null && (Object.entries(ZONES) as [Zone, typeof ZONES[Zone]][]).filter(([z]) => !items.some(i => i.zone === z && placed.includes(i.e + i.zone))).map(([z, p]) => (
            <span key={z} className="absolute rounded-full border-4 border-dashed border-blue-500/70 bg-white/30 pointer-events-none animate-pulse"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: '22%', aspectRatio: '1', transform: 'translate(-50%, -50%)' }} />
          ))}
          {(() => {
            const worn = items.filter(i => placed.includes(i.e + i.zone))
            const draw = (list: Item[]) => list.flatMap(i => wornAt(i).map((spot, k) => (
              <span key={i.e + i.zone + k} className="absolute leading-none pointer-events-none"
                style={{ left: `${spot.x}%`, top: `${spot.y}%`, transform: `translate(-50%, -50%)${spot.flip ? ' scaleX(-1)' : ''}`, fontSize: `calc(${spot.size} * 0.01 * min(16rem, 56vw))` }}>{i.e}</span>
            )))
            return (
              <>
                {draw(worn.filter(i => i.zone !== 'hand'))}
                {draw(worn.filter(i => i.zone === 'hand' && !PAIRED_HANDS.has(i.e)))}
                <Hands skin={skin} />
                {draw(worn.filter(i => i.zone === 'hand' && PAIRED_HANDS.has(i.e)))}
              </>
            )
          })()}
        </div>
        {!done && (
          <div className="grid grid-cols-4 sm:grid-cols-2 gap-2">
            {tray.map((it, idx) => placed.includes(it.e + it.zone) && it.ok ? null : (
              <button key={idx} type="button"
                onClick={() => setSelected(selected === idx ? null : idx)}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-4 bg-white flex flex-col items-center justify-center transition-transform ${selected === idx ? 'border-blue-500 -translate-y-2 shadow-lg animate-bounce' : wiggle === idx ? 'border-red-400 animate-bounce' : 'border-gray-200 shadow'}`}>
                <span className="text-3xl sm:text-4xl leading-none">{it.e}</span>
                <span className="text-[10px] text-gray-600 mt-0.5">{it.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {hint && <p className="text-center text-amber-700 font-semibold mt-3">{hint}</p>}
      {done && <Done text={`🎉 All dressed for ${sc.title.toLowerCase()}!`} />}
    </div>
  )
}
