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
      <div className="flex items-center justify-center h-48 text-xs tracking-widest uppercase" style={{ color: '#444' }}>
        No data yet
      </div>
    )
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#444' }}
            tickFormatter={(v) => {
              const d = new Date(v)
              return `${d.getMonth() + 1}/${d.getDate()}`
            }}
            axisLine={{ stroke: '#1c1c1c' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#444' }}
            axisLine={{ stroke: '#1c1c1c' }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{ background: '#0d0d0d', border: '1px solid #1c1c1c', borderRadius: 0 }}
            labelStyle={{ color: '#888', fontSize: 11 }}
            itemStyle={{ color: '#C4A044', fontSize: 12 }}
            labelFormatter={(v) => new Date(v).toLocaleDateString()}
            formatter={(v) => [`${v} lbs`]}
          />
          <Line
            type="monotone"
            dataKey={metric}
            stroke="#C4A044"
            strokeWidth={1.5}
            dot={{ fill: '#C4A044', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#C4A044', strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
