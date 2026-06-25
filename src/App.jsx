import React, { useState, useCallback, useEffect, useRef } from 'react'
import { runSimulation } from './sim/model.js'
import { reportCard, crewEvaluation } from './sim/evaluate.js'
import { DEFAULT_SETTINGS, cloneSettings } from './sim/settings.js'
import { PRESETS, PRESET_ORDER } from './sim/presets.js'
import { SettingsPanels } from './components/SettingsPanels.jsx'
import { MetricCharts } from './components/MetricCharts.jsx'
import { EventLog } from './components/EventLog.jsx'
import { ReportCardView } from './components/ReportCardView.jsx'
import { CrewEvaluationView } from './components/CrewEvaluationView.jsx'

export default function App() {
  const [settings, setSettings] = useState(() => cloneSettings(DEFAULT_SETTINGS))
  const [seed, setSeed] = useState('workshop-2026')
  const [activePreset, setActivePreset] = useState(null)
  const [run, setRun] = useState(null) // { result, card, crew }
  const [dirty, setDirty] = useState(false)
  const resultsRef = useRef(null)

  const doRun = useCallback((s, sd) => {
    const result = runSimulation(s, sd)
    setRun({ result, card: reportCard(result), crew: crewEvaluation(result) })
    setDirty(false)
  }, [])

  // Run once on first load so there's always something to look at.
  useEffect(() => {
    doRun(settings, seed)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function onSettingsChange(next) {
    setSettings(next)
    setActivePreset(null)
    setDirty(true)
  }

  function applyPreset(key) {
    const s = cloneSettings(PRESETS[key].settings)
    setSettings(s)
    setActivePreset(key)
    doRun(s, seed)
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function randomSeed() {
    const s = Math.random().toString(36).slice(2, 8)
    setSeed(s)
    setDirty(true)
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6">
      {/* Header */}
      <header className="mb-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-sea-900">
              🏝️ AILandia <span className="font-light text-slate-400">— Simulate an AI-First Society</span>
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-600">
              Set the founding <strong>dials</strong> across four domains, run the society forward 30 years, and watch
              the tradeoffs emerge. By design, <strong>no configuration wins on everything</strong> — that's the lesson.
            </p>
          </div>
        </div>
        <div className="mt-2 inline-block rounded-md bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900">
          ⚠️ This is a thinking tool for surfacing tradeoffs, <strong>not a forecast</strong>. The numbers encode
          arguable assumptions, not measured effects.
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(320px,380px)_1fr]">
        {/* LEFT: presets + dials + run controls */}
        <div className="space-y-4">
          {/* Presets */}
          <div className="card p-4">
            <h3 className="panel-title mb-2">
              <span className="text-lg">🎚️</span> Start from a preset
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {PRESET_ORDER.map((key) => (
                <button
                  key={key}
                  onClick={() => applyPreset(key)}
                  className={`rounded-lg border p-2.5 text-left transition ${
                    activePreset === key
                      ? 'border-sea-700 bg-sea-50'
                      : 'border-slate-200 bg-white hover:border-sea-600'
                  }`}
                >
                  <div className="text-sm font-semibold text-sea-900">{PRESETS[key].name}</div>
                  <div className="text-[11px] leading-snug text-slate-500">{PRESETS[key].tagline}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Run controls */}
          <div className="card p-4">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-xs font-medium text-slate-500">Seed</label>
                <div className="flex gap-1.5">
                  <input
                    value={seed}
                    onChange={(e) => {
                      setSeed(e.target.value)
                      setDirty(true)
                    }}
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                    placeholder="seed"
                  />
                  <button onClick={randomSeed} className="btn-ghost px-2" title="Random seed">
                    🎲
                  </button>
                </div>
              </div>
            </div>
            <button onClick={() => doRun(settings, seed)} className="btn-primary mt-3 w-full">
              {dirty ? '▶ Run with new settings' : '↻ Re-run'}
            </button>
            {dirty && (
              <p className="mt-1.5 text-center text-[11px] text-amber-600">Settings changed since last run.</p>
            )}
            <p className="mt-2 text-center text-[11px] text-slate-400">
              Runs are deterministic: same dials + same seed → same outcome.
            </p>
          </div>

          {/* The four dial domains */}
          <SettingsPanels settings={settings} onChange={onSettingsChange} />
        </div>

        {/* RIGHT: results */}
        <div ref={resultsRef} className="space-y-4">
          <div>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">
              30 Years of AILandia {activePreset && <span className="text-sea-700">· {PRESETS[activePreset].name}</span>}
            </h2>
            <MetricCharts result={run?.result} />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <ReportCardView card={run?.card} />
            <CrewEvaluationView crew={run?.crew} />
          </div>

          <EventLog result={run?.result} />
        </div>
      </div>

      <footer className="mt-10 border-t border-slate-200 pt-4 text-center text-xs text-slate-400">
        AILandia · client-side agent-based simulation · a thinking tool, not a forecast ·{' '}
        <a href="https://github.com/economicalstories/ailandia" className="underline hover:text-sea-700">
          source &amp; model docs
        </a>
      </footer>
    </div>
  )
}
