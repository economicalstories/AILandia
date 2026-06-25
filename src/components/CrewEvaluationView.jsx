import React, { useState } from 'react'

const ratingColor = (r) => {
  if (r >= 8) return 'text-emerald-600'
  if (r >= 6) return 'text-lime-600'
  if (r >= 4) return 'text-amber-600'
  if (r >= 2) return 'text-orange-600'
  return 'text-rose-600'
}

// Parse the engine's plain-text crew evaluation back into structured rows so
// we can render the three measures as cards. The raw text is also kept for a
// one-click copy (it matches the assignment's exact required format).
function parse(text) {
  const rows = []
  for (const measure of ['Quality of life', 'Fairness', 'Resilience to crisis']) {
    const re = new RegExp(`${measure}: (\\d+)/10 Why: (.*?) In 10 years: (.*?)(?=\\n\\n)`, 's')
    const m = text.match(re)
    if (m) rows.push({ measure, rating: parseInt(m[1], 10), why: m[2].trim(), future: m[3].trim() })
  }
  const verdict = (text.match(/Overall verdict: (.*)$/s) || [, ''])[1].trim()
  return { rows, verdict }
}

export function CrewEvaluationView({ crew }) {
  const [copied, setCopied] = useState(false)
  if (!crew) return null
  const { rows, verdict } = parse(crew.text)

  function copy() {
    navigator.clipboard?.writeText(crew.text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="panel-title">
          <span className="text-lg">🛰️</span> 10-Year Evaluation Crew
          <span className="ml-1 text-xs font-normal text-slate-400">— marking criteria</span>
        </h3>
        <button onClick={copy} className="btn-ghost text-xs">
          {copied ? '✓ Copied' : 'Copy verdict'}
        </button>
      </div>

      <div className="space-y-2.5">
        {rows.map((r) => (
          <div key={r.measure} className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">{r.measure}</span>
              <span className={`text-lg font-black tabular-nums ${ratingColor(r.rating)}`}>{r.rating}/10</span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              <span className="font-medium text-slate-500">Why: </span>
              {r.why}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
              <span className="font-medium text-slate-500">In 10 years: </span>
              {r.future}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-3 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium leading-relaxed text-white">
        {verdict}
      </p>
    </div>
  )
}
