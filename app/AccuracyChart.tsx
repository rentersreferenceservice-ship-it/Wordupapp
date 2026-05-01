'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import type { SessionAccuracy } from '@/lib/practitionerStore'

interface TooltipPayload {
  payload: { accuracy: number; date: string; lessonTitle: string }
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-xs">
      <p className="font-bold text-gray-900">{d.accuracy}%</p>
      <p className="text-gray-500">{d.date}</p>
      <p className="text-gray-400 max-w-48 truncate">{d.lessonTitle}</p>
    </div>
  )
}

export default function AccuracyChart({ data, currentSessionId }: { data: SessionAccuracy[]; currentSessionId?: string }) {
  if (data.length === 0) {
    return <p className="text-xs text-gray-400 text-center py-4">No completed sessions with spelling data yet.</p>
  }

  if (data.length === 1) {
    return (
      <div className="text-center py-4">
        <p className="text-2xl font-bold text-blue-600">{data[0].accuracy}%</p>
        <p className="text-xs text-gray-400 mt-1">First session accuracy — more sessions will show a trend</p>
      </div>
    )
  }

  const chartData = data.map(s => ({
    date: new Date(s.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    accuracy: s.accuracy,
    lessonTitle: s.lessonTitle,
    isCurrent: s.sessionId === currentSessionId,
  }))

  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 9, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 9, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={v => `${v}%`}
          width={32}
        />
        <Tooltip content={<ChartTooltip />} />
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
                fill={isCurrent ? '#1d4ed8' : '#2563eb'}
                stroke={isCurrent ? '#bfdbfe' : 'none'}
                strokeWidth={isCurrent ? 3 : 0}
              />
            )
          }}
          activeDot={{ r: 5, fill: '#1d4ed8' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
