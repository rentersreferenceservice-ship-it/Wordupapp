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

interface TooltipPayload {
  payload: {
    accuracy: number
    date: string
    lessonTitle: string
    regulationArrival: string | null
    regulationDeparture: string | null
  }
}

function regLabel(val: string | null) {
  if (val === 'regulated') return '● Regulated'
  if (val === 'dysregulated') return '● Dysregulated'
  return null
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const arrived = regLabel(d.regulationArrival)
  const departed = regLabel(d.regulationDeparture)
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-xs">
      <p className="font-bold text-gray-900">{d.accuracy}%</p>
      <p className="text-gray-500">{d.date}</p>
      <p className="text-gray-400 max-w-48 truncate">{d.lessonTitle}</p>
      {arrived && <p className={`font-semibold mt-0.5 ${d.regulationArrival === 'regulated' ? 'text-green-600' : 'text-yellow-600'}`}>Arrived: {arrived}</p>}
      {departed && <p className={`font-semibold ${d.regulationDeparture === 'regulated' ? 'text-green-600' : 'text-yellow-600'}`}>Departed: {departed}</p>}
    </div>
  )
}

export default function AccuracyChart({ data, currentSessionId }: { data: SessionAccuracy[]; currentSessionId?: string }) {
  const [months, setMonths] = useState(12)

  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - months)
  const filtered = data.filter(s => new Date(s.date + 'T00:00:00') >= cutoff)

  const periodSelector = (
    <div className="flex gap-1 mb-4">
      {PERIODS.map(p => (
        <button
          key={p.months}
          onClick={() => setMonths(p.months)}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            months === p.months
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
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
    return (
      <>
        {periodSelector}
        <div className="text-center py-4">
          <p className="text-2xl font-bold text-blue-600">{filtered[0].accuracy}%</p>
          <p className="text-xs text-gray-400 mt-1">One session in this period — more sessions will show a trend</p>
        </div>
      </>
    )
  }

  const hasRegulation = filtered.some(s => s.regulationArrival || s.regulationDeparture)

  const chartData = filtered.map(s => ({
    date: new Date(s.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    accuracy: s.accuracy,
    lessonTitle: s.lessonTitle,
    regulationArrival: s.regulationArrival ?? null,
    regulationDeparture: s.regulationDeparture ?? null,
    // Fixed positions in top/bottom lanes — color encodes the state
    arrived: s.regulationArrival ? 112 : undefined,
    departed: s.regulationDeparture ? -12 : undefined,
    isCurrent: s.sessionId === currentSessionId,
  }))

  return (
    <>
      {periodSelector}
      <ResponsiveContainer width="100%" height={hasRegulation ? 210 : 180}>
        <LineChart data={chartData} margin={{ top: 4, right: 20, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />

          {/* Regulation lanes */}
          {hasRegulation && <>
            <ReferenceArea y1={104} y2={121} fill="#f0fdf4" fillOpacity={0.9} />
            <ReferenceArea y1={-21} y2={-4} fill="#fefce8" fillOpacity={0.9} />
          </>}

          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={hasRegulation ? [-20, 120] : [0, 100]}
            ticks={hasRegulation ? [0, 25, 50, 75, 100] : undefined}
            tick={{ fontSize: 9, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={v => `${v}%`}
            width={32}
          />
          <Tooltip content={<ChartTooltip />} />

          {/* Accuracy */}
          <Line
            type="monotone"
            dataKey="accuracy"
            stroke="#2563eb"
            strokeWidth={2}
            dot={(props) => {
              const isCurrent = props.payload?.isCurrent
              return (
                <circle
                  key={props.index}
                  cx={props.cx}
                  cy={props.cy}
                  r={isCurrent ? 5 : 3}
                  fill="#2563eb"
                  stroke={isCurrent ? '#bfdbfe' : 'none'}
                  strokeWidth={isCurrent ? 3 : 0}
                />
              )
            }}
            activeDot={{ r: 5, fill: '#1d4ed8' }}
          />

          {/* Arrived dots — top lane */}
          {hasRegulation && (
            <Line
              type="monotone"
              dataKey="arrived"
              strokeWidth={0}
              dot={(props) => {
                const ra = props.payload?.regulationArrival
                if (!ra) return <g key={props.index} />
                return (
                  <circle
                    key={props.index}
                    cx={props.cx}
                    cy={props.cy}
                    r={4}
                    fill={ra === 'regulated' ? '#16a34a' : '#ca8a04'}
                    stroke="none"
                  />
                )
              }}
              activeDot={false}
              legendType="none"
              isAnimationActive={false}
            />
          )}

          {/* Departed dots — bottom lane */}
          {hasRegulation && (
            <Line
              type="monotone"
              dataKey="departed"
              strokeWidth={0}
              dot={(props) => {
                const rd = props.payload?.regulationDeparture
                if (!rd) return <g key={props.index} />
                return (
                  <circle
                    key={props.index}
                    cx={props.cx}
                    cy={props.cy}
                    r={4}
                    fill={rd === 'regulated' ? '#16a34a' : '#ca8a04'}
                    stroke="none"
                  />
                )
              }}
              activeDot={false}
              legendType="none"
              isAnimationActive={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      {hasRegulation && (
        <div className="flex gap-4 mt-1 text-[9px] text-gray-400 pl-4">
          <span>top band = arrived &nbsp; bottom band = departed</span>
          <span className="text-green-600">● regulated</span>
          <span className="text-yellow-600">● dysregulated</span>
        </div>
      )}
    </>
  )
}
