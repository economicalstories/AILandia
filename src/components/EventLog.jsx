import React from 'react'

const KIND_META = {
  bias: { icon: '⚠️', tone: 'bg-amber-50 border-amber-200 text-amber-900' },
  pandemic: { icon: '🦠', tone: 'bg-rose-50 border-rose-200 text-rose-900' },
  crash: { icon: '📉', tone: 'bg-red-50 border-red-200 text-red-900' },
  aiFailure: { icon: '🤖', tone: 'bg-purple-50 border-purple-200 text-purple-900' },
  climate: { icon: '🌪️', tone: 'bg-orange-50 border-orange-200 text-orange-900' },
  disinfo: { icon: '📰', tone: 'bg-sky-50 border-sky-200 text-sky-900' },
}

// A scrolling, year-by-year narration of everything notable that happened.
//
// PLAYBACK: when `throughYear` is set, only events up to the playhead are
// shown (newest first, so the freshest headline is always on top), and the
// most recent one gets a soft highlight so the log feels live.
export function EventLog({ result, throughYear = null }) {
  if (!result) return null
  const all = result.events
  const live = throughYear != null
  const shown = live ? all.filter((e) => e.year <= throughYear) : all
  // During playback show newest-first; when settled keep chronological order.
  const ordered = live ? [...shown].reverse() : shown
  const latestYear = shown.length ? shown[shown.length - 1].year : null

  return (
    <div className="card flex h-full flex-col p-4">
      <h3 className="panel-title mb-2">
        <span className="text-lg">📜</span> Event Log
        {live && shown.length > 0 && (
          <span className="ml-1 text-xs font-normal text-slate-400">— {shown.length} so far</span>
        )}
      </h3>
      {shown.length === 0 ? (
        <p className="text-sm text-slate-500">
          {live
            ? 'Quiet so far — no incidents or shocks recorded yet.'
            : 'A quiet 30 years on this seed — no bias incidents or major shocks were recorded.'}
        </p>
      ) : (
        <ol className="thin-scroll max-h-[28rem] space-y-2 overflow-y-auto pr-1">
          {ordered.map((e, i) => {
            const meta = KIND_META[e.kind] || KIND_META.bias
            const fresh = live && e.year === latestYear
            return (
              <li
                key={`${e.year}-${e.kind}-${i}`}
                className={`rounded-lg border px-3 py-2 text-xs leading-relaxed ${meta.tone} ${
                  fresh ? 'ring-2 ring-offset-1 ring-sea-400 event-pop' : ''
                }`}
              >
                <span className="font-bold">
                  {meta.icon} Year {e.year}
                </span>
                {e.severity != null && (
                  <span className="ml-1 opacity-70">· severity {Math.round(e.severity * 100)}%</span>
                )}
                <div className="mt-0.5">{e.text}</div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
