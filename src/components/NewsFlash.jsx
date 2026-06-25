import React from 'react'

const KIND_META = {
  bias: { icon: '⚠️', label: 'Bias incident', tone: 'from-amber-500 to-amber-600' },
  pandemic: { icon: '🦠', label: 'Pandemic', tone: 'from-rose-500 to-rose-600' },
  crash: { icon: '📉', label: 'Economic crash', tone: 'from-red-500 to-red-600' },
  aiFailure: { icon: '🤖', label: 'AI system failure', tone: 'from-purple-500 to-purple-600' },
  climate: { icon: '🌪️', label: 'Climate disaster', tone: 'from-orange-500 to-orange-600' },
  disinfo: { icon: '📰', label: 'Disinformation wave', tone: 'from-sky-500 to-sky-600' },
}

// During playback, surface the current year's headline as a breaking-news
// banner. When a year passes with nothing notable, a calm "all quiet" strip
// keeps the beat going so the playback never feels frozen.
export function NewsFlash({ event, year, calm }) {
  if (event) {
    const meta = KIND_META[event.kind] || KIND_META.bias
    return (
      <div
        key={`${event.year}-${event.kind}`}
        className={`news-flash overflow-hidden rounded-xl bg-gradient-to-r ${meta.tone} px-4 py-3 text-white shadow-md`}
      >
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/80">
          <span className="animate-pulse">●</span> Breaking · Year {event.year} · {meta.label}
          {event.severity != null && <span className="opacity-80">· severity {Math.round(event.severity * 100)}%</span>}
        </div>
        <div className="mt-1 flex items-start gap-2 text-sm font-medium leading-snug">
          <span className="text-xl leading-none">{meta.icon}</span>
          <span>{event.text}</span>
        </div>
      </div>
    )
  }
  if (calm) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white/70 px-4 py-2.5 text-center text-xs text-slate-400">
        ☀️ Year {year} — a calm year in AILandia. The metrics drift on.
      </div>
    )
  }
  return null
}
