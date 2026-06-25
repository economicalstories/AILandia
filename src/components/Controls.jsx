import React, { useState } from 'react'

// A small info bubble that reveals a tooltip on hover/focus — used to explain
// the tradeoff behind every dial.
export function InfoTip({ text }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label="Explain this tradeoff"
        className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600 hover:bg-sea-600 hover:text-white"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        i
      </button>
      {open && (
        <span className="absolute bottom-full left-1/2 z-20 mb-2 w-60 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-xs leading-relaxed text-white shadow-lg">
          {text}
        </span>
      )}
    </span>
  )
}

// A labelled slider for a continuous 0..1 dial, with its two extremes named.
export function Slider({ label, value, ends, tip, onChange }) {
  const pct = Math.round(value * 100)
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
          {label}
          {tip && <InfoTip text={tip} />}
        </span>
        <span className="text-xs tabular-nums text-slate-400">{pct}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={value}
        style={{ '--pct': `${pct}%` }}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
      <div className="flex justify-between text-[11px] text-slate-400">
        <span>{ends[0]}</span>
        <span>{ends[1]}</span>
      </div>
    </div>
  )
}

// A segmented control for a categorical dial.
export function Segmented({ label, value, options, tip, onChange }) {
  return (
    <div className="space-y-1.5">
      <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
        {label}
        {tip && <InfoTip text={tip} />}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
              value === o.value
                ? 'border-sea-700 bg-sea-700 text-white'
                : 'border-slate-300 bg-white text-slate-600 hover:border-sea-600'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}
