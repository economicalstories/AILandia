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
// banner. It fills its (fixed-height) dispatch slot and clamps its body so the
// layout below never jumps as years tick past.
export function NewsFlash({ event }) {
  if (!event) return null
  const meta = KIND_META[event.kind] || KIND_META.bias
  return (
    <div
      key={`${event.year}-${event.kind}`}
      className={`news-flash flex h-full flex-col justify-center overflow-hidden rounded-xl bg-gradient-to-r ${meta.tone} px-4 py-2 text-white shadow-md`}
    >
      <div className="flex items-center gap-1.5 truncate text-[10px] font-bold uppercase tracking-widest text-white/80">
        <span className="animate-pulse">●</span> Breaking · Year {event.year} · {meta.label}
        {event.severity != null && <span className="opacity-80">· sev {Math.round(event.severity * 100)}%</span>}
      </div>
      <div className="mt-0.5 flex items-start gap-2 text-sm font-medium leading-snug">
        <span className="text-lg leading-tight">{meta.icon}</span>
        <span className="line-clamp-2">{event.text}</span>
      </div>
    </div>
  )
}
