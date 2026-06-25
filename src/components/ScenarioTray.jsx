import React from 'react'

// ===========================================================================
// ScenarioTray — the comparison bench.
//
// This is where the central workflow lands: you SAVE several runs as competing
// scenarios, line their outcomes up side by side, and then ADOPT one as the
// founding charter. Nothing about a single run tells you whether it was a good
// settlement; only the comparison does.
// ===========================================================================

const gradeColor = (grade) => {
  const g = grade[0]
  if (g === 'A') return 'text-emerald-600'
  if (g === 'B') return 'text-lime-600'
  if (g === 'C') return 'text-amber-600'
  if (g === 'D') return 'text-orange-600'
  return 'text-rose-600'
}

const tenColor = (r) => {
  if (r >= 8) return 'bg-emerald-500'
  if (r >= 6) return 'bg-lime-500'
  if (r >= 4) return 'bg-amber-500'
  if (r >= 2) return 'bg-orange-500'
  return 'bg-rose-500'
}

// A compact 0..10 pip bar so three scenarios' fairness/resilience read at a glance.
function ScoreCell({ value }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-6 text-right text-xs font-bold tabular-nums text-slate-700">{value}</span>
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <span className={`block h-full rounded-full ${tenColor(value)}`} style={{ width: `${value * 10}%` }} />
      </span>
    </div>
  )
}

export function ScenarioTray({ scenarios, finalId, onAdopt, onRemove, onLoad }) {
  const final = scenarios.find((s) => s.id === finalId)

  return (
    <section id="compare" className="scroll-mt-4">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-black text-sea-900">
            <span className="step-num">4</span> Compare scenarios &amp; adopt your charter
          </h2>
          <p className="mt-0.5 text-sm text-slate-600">
            Save a few contrasting runs, weigh their tradeoffs against each other, then lock one in as
            AILandia&rsquo;s founding settlement.
          </p>
        </div>
        <span className="rounded-full bg-sea-100 px-3 py-1 text-xs font-semibold text-sea-900">
          {scenarios.length} saved
        </span>
      </div>

      {scenarios.length === 0 ? (
        <div className="card border-dashed p-8 text-center">
          <div className="text-3xl">🧭</div>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            No scenarios saved yet. Run a configuration above, hit{' '}
            <span className="font-semibold text-sea-800">&ldquo;Save to compare&rdquo;</span>, then change the dials
            and save another. Your goal isn&rsquo;t one perfect run — it&rsquo;s the contrast that reveals which
            tradeoffs you can live with.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2.5 font-semibold">Scenario</th>
                  <th className="px-3 py-2.5 text-center font-semibold">Grade</th>
                  <th className="px-3 py-2.5 font-semibold">Quality of life</th>
                  <th className="px-3 py-2.5 font-semibold">Fairness</th>
                  <th className="px-3 py-2.5 font-semibold">Resilience</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Decision</th>
                </tr>
              </thead>
              <tbody>
                {scenarios.map((s) => {
                  const isFinal = s.id === finalId
                  return (
                    <tr
                      key={s.id}
                      className={`border-b border-slate-100 align-middle transition last:border-0 ${
                        isFinal ? 'bg-sea-50/70' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isFinal && <span title="Adopted charter">⭐</span>}
                          <div>
                            <div className="text-sm font-semibold text-sea-900">{s.name}</div>
                            <div className="text-[11px] text-slate-400">
                              seed {s.seed} · {s.tradeoff}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`text-xl font-black ${gradeColor(s.grade)}`}>{s.grade}</span>
                      </td>
                      <td className="px-3 py-3">
                        <ScoreCell value={s.qol} />
                      </td>
                      <td className="px-3 py-3">
                        <ScoreCell value={s.fairness} />
                      </td>
                      <td className="px-3 py-3">
                        <ScoreCell value={s.resilience} />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onLoad(s)}
                            className="btn-ghost px-2 py-1 text-[11px]"
                            title="Load these dials back into the editor"
                          >
                            Load
                          </button>
                          <button
                            onClick={() => onAdopt(isFinal ? null : s.id)}
                            className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                              isFinal
                                ? 'bg-sea-700 text-white hover:bg-sea-900'
                                : 'border border-sea-600 text-sea-700 hover:bg-sea-50'
                            }`}
                          >
                            {isFinal ? '★ Adopted' : 'Adopt'}
                          </button>
                          <button
                            onClick={() => onRemove(s.id)}
                            className="px-1.5 text-slate-300 hover:text-rose-500"
                            title="Remove scenario"
                            aria-label="Remove scenario"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {final && (
        <div className="mt-3 overflow-hidden rounded-xl border border-sea-700 bg-gradient-to-r from-sea-900 to-sea-700 p-5 text-white shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-widest text-sea-100/80">
                ⭐ AILandia&rsquo;s Founding Charter
              </div>
              <div className="mt-0.5 text-xl font-black">{final.name}</div>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-sea-50">{final.verdict}</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-black leading-none">{final.grade}</div>
              <div className="text-[10px] uppercase tracking-wide text-sea-100/70">30-yr grade</div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
