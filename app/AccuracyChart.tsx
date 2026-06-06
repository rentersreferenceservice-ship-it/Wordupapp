'use client'

import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceArea } from 'recharts'
import type { SessionAccuracy } from '@/lib/practitionerStore'

const PERIODS = [
  { label: '1M', months: 1 },
  { label: '3M', months: 3 },
  { label: '6M', months: 6 },
  { label: '9M', months: 9 },
  { label: '12M', months: 12 },
]

const PRACTITIONER_COLOR = '#2563eb'

interface Facilitator {
  key: string
  name: string
  color: string
}

interface TooltipEntry {
  accuracy: number
  date: string
  lessonTitle: string
  regulationArrival: string | null
  regulationDeparture: string | null
  facilitatorName: string
  facilitatorColor: string
}

function regLabel(val: string | null) {
  if (val === 'regulated') return '● Regulated'
  if (val === 'dysregulated') return '● Dysregulated'
  return null
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: TooltipEntry }[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const arrived = regLabel(d.regulationArrival)
  const departed = regLabel(d.regulationDeparture)
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-xs">
      <p className="font-bold text-gray-900">{d.accuracy}%</p>
      <p className="text-gray-500">{d.date}</p>
      {d.lessonTitle && <p className="text-gray-400 truncate max-w-[180px]">{d.lessonTitle}</p>}
      <p className="font-semibold mt-0.5" style={{ color: d.facilitatorColor }}>{d.facilitatorName}</p>
      {arrived && <p className={`font-semibold mt-0.5 ${d.regulationArrival === 'regulated' ? 'text-green-600' : 'text-yellow-600'}`}>Arrived: {arrived}</p>}
      {departed && <p className={`font-semibold ${d.regulationDeparture === 'regulated' ? 'text-green-600' : 'text-yellow-600'}`}>Departed: {departed}</p>}
    </div>
  )
}

export default function AccuracyChart({ data, currentSessionId }: { data: SessionAccuracy[]; currentSessionId?: string }) {
  const [months, setMonths] = useState(12)

  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - months)
  const filtered = data
    .filter(s => new Date(s.date + 'T00:00:00') >= cutoff)
    .sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : a.sessionId.localeCompare(b.sessionId))

  const periodSelector = (
    <div className="flex gap-1 mb-4">
      {PERIODS.map(p => (
        <button
          key={p.months}
          onClick={() => setMonths(p.months)}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            months === p.months ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  )

  if (data.length === 0) {
    return <p className="text-xs text-gray-400 text-center py-4">No completed sessions with spelling data yet.</p>
  }

  if (filtered.length === 0) {
    return (
      <>
        {periodSelector}
        <p className="text-xs text-gray-400 text-center py-4">No sessions in the selected period.</p>
      </>
    )
  }

  if (filtered.length === 1) {
    const s = filtered[0]
    const name = s.crpName ?? 'Practitioner'
    const color = s.crpColor ?? PRACTITIONER_COLOR
    return (
      <>
        {periodSelector}
        <div className="text-center py-4">
          <p className="text-2xl font-bold" style={{ color }}>{s.accuracy}%</p>
          <p className="text-xs text-gray-400 mt-1">One session in this period — more sessions will show a trend</p>
          <p className="text-xs mt-1 font-semibold" style={{ color }}>{name}</p>
        </div>
      </>
    )
  }

  // Build facilitator list (preserving insertion order: practitioner first, then CRPs by first appearance)
  const facilitatorMap = new Map<string, Facilitator>()
  for (const s of filtered) {
    const key = s.crpId ? `crp_${s.crpId}` : 'practitioner'
    if (!facilitatorMap.has(key)) {
      facilitatorMap.set(key, {
        key,
        name: s.crpName ?? 'Practitioner',
        color: s.crpColor ?? PRACTITIONER_COLOR,
      })
    }
  }
  const facilitators = Array.from(facilitatorMap.values())

  const hasRegulation = filtered.some(s => s.regulationArrival || s.regulationDeparture)

  const accuracies = filtered.map(s => s.accuracy)
  const dataMin = Math.min(...accuracies)
  const dataMax = Math.max(...accuracies)
  const yFloor = Math.max(0, Math.floor(dataMin / 10) * 10 - 10)
  const yCeil = Math.min(100, Math.ceil(dataMax / 10) * 10 + 5)
  const regTop = yCeil + 4
  const regBottom = yFloor - 4
  const yMin = hasRegulation ? yFloor - 8 : yFloor
  const yMax = hasRegulation ? yCeil + 8 : yCeil

  // One chart entry per session; only the owning facilitator's key has a value
  const chartData = filtered.map((s, i) => {
    const key = s.crpId ? `crp_${s.crpId}` : 'practitioner'
    const fac = facilitatorMap.get(key)!
    const entry: Record<string, unknown> = {
      idx: i,
      date: new Date(s.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      lessonTitle: s.lessonTitle ?? '',
      regulationArrival: s.regulationArrival ?? null,
      regulationDeparture: s.regulationDeparture ?? null,
      facilitatorName: fac.name,
      facilitatorColor: fac.color,
      isCurrent: s.sessionId === currentSessionId,
      arrived: s.regulationArrival ? regTop : undefined,
      departed: s.regulationDeparture ? regBottom : undefined,
      accuracy: s.accuracy,
    }
    // Set this session's value on its facilitator key
    entry[key] = s.accuracy
    return entry
  })

  const tickStep = (yCeil - yFloor) <= 20 ? 5 : (yCeil - yFloor) <= 40 ? 10 : 25
  const yTicks: number[] = []
  for (let t = Math.ceil(yFloor / tickStep) * tickStep; t <= yCeil; t += tickStep) yTicks.push(t)

  return (
    <>
      {periodSelector}
      <ResponsiveContainer width="100%" height={hasRegulation ? 220 : 180}>
        <LineChart data={chartData} margin={{ top: 4, right: 20, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />

          {hasRegulation && <>
            <ReferenceArea y1={yCeil} y2={yMax} fill="#f0fdf4" fillOpacity={0.9} />
            <ReferenceArea y1={yMin} y2={yFloor} fill="#fefce8" fillOpacity={0.9} />
          </>}

          <XAxis
            dataKey="idx"
            type="number"
            domain={[0, chartData.length - 1]}
            ticks={chartData.map(d => d.idx as number)}
            tickFormatter={(i: number) => (chartData[i]?.date as string) ?? ''}
            tick={{ fontSize: 9, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[yMin, yMax]}
            ticks={yTicks}
            tick={{ fontSize: 9, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={v => `${v}%`}
            width={32}
          />
          <Tooltip content={<ChartTooltip />} />

          {/* One line per facilitator */}
          {facilitators.map(fac => (
            <Line
              key={fac.key}
              type="monotone"
              dataKey={fac.key}
              stroke={fac.color}
              strokeWidth={2}
              connectNulls={true}
              dot={(props) => {
                const val = props.payload?.[fac.key]
                if (val === undefined || val === null) return <g key={props.index} />
                const isCurrent = props.payload?.isCurrent && props.payload?.facilitatorName === fac.name
                return (
                  <circle
                    key={props.index}
                    cx={props.cx}
                    cy={props.cy}
                    r={isCurrent ? 5 : 3}
                    fill={fac.color}
                    stroke={isCurrent ? '#bfdbfe' : 'none'}
                    strokeWidth={isCurrent ? 3 : 0}
                  />
                )
              }}
              activeDot={{ r: 5 }}
            />
          ))}

          {/* Arrived dots — top regulation lane */}
          {hasRegulation && (
            <Line
              type="monotone"
              dataKey="arrived"
              strokeWidth={0}
              dot={(props) => {
                const ra = props.payload?.regulationArrival
                if (!ra) return <g key={props.index} />
                return (
                  <circle key={props.index} cx={props.cx} cy={props.cy} r={4}
                    fill={ra === 'regulated' ? '#16a34a' : '#ca8a04'} stroke="none" />
                )
              }}
              activeDot={false}
              legendType="none"
              isAnimationActive={false}
            />
          )}

          {/* Departed dots — bottom regulation lane */}
          {hasRegulation && (
            <Line
              type="monotone"
              dataKey="departed"
              strokeWidth={0}
              dot={(props) => {
                const rd = props.payload?.regulationDeparture
                if (!rd) return <g key={props.index} />
                return (
                  <circle key={props.index} cx={props.cx} cy={props.cy} r={4}
                    fill={rd === 'regulated' ? '#16a34a' : '#ca8a04'} stroke="none" />
                )
              }}
              activeDot={false}
              legendType="none"
              isAnimationActive={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2 pl-4">
        {facilitators.map(fac => (
          <span key={fac.key} className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: fac.color }}>
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: fac.color }} />
            {fac.name}
          </span>
        ))}
        {hasRegulation && (
          <>
            <span className="text-[9px] text-gray-400 self-center">· top = arrived · bottom = departed ·</span>
            <span className="text-[9px] text-green-600 font-semibold">● regulated</span>
            <span className="text-[9px] text-yellow-600 font-semibold">● dysregulated</span>
          </>
        )}
      </div>
    </>
  )
}
