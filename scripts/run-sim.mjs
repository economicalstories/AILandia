// Headless runner: simulate the presets on one seed and print a comparison.
// Usage: node scripts/run-sim.mjs [seed]
import { runSimulation } from '../src/sim/model.js'
import { reportCard, crewEvaluation } from '../src/sim/evaluate.js'
import { PRESETS, PRESET_ORDER } from '../src/sim/presets.js'

const seed = process.argv[2] || 'workshop-2026'

for (const key of PRESET_ORDER) {
  const p = PRESETS[key]
  const res = runSimulation(p.settings, seed)
  const rc = reportCard(res)
  const crew = crewEvaluation(res)
  const f = res.final
  console.log('\n' + '='.repeat(78))
  console.log(`${p.name}  (seed: ${seed})`)
  console.log('='.repeat(78))
  console.log(
    `Final(30y): wellbeing=${f.wellbeing} gini=${f.gini} trust=${f.trust} liberties=${f.liberties}\n` +
      `            enviro=${f.environment} economy=${f.economy} resilience=${f.resilience} legitimacy=${f.legitimacy}\n` +
      `            debt=${f.debt} fairnessGap=${f.fairnessGap}x  shocks=${res.events.filter((e) => e.kind !== 'bias').length} biasIncidents=${res.events.filter((e) => e.kind === 'bias').length}`,
  )
  console.log('Report card: ' + rc.domains.map((d) => `${d.key} ${d.grade}`).join('  |  ') + `   OVERALL ${rc.grade}`)
  console.log('Tradeoff: ' + rc.tradeoff)
  console.log('\n--- 10-year crew evaluation ---\n' + crew.text)
}
