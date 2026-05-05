'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface DataPoint {
  date: string
  maxWeight: number
  totalVolume: number
}

interface Props {
  data: DataPoint[]
  metric: 'maxWeight' | 'totalVolume'
}

export default function ProgressChart({ data, metric }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm" style={{ color: 'var(--text-tertiary)' }}>
        No data yet
      </div>
    )
  }

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#26272d" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#9ca0a8' }}
            tickFormatter={(v) => {
              const d = new Date(v)
              return `${d.getMonth() + 1}/${d.getDate()}`
            }}
            axisLine={{ stroke: '#26272d' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9ca0a8' }}
            axisLine={{ stroke: '#26272d' }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: '#1c1d22',
              border: '1px solid #3a3b42',
              borderRadius: 12,
              fontSize: 13,
            }}
            labelStyle={{ color: '#9ca0a8', fontSize: 12, marginBottom: 4 }}
            itemStyle={{ color: '#f5f5f7' }}
            labelFormatter={(v) => new Date(v).toLocaleDateString()}
            formatter={(v) => [`${v} lbs`]}
          />
          <Line
            type="monotone"
            dataKey={metric}
            stroke="#6366f1"
            strokeWidth={2.5}
            dot={{ fill: '#6366f1', r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: '#6366f1', strokeWidth: 2, stroke: '#0a0a0c' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
