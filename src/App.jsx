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
import { ScenarioTray } from './components/ScenarioTray.jsx'
import mapImg from './assets/ailandia-map.jpeg'

// A short, human-readable "best ↔ worst" descriptor for the comparison table.
function shortTradeoff(card) {
  return card.tradeoff
    .replace('This society bought high ', '')
    .replace(' largely at the expense of ', ' ↔ ')
    .replace(/\.$/, '')
}

const STEPS = [
  { n: 1, title: 'Pick a starting point', text: 'Begin from one of four founding philosophies — or a blank, balanced slate.' },
  { n: 2, title: 'Tune the founding dials', text: 'Set governance, services, rights and the environment. Every lever costs something elsewhere.' },
  { n: 3, title: 'Run 30 years', text: 'Watch the metrics, shocks and report card play out for a deterministic generation.' },
  { n: 4, title: 'Compare & adopt', text: 'Save contrasting runs, weigh the tradeoffs, and lock in your final charter.' },
]

export default function App() {
  const [settings, setSettings] = useState(() => cloneSettings(DEFAULT_SETTINGS))
  const [seed, setSeed] = useState('workshop-2026')
  const [activePreset, setActivePreset] = useState(null)
  const [run, setRun] = useState(null) // { result, card, crew }
  const [dirty, setDirty] = useState(false)
  const [scenarios, setScenarios] = useState([])
  const [finalId, setFinalId] = useState(null)
  const [justSaved, setJustSaved] = useState(false)
  const labRef = useRef(null)
  const resultsRef = useRef(null)
  const counter = useRef(1)

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

  // Snapshot the current run as a competing scenario on the comparison bench.
  function saveScenario() {
    if (!run) return
    const name = activePreset
      ? PRESETS[activePreset].name
      : `Custom design ${counter.current++}`
    const entry = {
      id: `sc-${Date.now()}-${scenarios.length}`,
      name,
      seed,
      settings: cloneSettings(settings),
      grade: run.card.grade,
      verdict: run.card.verdict,
      tradeoff: shortTradeoff(run.card),
      qol: run.crew.qol,
      fairness: run.crew.fairness,
      resilience: run.crew.resilience,
    }
    setScenarios((prev) => [...prev, entry])
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 1600)
  }

  function loadScenario(s) {
    setSettings(cloneSettings(s.settings))
    setSeed(s.seed)
    setActivePreset(null)
    doRun(cloneSettings(s.settings), s.seed)
    labRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const scrollToLab = () => labRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <div className="min-h-screen">
      {/* ============================ HERO ============================ */}
      <section className="hero-sea text-white">
        <div className="mx-auto max-w-[1400px] px-4 py-10 md:py-16">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_minmax(0,560px)]">
            {/* Left: pitch + workflow */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-sea-50 ring-1 ring-white/20">
                A founding-charter simulator
              </div>
              <h1 className="mt-4 text-4xl font-black leading-[1.05] tracking-tight md:text-6xl">
                A<span className="text-land-400">i</span>landia
              </h1>
              <p className="mt-3 max-w-xl text-lg leading-relaxed text-sea-50 md:text-xl">
                You are founding an island nation run by AI. Don&rsquo;t guess the constitution —{' '}
                <strong className="text-white">test scenarios</strong>, watch each play out over 30 years, and let
                the evidence decide your final parameters.
              </p>

              {/* The process, stated up front and unmissable. */}
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {STEPS.map((s) => (
                  <div key={s.n} className="rounded-xl bg-white/10 p-3 ring-1 ring-white/15 backdrop-blur-sm">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-land-500 text-sm font-black text-sea-900">
                      {s.n}
                    </div>
                    <div className="mt-2 text-sm font-bold">{s.title}</div>
                    <div className="mt-0.5 text-[11px] leading-snug text-sea-50/80">{s.text}</div>
                  </div>
                ))}
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button
                  onClick={scrollToLab}
                  className="rounded-lg bg-land-500 px-5 py-3 text-sm font-bold text-sea-900 shadow-lg transition hover:bg-land-400"
                >
                  Start testing scenarios ↓
                </button>
                <span className="text-xs text-sea-50/70">
                  No sign-up · runs entirely in your browser · deterministic
                </span>
              </div>
            </div>

            {/* Right: the island itself */}
            <figure className="relative">
              <div className="map-frame overflow-hidden rounded-2xl bg-white p-1.5">
                <img
                  src={mapImg}
                  alt="Illustrated map of AILandia — an island nation of cities, farmland, energy and a data centre"
                  className="block w-full rounded-xl"
                />
              </div>
              <figcaption className="mt-3 text-center text-sm text-sea-50/80">
                Your island. Your rules. <span className="font-semibold text-white">30 years to prove them.</span>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* Honest framing band */}
      <div className="border-y border-amber-200 bg-amber-50">
        <div className="mx-auto max-w-[1400px] px-4 py-2.5 text-center text-xs text-amber-900">
          ⚠️ AILandia is a <strong>thinking tool for surfacing tradeoffs, not a forecast</strong>. By design,{' '}
          <strong>no configuration wins on everything</strong> — the point is to choose which tensions you can live
          with.
        </div>
      </div>

      {/* ============================ THE LAB ============================ */}
      <main ref={labRef} className="mx-auto max-w-[1400px] scroll-mt-2 px-4 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(320px,380px)_1fr]">
          {/* LEFT: steps 1 & 2 — design the scenario */}
          <div className="space-y-4">
            {/* Step 1 — presets */}
            <div className="card p-4">
              <h3 className="panel-title mb-2">
                <span className="step-num">1</span> Pick a starting scenario
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

            {/* Step 2 — dials */}
            <div className="card p-4">
              <h3 className="panel-title">
                <span className="step-num">2</span> Tune the founding dials
              </h3>
              <p className="mt-1 text-[11px] leading-snug text-slate-500">
                Each ⓘ explains the tradeoff that lever governs. Then run it.
              </p>
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <label className="text-xs font-medium text-slate-500">Seed</label>
                <div className="mt-1 flex gap-1.5">
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
                <button onClick={() => doRun(settings, seed)} className="btn-primary mt-2.5 w-full">
                  {dirty ? '▶ Run 30 years' : '↻ Re-run'}
                </button>
                {dirty && (
                  <p className="mt-1.5 text-center text-[11px] text-amber-600">Settings changed since last run.</p>
                )}
                <p className="mt-1.5 text-center text-[11px] text-slate-400">
                  Same dials + same seed → same 30 years.
                </p>
              </div>
            </div>

            {/* The four dial domains */}
            <SettingsPanels settings={settings} onChange={onSettingsChange} />
          </div>

          {/* RIGHT: step 3 — outcomes */}
          <div ref={resultsRef} className="scroll-mt-4 space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-black text-sea-900">
                  <span className="step-num">3</span> 30 years of AILandia
                  {activePreset && <span className="text-sea-700">· {PRESETS[activePreset].name}</span>}
                </h2>
                <p className="mt-0.5 text-sm text-slate-600">
                  Read the outcome, then save it so you can hold it up against other designs.
                </p>
              </div>
              <button
                onClick={saveScenario}
                disabled={!run || dirty}
                className="rounded-lg bg-land-500 px-3.5 py-2 text-sm font-bold text-sea-900 shadow-sm transition hover:bg-land-400 disabled:cursor-not-allowed disabled:opacity-40"
                title={dirty ? 'Run the current settings first' : 'Save this run to the comparison bench'}
              >
                {justSaved ? '✓ Saved to compare' : '＋ Save to compare'}
              </button>
            </div>

            <MetricCharts result={run?.result} />

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <ReportCardView card={run?.card} />
              <CrewEvaluationView crew={run?.crew} />
            </div>

            <EventLog result={run?.result} />
          </div>
        </div>

        {/* Step 4 — compare & adopt */}
        <div className="mt-8 border-t border-slate-200 pt-8">
          <ScenarioTray
            scenarios={scenarios}
            finalId={finalId}
            onAdopt={setFinalId}
            onRemove={(id) => {
              setScenarios((prev) => prev.filter((s) => s.id !== id))
              if (id === finalId) setFinalId(null)
            }}
            onLoad={loadScenario}
          />
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white/60 py-5 text-center text-xs text-slate-400">
        AILandia · client-side agent-based simulation · a thinking tool, not a forecast ·{' '}
        <a href="https://github.com/economicalstories/ailandia" className="underline hover:text-sea-700">
          source &amp; model docs
        </a>
      </footer>
    </div>
  )
}
