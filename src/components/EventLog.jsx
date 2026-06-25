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
export function EventLog({ result }) {
  if (!result) return null
  const { events } = result
  return (
    <div className="card flex h-full flex-col p-4">
      <h3 className="panel-title mb-2">
        <span className="text-lg">📜</span> Event Log
      </h3>
      {events.length === 0 ? (
        <p className="text-sm text-slate-500">
          A quiet 30 years on this seed — no bias incidents or major shocks were recorded.
        </p>
      ) : (
        <ol className="thin-scroll max-h-[28rem] space-y-2 overflow-y-auto pr-1">
          {events.map((e, i) => {
            const meta = KIND_META[e.kind] || KIND_META.bias
            return (
              <li key={i} className={`rounded-lg border px-3 py-2 text-xs leading-relaxed ${meta.tone}`}>
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
