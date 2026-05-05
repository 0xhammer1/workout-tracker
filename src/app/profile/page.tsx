'use client'

import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { supabase } from '@/lib/supabase'
import ConfirmDialog from '@/components/ConfirmDialog'
import MitchellAvatar from '@/components/MitchellAvatar'

interface WeightLog {
  id: string
  date: string
  weight: number
}

type Period = 'month' | 'year' | 'all'

const PERIODS: { label: string; value: Period }[] = [
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
  { label: 'All', value: 'all' },
]

function startDateFor(period: Period): string | null {
  const now = new Date()
  if (period === 'month') now.setMonth(now.getMonth() - 1)
  else if (period === 'year') now.setFullYear(now.getFullYear() - 1)
  else return null
  return now.toISOString().split('T')[0]
}

export default function ProfilePage() {
  const [logs, setLogs] = useState<WeightLog[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<Period>('month')
  const [weightInput, setWeightInput] = useState('')
  const [dateInput, setDateInput] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  async function load() {
    const { data } = await supabase
      .from('weight_logs')
      .select('id, date, weight')
      .order('date', { ascending: true })
    if (data) {
      setLogs(
        (data as { id: string; date: string; weight: number | string }[]).map((d) => ({
          id: d.id,
          date: d.date,
          weight: Number(d.weight),
        }))
      )
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function logWeight() {
    const w = parseFloat(weightInput)
    if (isNaN(w) || w <= 0) return
    setSaving(true)
    const { error } = await supabase.from('weight_logs').insert({ date: dateInput, weight: w })
    setSaving(false)
    if (error) {
      alert(`Error: ${error.message}`)
      return
    }
    setWeightInput('')
    setDateInput(new Date().toISOString().split('T')[0])
    load()
  }

  async function deleteLog() {
    if (!pendingDeleteId) return
    await supabase.from('weight_logs').delete().eq('id', pendingDeleteId)
    setPendingDeleteId(null)
    load()
  }

  const cutoff = startDateFor(period)
  const filtered = cutoff ? logs.filter((l) => l.date >= cutoff) : logs

  const current = logs.length > 0 ? logs[logs.length - 1].weight : null
  const previous = logs.length > 1 ? logs[logs.length - 2].weight : null
  const change = current !== null && previous !== null ? current - previous : null

  const periodStart = filtered.length > 0 ? filtered[0].weight : null
  const periodEnd = filtered.length > 0 ? filtered[filtered.length - 1].weight : null
  const periodChange = periodStart !== null && periodEnd !== null ? periodEnd - periodStart : null

  return (
    <div>
      <header className="pt-8 pb-6 flex items-center gap-4">
        <MitchellAvatar className="w-28 h-28" />
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Profile
          </p>
          <h1 className="text-3xl font-bold tracking-tight mt-1">Mitchell</h1>
        </div>
      </header>

      {/* Current weight card */}
      <div
        className="rounded-2xl p-5 mb-3"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
          Current Weight
        </p>
        <div className="flex items-end gap-3">
          <span className="text-4xl font-bold tracking-tight">
            {current !== null ? current : '—'}
          </span>
          <span className="text-base pb-1.5" style={{ color: 'var(--text-secondary)' }}>
            lbs
          </span>
          {change !== null && (
            <span
              className="ml-auto text-sm font-semibold pb-1.5"
              style={{ color: change > 0 ? '#fb7185' : change < 0 ? '#34d399' : 'var(--text-tertiary)' }}
            >
              {change > 0 ? '↑' : change < 0 ? '↓' : ''} {Math.abs(change).toFixed(1)} lbs
            </span>
          )}
        </div>
      </div>

      {/* Log new weight */}
      <div
        className="rounded-2xl p-5 mb-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
          Log Today
        </p>
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="decimal"
            placeholder="Weight"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            className="flex-1 px-4 py-3 text-base font-medium rounded-xl outline-none"
            style={{
              background: 'var(--surface-elevated)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
            }}
          />
          <input
            type="date"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            className="px-3 py-3 text-sm rounded-xl outline-none"
            style={{
              background: 'var(--surface-elevated)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
            }}
          />
          <button
            onClick={logWeight}
            disabled={saving || !weightInput}
            className="px-5 py-3 text-sm font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-40"
            style={{ background: 'var(--accent)', color: 'white' }}
          >
            {saving ? '…' : 'Log'}
          </button>
        </div>
      </div>

      {/* Time period */}
      <div
        className="flex p-1 mb-3 rounded-xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {PERIODS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setPeriod(value)}
            className="flex-1 py-2 text-sm font-semibold rounded-lg transition-all"
            style={{
              background: period === value ? 'var(--surface-elevated)' : 'transparent',
              color: period === value ? 'var(--text)' : 'var(--text-secondary)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div
        className="rounded-2xl p-5 mb-3"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {loading ? (
          <div className="h-56 flex items-center justify-center">
            <div
              className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-center px-4">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                No weight logs yet
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                Add your first entry above.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filtered} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
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
                    domain={['dataMin - 2', 'dataMax + 2']}
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
                    formatter={(v) => [`${v} lbs`, 'Weight']}
                  />
                  {periodStart !== null && (
                    <ReferenceLine
                      y={periodStart}
                      stroke="#3a3b42"
                      strokeDasharray="2 4"
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={{ fill: '#6366f1', r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#6366f1', strokeWidth: 2, stroke: '#0a0a0c' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {periodChange !== null && (
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Change this period
                </span>
                <span
                  className="text-sm font-semibold"
                  style={{
                    color: periodChange > 0 ? '#fb7185' : periodChange < 0 ? '#34d399' : 'var(--text-tertiary)',
                  }}
                >
                  {periodChange > 0 ? '+' : ''}
                  {periodChange.toFixed(1)} lbs
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Log history */}
      {logs.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xs font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
            All Entries
          </h2>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            {[...logs]
              .reverse()
              .map((l, i) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}
                >
                  <div>
                    <div className="text-base font-semibold">{l.weight} lbs</div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {new Date(l.date + 'T12:00:00').toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                  <button
                    onClick={() => setPendingDeleteId(l.id)}
                    className="text-sm font-medium transition-opacity active:opacity-60"
                    style={{ color: 'var(--danger)' }}
                  >
                    Delete
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete this entry?"
        confirmLabel="Delete"
        destructive
        onConfirm={deleteLog}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  )
}
