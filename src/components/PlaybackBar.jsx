import React from 'react'

// The narrative "era" a given year falls into — pure flavour that makes the
// 30-year arc feel like a lifetime rather than a row of numbers.
function era(year, total) {
  if (year === 0) return 'Founding day'
  if (year <= 2) return 'The founding years'
  if (year <= 9) return 'Early years'
  if (year <= 19) return 'Coming of age'
  if (year < total) return 'Maturity'
  return 'The 30-year reckoning'
}

const SPEEDS = [1, 2, 4]

// The transport for the year-by-year playback: a big living year counter, an
// era label, a scrubbable timeline with shock ticks, and play / skip / replay /
// speed controls. Scrubbing or pausing lets you freeze any year and read it.
export function PlaybackBar({
  year,
  total,
  playing,
  done,
  speed,
  shockYears = [],
  presetName,
  onPlayPause,
  onSkip,
  onReplay,
  onScrub,
  onCycleSpeed,
}) {
  const pct = (year / total) * 100

  return (
    <div className="card overflow-hidden">
      {/* Top band: the living clock */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-sea-900 to-sea-700 px-4 py-3 text-white">
        <div className="flex items-baseline gap-3">
          <div className="flex items-baseline gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-sea-100/70">Year</span>
            <span
              className={`inline-block w-[1.4em] text-right text-4xl font-black leading-none tabular-nums ${
                playing ? 'year-pulse' : ''
              }`}
            >
              {year}
            </span>
            <span className="text-lg font-bold text-sea-100/70">/ {total}</span>
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold">{era(year, total)}</div>
            {presetName && <div className="text-[11px] text-sea-100/70">{presetName}</div>}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onCycleSpeed}
            className="rounded-md bg-white/10 px-2.5 py-1.5 text-xs font-bold tabular-nums text-white ring-1 ring-white/20 transition hover:bg-white/20"
            title="Playback speed"
          >
            {speed}×
          </button>
          {done ? (
            <button
              onClick={onReplay}
              className="rounded-md bg-land-500 px-3 py-1.5 text-xs font-bold text-sea-900 transition hover:bg-land-400"
              title="Replay the 30 years"
            >
              ↺ Replay
            </button>
          ) : (
            <button
              onClick={onPlayPause}
              className="rounded-md bg-land-500 px-3 py-1.5 text-xs font-bold text-sea-900 transition hover:bg-land-400"
            >
              {playing ? '⏸ Pause' : '▶ Play'}
            </button>
          )}
          <button
            onClick={onSkip}
            disabled={done}
            className="rounded-md bg-white/10 px-3 py-1.5 text-xs font-bold text-white ring-1 ring-white/20 transition hover:bg-white/20 disabled:opacity-30"
            title="Skip to the 30-year verdict"
          >
            ⏭ Skip
          </button>
        </div>
      </div>

      {/* Scrubber: drag to rewind/replay any year. Shock years are ticked. */}
      <div className="px-4 pb-3 pt-3">
        <div className="relative">
          {/* shock ticks sit just above the track */}
          <div className="pointer-events-none absolute -top-1.5 left-0 right-0 h-2">
            {shockYears.map((y) => (
              <span
                key={y}
                className="absolute h-2 w-0.5 rounded bg-amber-400"
                style={{ left: `${(y / total) * 100}%` }}
                title={`Shock in year ${y}`}
              />
            ))}
          </div>
          <input
            type="range"
            min="0"
            max={total}
            step="1"
            value={year}
            onChange={(e) => onScrub(parseInt(e.target.value, 10))}
            style={{ '--pct': `${pct}%` }}
            className="w-full"
            aria-label="Scrub through the years"
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-slate-400">
          <span>Founding</span>
          <span>{done ? 'Settled — read the verdict below' : 'Drag to rewind · click Skip for the ending'}</span>
          <span>Year {total}</span>
        </div>
      </div>
    </div>
  )
}
