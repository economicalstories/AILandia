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

// A tiny ▲/▼ delta chip coloured by whether the move was good or bad for that
// metric (Gini is the one where DOWN is good).
function Delta({ metric, value, prev }) {
  const d = value - prev
  const eps = metric.scale === 'gini' ? 0.004 : 0.4
  if (Math.abs(d) < eps) {
    return <span className="text-[10px] font-semibold text-slate-300">●</span>
  }
  const up = d > 0
  const good = metric.scale === 'gini' ? !up : up
  const fmt = metric.scale === 'gini' ? Math.abs(d).toFixed(2) : Math.abs(Math.round(d))
  return (
    <span className={`text-[10px] font-bold tabular-nums ${good ? 'text-emerald-500' : 'text-rose-500'}`}>
      {up ? '▲' : '▼'}
      {fmt}
    </span>
  )
}

// One small line chart per metric (small multiples). Each gets its own scale,
// so the index-scaled economy and the 0..1 Gini read correctly alongside the
// 0..100 metrics. Shock years are marked as faint vertical lines across all.
//
// PLAYBACK: when `throughYear` is provided, the series is *masked* past that
// year (values become null) so the line draws progressively across a FIXED
// timeline — the history visibly grows rightward instead of rescaling. The big
// readout shows the value AT the playhead, with a ▲/▼ delta from the year before.
export function MetricCharts({ result, throughYear = null }) {
  if (!result) return null
  const { series, events } = result
  const last = series.length - 1
  const cut = throughYear == null ? last : Math.max(0, Math.min(last, throughYear))
  const maxYear = series[last].year

  const shockYears = [
    ...new Set(events.filter((e) => e.kind !== 'bias' && e.year <= cut).map((e) => e.year)),
  ]

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {CONST.METRICS.map((m) => {
        const isGini = m.scale === 'gini'
        const isIndex = m.scale === 'index'
        let domain = [0, 100]
        if (isGini) domain = [0, Math.max(0.6, Math.ceil(Math.max(...series.map((r) => r.gini)) * 10) / 10)]
        if (isIndex) {
          const top = Math.max(...series.map((r) => r.economy))
          domain = [0, Math.ceil(top / 20) * 20]
        }
        // Mask the future so the line stops at the playhead but the x-axis stays put.
        const data = series.map((r) => ({ year: r.year, v: r.year <= cut ? r[m.key] : null }))
        const cur = series[cut][m.key]
        const prev = series[Math.max(0, cut - 1)][m.key]
        return (
          <div key={m.key} className="card p-3">
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-xs font-semibold text-slate-600">{m.label}</span>
              <span className="flex items-baseline gap-1">
                <Delta metric={m} value={cur} prev={prev} />
                <span className="text-sm font-bold tabular-nums" style={{ color: m.color }}>
                  {isGini ? cur.toFixed(2) : Math.round(cur)}
                  {isIndex && <span className="ml-0.5 text-[10px] font-normal text-slate-400">idx</span>}
                </span>
              </span>
            </div>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="#f1f5f9" vertical={false} />
                  {shockYears.map((y) => (
                    <ReferenceLine key={y} x={y} stroke="#f59e0b" strokeOpacity={0.35} strokeWidth={1} />
                  ))}
                  {/* The playhead — a soft marker that rides along during playback. */}
                  {throughYear != null && cut < last && (
                    <ReferenceLine x={cut} stroke={m.color} strokeOpacity={0.5} strokeWidth={1.5} />
                  )}
                  <XAxis
                    dataKey="year"
                    type="number"
                    domain={[0, maxYear]}
                    tick={{ fontSize: 9, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    ticks={[0, 10, 20, maxYear]}
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
                    dataKey="v"
                    stroke={m.color}
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
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
