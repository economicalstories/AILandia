import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from 'recharts'
import { CONST } from '../sim/constants.js'

// One small line chart per metric (small multiples). Each gets its own scale,
// so the index-scaled economy and the 0..1 Gini read correctly alongside the
// 0..100 metrics. Shock years are marked as faint vertical lines across all.
export function MetricCharts({ result }) {
  if (!result) return null
  const { series, events } = result
  const shockYears = [...new Set(events.filter((e) => e.kind !== 'bias').map((e) => e.year))]

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {CONST.METRICS.map((m) => {
        const isGini = m.scale === 'gini'
        const isIndex = m.scale === 'index'
        let domain = [0, 100]
        if (isGini) domain = [0, Math.max(0.6, Math.ceil(Math.max(...series.map((r) => r.gini)) * 10) / 10)]
        if (isIndex) domain = [0, 'auto']
        const final = series[series.length - 1][m.key]
        return (
          <div key={m.key} className="card p-3">
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-xs font-semibold text-slate-600">{m.label}</span>
              <span className="text-sm font-bold tabular-nums" style={{ color: m.color }}>
                {isGini ? final.toFixed(2) : Math.round(final)}
                {isIndex && <span className="ml-0.5 text-[10px] font-normal text-slate-400">idx</span>}
              </span>
            </div>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="#f1f5f9" vertical={false} />
                  {shockYears.map((y) => (
                    <ReferenceLine key={y} x={y} stroke="#f59e0b" strokeOpacity={0.35} strokeWidth={1} />
                  ))}
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 9, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    interval={9}
                  />
                  <YAxis
                    domain={domain}
                    tick={{ fontSize: 9, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    width={36}
                    allowDecimals={isGini}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
                    formatter={(v) => [isGini ? v.toFixed(3) : Math.round(v), m.label]}
                    labelFormatter={(y) => `Year ${y}`}
                  />
                  <Line
                    type="monotone"
                    dataKey={m.key}
                    stroke={m.color}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )
      })}
    </div>
  )
}
