import React from 'react'

const gradeColor = (grade) => {
  const g = grade[0]
  if (g === 'A') return 'text-emerald-600'
  if (g === 'B') return 'text-lime-600'
  if (g === 'C') return 'text-amber-600'
  if (g === 'D') return 'text-orange-600'
  return 'text-rose-600'
}

// The 30-year Society Report Card: letter grade per domain, overall grade,
// the single biggest tradeoff, shock weathering, and a one-paragraph verdict.
export function ReportCardView({ card }) {
  if (!card) return null
  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="panel-title">
          <span className="text-lg">🎓</span> Society Report Card
          <span className="ml-1 text-xs font-normal text-slate-400">— 30-year outcome</span>
        </h3>
        <div className="text-right">
          <div className={`text-3xl font-black leading-none ${gradeColor(card.grade)}`}>{card.grade}</div>
          <div className="text-[10px] uppercase tracking-wide text-slate-400">Overall</div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {card.domains.map((d) => (
          <div key={d.key} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center">
            <div className={`text-2xl font-bold ${gradeColor(d.grade)}`}>{d.grade}</div>
            <div className="text-[11px] font-medium text-slate-500">{d.key}</div>
          </div>
        ))}
      </div>

      <div className="space-y-2 text-sm leading-relaxed text-slate-700">
        <p>
          <span className="font-semibold text-sea-900">Biggest tradeoff: </span>
          {card.tradeoff}
        </p>
        <p>
          <span className="font-semibold text-sea-900">Under pressure: </span>
          {card.shockText}
        </p>
        <p className="rounded-lg bg-sea-50 px-3 py-2 italic text-sea-900">{card.verdict}</p>
      </div>
    </div>
  )
}
