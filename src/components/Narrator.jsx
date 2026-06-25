import React from 'react'

// A slim "state of the nation" line under the year clock. It re-keys on the
// year so the text gives a small fade each time history advances, and fills its
// (fixed-height) dispatch slot so the layout below stays put.
export function Narrator({ text, year }) {
  if (!text) return null
  return (
    <div
      key={year}
      className="news-flash flex h-full items-center gap-2 rounded-xl border border-sea-100 bg-white/70 px-3.5 py-2 text-sm leading-snug text-sea-900"
    >
      <span className="text-base leading-none">🏝️</span>
      <span className="line-clamp-2 italic">{text}</span>
    </div>
  )
}
