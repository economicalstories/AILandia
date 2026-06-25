import React, { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
  Legend,
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

// The six metrics that share a 0..100 scale — these are the ones it's honest to
// overlay on a single axis. Gini (0..1) and Economy (an unbounded index) keep
// their own tiles so they aren't misread against a 0..100 grid.
const OVERLAY_KEYS = ['wellbeing', 'trust', 'liberties', 'environment', 'resilience', 'legitimacy']

// One small line chart for a single metric (used in the grid, and for the two
// odd-scale metrics under the overlay). Draws across a FIXED timeline so the
// line grows rightward during playback instead of rescaling.
function MetricCard({ m, series, cut, last, maxYear, shockYears, playing }) {
  const isGini = m.scale === 'gini'
  const isIndex = m.scale === 'index'
  let domain = [0, 100]
  if (isGini) domain = [0, Math.max(0.6, Math.ceil(Math.max(...series.map((r) => r.gini)) * 10) / 10)]
  if (isIndex) {
    const top = Math.max(...series.map((r) => r.economy))
    domain = [0, Math.ceil(top / 20) * 20]
  }
  const data = series.map((r) => ({ year: r.year, v: r.year <= cut ? r[m.key] : null }))
  const cur = series[cut][m.key]
  const prev = series[Math.max(0, cut - 1)][m.key]
  return (
    <div className="card p-3">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="truncate text-xs font-semibold text-slate-600">{m.label}</span>
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
            {playing && cut < last && (
              <ReferenceLine x={cut} stroke={m.color} strokeOpacity={0.5} strokeWidth={1.5} />
            )}
            <XAxis
              dataKey="year"
              type="number"
              domain={[0, maxYear]}
              tick={{ fontSize: 9, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
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
}

// The combined overlay: the six 0..100 metrics on one axis with a legend, plus
// a live readout row so current values are legible without hovering. Saves a lot
// of vertical space on small screens.
function OverlayChart({ series, cut, last, maxYear, shockYears, playing }) {
  const metrics = CONST.METRICS.filter((m) => OVERLAY_KEYS.includes(m.key))
  const data = series.map((r) => {
    const o = { year: r.year }
    for (const m of metrics) o[m.key] = r.year <= cut ? r[m.key] : null
    return o
  })
  return (
    <div className="card p-3">
      {/* Live readouts so the overlay is legible at a glance during playback. */}
      <div className="mb-2 grid grid-cols-3 gap-x-3 gap-y-1 sm:grid-cols-6">
        {metrics.map((m) => (
          <div key={m.key} className="flex items-center gap-1.5 overflow-hidden">
            <span className="h-2 w-2 flex-none rounded-full" style={{ background: m.color }} />
            <span className="truncate text-[10px] text-slate-500">{m.label}</span>
            <span className="ml-auto text-xs font-bold tabular-nums" style={{ color: m.color }}>
              {Math.round(series[cut][m.key])}
            </span>
          </div>
        ))}
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 6, bottom: 0, left: -22 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="#f1f5f9" vertical={false} />
            {shockYears.map((y) => (
              <ReferenceLine key={y} x={y} stroke="#f59e0b" strokeOpacity={0.4} strokeWidth={1} />
            ))}
            {playing && cut < last && (
              <ReferenceLine x={cut} stroke="#475569" strokeOpacity={0.45} strokeWidth={1.5} />
            )}
            <XAxis
              dataKey="year"
              type="number"
              domain={[0, maxYear]}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              ticks={[0, 10, 20, maxYear]}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              width={32}
            />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
              formatter={(v, name) => [Math.round(v), name]}
              labelFormatter={(y) => `Year ${y}`}
            />
            {metrics.map((m) => (
              <Line
                key={m.key}
                type="monotone"
                dataKey={m.key}
                name={m.label}
                stroke={m.color}
                strokeWidth={2}
                dot={false}
                connectNulls={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// Eight society metrics over time. Two layouts:
//   • "grid"    — small multiples, one chart per metric (honest per-scale).
//   • "overlay" — the six 0..100 metrics on one chart + Gini/Economy tiles.
// Overlay is the default on narrow screens so you aren't scrolling past eight
// stacked charts on a phone.
export function MetricCharts({ result, throughYear = null }) {
  const [view, setView] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia?.('(max-width: 640px)').matches ? 'overlay' : 'grid',
  )
  if (!result) return null
  const { series, events } = result
  const last = series.length - 1
  const cut = throughYear == null ? last : Math.max(0, Math.min(last, throughYear))
  const maxYear = series[last].year
  const playing = throughYear != null
  const shockYears = [
    ...new Set(events.filter((e) => e.kind !== 'bias' && e.year <= cut).map((e) => e.year)),
  ]
  const odd = CONST.METRICS.filter((m) => m.scale === 'gini' || m.scale === 'index')

  const common = { series, cut, last, maxYear, shockYears, playing }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-500">Eight society metrics · {maxYear} years</span>
        <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 text-[11px] font-semibold">
          {[
            ['overlay', 'Overlay'],
            ['grid', 'Grid'],
          ].map(([v, label]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-md px-2.5 py-1 transition ${
                view === v ? 'bg-sea-700 text-white' : 'text-slate-500 hover:text-sea-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === 'grid' ? (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {CONST.METRICS.map((m) => (
            <MetricCard key={m.key} m={m} {...common} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <OverlayChart {...common} />
          <div className="grid grid-cols-2 gap-3">
            {odd.map((m) => (
              <MetricCard key={m.key} m={m} {...common} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
