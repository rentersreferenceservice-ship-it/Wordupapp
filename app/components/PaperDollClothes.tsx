'use client'

// Paper-doll clothes drawn to fit the doll exactly (same 100×140 drawing
// space as the doll), so a shirt covers the body with sleeves over the arms,
// pants go down both legs, shoes sit on both feet, and so on. The tray shows
// the same drawing, so what you pick is what you see on the doll.
// Held things (ice cream, umbrella, ball…) stay as emoji in the hand.

export type ClothKind =
  | 'tshirt' | 'tank' | 'jersey' | 'blouse' | 'dressshirt' | 'coat' | 'raincoat' | 'labcoat' | 'smock' | 'vest' | 'dress' | 'swimsuit'
  | 'pants' | 'jeans' | 'snowpants' | 'shorts' | 'trunks'
  | 'sneakers' | 'cleats' | 'boots' | 'snowboots' | 'sandals' | 'flipflops' | 'dressshoes' | 'flats' | 'skates'
  | 'cap' | 'sunhat' | 'crown' | 'bow' | 'hardhat' | 'gradcap' | 'goggles' | 'sunglasses'
  | 'scarf' | 'stethoscope' | 'mittens'

export interface Cloth { kind: ClothKind; color: string }

// Which drawing each clothing label uses.
export const CLOTHES: Record<string, Cloth> = {
  'Ski goggles': { kind: 'goggles', color: '#f97316' }, 'Swim goggles': { kind: 'goggles', color: '#0ea5e9' },
  'Sunglasses': { kind: 'sunglasses', color: '#111827' },
  'Cap': { kind: 'cap', color: '#dc2626' }, 'Baseball cap': { kind: 'cap', color: '#1d4ed8' }, 'Sun hat': { kind: 'sunhat', color: '#fbbf24' },
  'Party crown': { kind: 'crown', color: '#facc15' }, 'Crown': { kind: 'crown', color: '#facc15' }, 'Bow': { kind: 'bow', color: '#ec4899' },
  'Hard hat': { kind: 'hardhat', color: '#facc15' }, 'Graduation cap': { kind: 'gradcap', color: '#111827' },
  'Scarf': { kind: 'scarf', color: '#dc2626' }, 'Stethoscope': { kind: 'stethoscope', color: '#475569' },
  'T-shirt': { kind: 'tshirt', color: '#22c55e' }, 'Shirt': { kind: 'tshirt', color: '#3b82f6' }, 'Old T-shirt': { kind: 'tshirt', color: '#9ca3af' },
  'Tank top': { kind: 'tank', color: '#f472b6' }, 'Team shirt': { kind: 'jersey', color: '#dc2626' }, 'Jersey': { kind: 'jersey', color: '#2563eb' },
  'Blouse': { kind: 'blouse', color: '#f9a8d4' }, 'Dress shirt': { kind: 'dressshirt', color: '#f8fafc' },
  'Winter coat': { kind: 'coat', color: '#2563eb' }, 'Jacket': { kind: 'coat', color: '#b45309' }, 'Warm jacket': { kind: 'coat', color: '#15803d' },
  'Warm coat': { kind: 'coat', color: '#7c3aed' }, 'Raincoat': { kind: 'raincoat', color: '#facc15' },
  'White coat': { kind: 'labcoat', color: '#f8fafc' }, 'Paint smock': { kind: 'smock', color: '#fde68a' },
  'Safety vest': { kind: 'vest', color: '#f97316' }, 'Party dress': { kind: 'dress', color: '#a855f7' }, 'Swimsuit': { kind: 'swimsuit', color: '#06b6d4' },
  'Pants': { kind: 'pants', color: '#475569' }, 'Nice pants': { kind: 'pants', color: '#1f2937' }, 'Work pants': { kind: 'pants', color: '#78350f' },
  'Old pants': { kind: 'pants', color: '#64748b' }, 'Jeans': { kind: 'jeans', color: '#1d4ed8' },
  'Snow pants': { kind: 'snowpants', color: '#1e3a8a' }, 'Warm pants': { kind: 'snowpants', color: '#334155' },
  'Shorts': { kind: 'shorts', color: '#0ea5e9' }, 'Swim trunks': { kind: 'trunks', color: '#f97316' },
  'Sneakers': { kind: 'sneakers', color: '#ef4444' }, 'Comfy shoes': { kind: 'sneakers', color: '#60a5fa' }, 'Cleats': { kind: 'cleats', color: '#111827' },
  'Boots': { kind: 'boots', color: '#92400e' }, 'Hiking boots': { kind: 'boots', color: '#713f12' }, 'Work boots': { kind: 'boots', color: '#a16207' },
  'Rain boots': { kind: 'boots', color: '#eab308' }, 'Snow boots': { kind: 'snowboots', color: '#78350f' },
  'Sandals': { kind: 'sandals', color: '#a16207' }, 'Flip-flops': { kind: 'flipflops', color: '#ec4899' },
  'Dress shoes': { kind: 'dressshoes', color: '#111827' }, 'Flat shoes': { kind: 'flats', color: '#ec4899' }, 'Ice skates': { kind: 'skates', color: '#f8fafc' },
  'Mittens': { kind: 'mittens', color: '#dc2626' },
}

// The doll's body, in the same drawing space as the clothes.
export function Doll({ skin }: { skin: string }) {
  return (
    <g>
      <circle cx="50" cy="16" r="11" fill={skin} />
      <rect x="45" y="25" width="10" height="8" fill={skin} />
      <rect x="22" y="32" width="10" height="37" rx="5" fill={skin} />
      <rect x="68" y="32" width="10" height="37" rx="5" fill={skin} />
      <rect x="33" y="31" width="34" height="38" rx="8" fill={skin} />
      <rect x="37" y="66" width="11" height="54" rx="5" fill={skin} />
      <rect x="52" y="66" width="11" height="54" rx="5" fill={skin} />
      <ellipse cx="42" cy="123" rx="8" ry="4" fill={skin} />
      <ellipse cx="58" cy="123" rx="8" ry="4" fill={skin} />
      <circle cx="46" cy="15" r="1.2" fill="#1f2937" /><circle cx="54" cy="15" r="1.2" fill="#1f2937" />
      <path d="M46 20 Q50 23 54 20" stroke="#1f2937" strokeWidth="1" fill="none" strokeLinecap="round" />
    </g>
  )
}

/** Hands, drawn above sleeves so they always show (and grip held things). */
export function Hands({ skin }: { skin: string }) {
  return (
    <g>
      <circle cx="27" cy="72" r="5.5" fill={skin} stroke="#00000022" strokeWidth="0.6" />
      <circle cx="73" cy="72" r="5.5" fill={skin} stroke="#00000022" strokeWidth="0.6" />
    </g>
  )
}

const dark = '#0000002e'
const sleeves = (c: string, long: boolean) => (
  <>
    <rect x="20" y="31" width="14" height={long ? 38 : 15} rx="6" fill={c} />
    <rect x="66" y="31" width="14" height={long ? 38 : 15} rx="6" fill={c} />
  </>
)
const legs = (c: string, bottom: number, width = 13) => (
  <>
    <rect x="35" y="63" width="30" height="9" rx="3" fill={c} />
    <rect x={42.5 - width / 2} y="68" width={width} height={bottom - 68} rx="4" fill={c} />
    <rect x={57.5 - width / 2} y="68" width={width} height={bottom - 68} rx="4" fill={c} />
  </>
)
const bothFeet = (draw: (cx: number) => React.ReactNode) => <>{draw(42)}{draw(58)}</>

/** One piece of clothing, drawn to fit the doll. */
export function ClothingSvg({ kind, color: c }: Cloth) {
  switch (kind) {
    case 'tshirt': case 'jersey': case 'blouse':
      return (
        <g>
          {sleeves(c, false)}
          <rect x="32" y="30" width="36" height="36" rx="7" fill={c} />
          <path d="M44 30 Q50 36 56 30" stroke={dark} strokeWidth="1.5" fill="none" />
          {kind === 'jersey' && <text x="50" y="54" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#fff" fontFamily="Arial">10</text>}
          {kind === 'blouse' && <><path d="M44 30 L50 37 L46 39 Z" fill="#fff" /><path d="M56 30 L50 37 L54 39 Z" fill="#fff" /></>}
        </g>
      )
    case 'tank':
      return <g><rect x="34" y="34" width="32" height="32" rx="6" fill={c} /><rect x="37" y="30" width="4" height="7" fill={c} /><rect x="59" y="30" width="4" height="7" fill={c} /></g>
    case 'dressshirt':
      return (
        <g>
          {sleeves(c, true)}
          <rect x="32" y="30" width="36" height="37" rx="7" fill={c} stroke="#cbd5e1" strokeWidth="0.8" />
          <path d="M48 31 L52 31 L53 35 L51 52 L50 55 L49 52 L47 35 Z" fill="#dc2626" />
          <path d="M44 30 L48 35 M56 30 L52 35" stroke="#94a3b8" strokeWidth="1" />
        </g>
      )
    case 'coat': case 'raincoat':
      return (
        <g>
          {sleeves(c, true)}
          <rect x="31" y="30" width="38" height="43" rx="7" fill={c} />
          <line x1="50" y1="33" x2="50" y2="73" stroke={dark} strokeWidth="1.2" />
          {[40, 50, 60].map(y => <circle key={y} cx="53" cy={y} r="1.6" fill={dark} />)}
          <path d="M43 30 L50 37 L57 30" stroke={dark} strokeWidth="1.5" fill="none" />
          {kind === 'raincoat' && <rect x="31" y="66" width="38" height="3" fill={dark} />}
        </g>
      )
    case 'labcoat': case 'smock':
      return (
        <g>
          {sleeves(c, true)}
          <rect x="31" y="30" width="38" height="60" rx="6" fill={c} stroke="#cbd5e1" strokeWidth="0.8" />
          <path d="M43 30 L50 42 L57 30" stroke="#94a3b8" strokeWidth="1.2" fill="none" />
          <line x1="50" y1="42" x2="50" y2="90" stroke="#94a3b8" strokeWidth="1" />
          {kind === 'labcoat' ? <rect x="56" y="50" width="8" height="7" rx="1" fill="none" stroke="#94a3b8" strokeWidth="1" />
            : <>{[[40, 50, '#ef4444'], [58, 62, '#3b82f6'], [44, 74, '#22c55e'], [60, 80, '#a855f7']].map(([x, y, col]) => <circle key={`${x}${y}`} cx={x as number} cy={y as number} r="2.4" fill={col as string} />)}</>}
        </g>
      )
    case 'vest':
      return (
        <g>
          <rect x="33" y="31" width="34" height="36" rx="6" fill={c} />
          <path d="M44 31 L50 42 L56 31" fill="#00000033" />
          <rect x="33" y="47" width="34" height="3" fill="#e5e7eb" /><rect x="33" y="58" width="34" height="3" fill="#e5e7eb" />
        </g>
      )
    case 'dress':
      return (
        <g>
          <rect x="22" y="31" width="12" height="9" rx="4" fill={c} /><rect x="66" y="31" width="12" height="9" rx="4" fill={c} />
          <rect x="34" y="30" width="32" height="30" rx="6" fill={c} />
          <path d="M34 56 L66 56 L77 96 L23 96 Z" fill={c} />
          <rect x="34" y="55" width="32" height="3" fill={dark} />
        </g>
      )
    case 'swimsuit':
      return <g><rect x="34" y="40" width="32" height="30" rx="7" fill={c} /><rect x="38" y="30" width="3" height="12" fill={c} /><rect x="59" y="30" width="3" height="12" fill={c} /></g>
    case 'pants': return <g>{legs(c, 119)}</g>
    case 'jeans':
      return <g>{legs(c, 119)}<line x1="42.5" y1="72" x2="42.5" y2="117" stroke="#93c5fd" strokeWidth="0.7" strokeDasharray="2 1.5" /><line x1="57.5" y1="72" x2="57.5" y2="117" stroke="#93c5fd" strokeWidth="0.7" strokeDasharray="2 1.5" /></g>
    case 'snowpants': return <g>{legs(c, 119, 15)}</g>
    case 'shorts': return <g>{legs(c, 88, 15)}</g>
    case 'trunks': return <g>{legs(c, 80, 15)}</g>
    case 'sneakers': case 'cleats':
      return bothFeet(cx => (
        <g key={cx}>
          <rect x={cx - 9} y="116" width="18" height="10" rx="4" fill={c} />
          <rect x={cx - 9} y="124" width="18" height="3" rx="1.5" fill={kind === 'cleats' ? '#9ca3af' : '#fff'} />
          {kind === 'cleats' && [cx - 6, cx, cx + 6].map(x => <rect key={x} x={x - 1} y="127" width="2" height="2" fill="#6b7280" />)}
        </g>
      ))
    case 'boots': case 'snowboots':
      return bothFeet(cx => (
        <g key={cx}>
          <rect x={cx - 7} y="103" width="14" height="20" rx="3" fill={c} />
          <rect x={cx - 9} y="116" width="18" height="10" rx="4" fill={c} />
          <rect x={cx - 9} y="124" width="18" height="3" rx="1.5" fill="#1f2937" />
          {kind === 'snowboots' && <rect x={cx - 8} y="101" width="16" height="5" rx="2.5" fill="#f8fafc" />}
        </g>
      ))
    case 'sandals': case 'flipflops':
      return bothFeet(cx => (
        <g key={cx}>
          <rect x={cx - 9} y="124" width="18" height="3" rx="1.5" fill={c} />
          {kind === 'sandals'
            ? <><rect x={cx - 8} y="119" width="16" height="2.2" fill={c} /><rect x={cx - 8} y="122" width="16" height="2" fill={c} /></>
            : <path d={`M${cx - 6} 124 L${cx} 119 L${cx + 6} 124`} stroke={c} strokeWidth="1.8" fill="none" />}
        </g>
      ))
    case 'dressshoes': case 'flats':
      return bothFeet(cx => (
        <g key={cx}>
          <rect x={cx - 9} y={kind === 'flats' ? 120 : 118} width="18" height={kind === 'flats' ? 7 : 9} rx="4" fill={c} />
          <ellipse cx={cx - 3} cy="121" rx="2.5" ry="1" fill="#ffffff66" />
        </g>
      ))
    case 'skates':
      return bothFeet(cx => (
        <g key={cx}>
          <rect x={cx - 7} y="104" width="14" height="20" rx="3" fill={c} stroke="#cbd5e1" strokeWidth="0.8" />
          <rect x={cx - 9} y="116" width="18" height="9" rx="4" fill={c} stroke="#cbd5e1" strokeWidth="0.8" />
          <rect x={cx - 10} y="128" width="20" height="1.6" fill="#94a3b8" />
          <line x1={cx - 5} y1="125" x2={cx - 5} y2="128" stroke="#94a3b8" /><line x1={cx + 5} y1="125" x2={cx + 5} y2="128" stroke="#94a3b8" />
        </g>
      ))
    case 'cap':
      return <g><path d="M38.5 12 Q50 -1 61.5 12 Z" fill={c} /><path d="M58 10.5 L74 12.5 L58 13.5 Z" fill={c} /><rect x="38" y="11" width="24" height="2.5" fill={dark} /></g>
    case 'sunhat':
      return <g><ellipse cx="50" cy="10.5" rx="23" ry="4" fill={c} /><path d="M39.5 10 Q50 -4 60.5 10 Z" fill={c} /><rect x="40" y="7" width="20" height="2.5" fill="#dc2626" /></g>
    case 'crown':
      return <g><polygon points="39,10 41.5,1 46,7 50,0 54,7 58.5,1 61,10" fill={c} /><rect x="39" y="9" width="22" height="3" fill={c} /><circle cx="50" cy="5" r="1.4" fill="#ef4444" /></g>
    case 'bow':
      return <g><path d="M60 7 L52 2 L52 12 Z" fill={c} /><path d="M60 7 L68 2 L68 12 Z" fill={c} /><circle cx="60" cy="7" r="2.2" fill={c} stroke={dark} /></g>
    case 'hardhat':
      return <g><path d="M38 13 Q50 -3 62 13 Z" fill={c} /><rect x="34" y="12" width="32" height="3" rx="1.5" fill={c} /><rect x="49" y="3" width="2" height="9" fill={dark} /></g>
    case 'gradcap':
      return <g><rect x="41" y="7" width="18" height="6" fill={c} /><polygon points="32,6 50,0 68,6 50,12" fill={c} /><path d="M50 6 L65 7 L65 15" stroke="#facc15" strokeWidth="1.2" fill="none" /><circle cx="65" cy="16" r="1.4" fill="#facc15" /></g>
    case 'goggles':
      return <g><rect x="37" y="12.5" width="26" height="4" rx="2" fill="#1f2937" /><ellipse cx="45" cy="14.5" rx="5" ry="3.8" fill={c} stroke="#1f2937" strokeWidth="0.8" /><ellipse cx="55" cy="14.5" rx="5" ry="3.8" fill={c} stroke="#1f2937" strokeWidth="0.8" /></g>
    case 'sunglasses':
      return <g><ellipse cx="45" cy="15" rx="4.5" ry="3.3" fill={c} /><ellipse cx="55" cy="15" rx="4.5" ry="3.3" fill={c} /><line x1="49" y1="14.5" x2="51" y2="14.5" stroke={c} strokeWidth="1" /></g>
    case 'scarf':
      return <g><rect x="41" y="24" width="18" height="8" rx="3.5" fill={c} /><rect x="51" y="29" width="7" height="18" rx="2" fill={c} /><rect x="51" y="44" width="7" height="3" fill={dark} /></g>
    case 'stethoscope':
      return <g><path d="M43 28 Q44 46 50 47 Q56 46 57 28" stroke={c} strokeWidth="1.8" fill="none" /><circle cx="50" cy="50" r="3" fill="#9ca3af" stroke={c} strokeWidth="1" /></g>
    case 'mittens':
      return (
        <g>
          {[27, 73].map(cx => (
            <g key={cx}>
              <rect x={cx - 6.5} y="66" width="13" height="13" rx="6" fill={c} />
              <ellipse cx={cx < 50 ? cx + 6 : cx - 6} cy="71" rx="2.6" ry="3.4" fill={c} />
              <rect x={cx - 6.5} y="65" width="13" height="3" rx="1.5" fill="#f8fafc" />
            </g>
          ))}
        </g>
      )
  }
}

// Drawing order on the doll (later = on top).
export const LAYER: Record<string, number> = { legs: 1, feet: 2, torso: 3, neck: 4, head: 5, hand: 6 }

// The part of the drawing to show for a tray preview, by where it goes.
export const PREVIEW_BOX: Record<string, string> = {
  head: '28 -4 48 26', neck: '36 21 28 30', torso: '16 27 68 66', legs: '30 60 40 62', feet: '30 99 40 31', hand: '17 62 66 20',
}
