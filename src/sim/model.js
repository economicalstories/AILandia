// ===========================================================================
// AILandia simulation ENGINE.
//
// A stepped, year-by-year agent-aware model. It is intentionally simple and
// transparent: every relationship is a readable expression, every magic
// number lives in constants.js. Read constants.js first for the assumptions.
//
// Determinism: given the same (settings, seed) the output is byte-identical.
// All randomness flows through the seeded RNG; we never call Math.random.
//
// Returns:
//   {
//     settings, seed,
//     series:  [ { year, wellbeing, gini, trust, liberties,
//                  environment, economy, resilience, legitimacy }, ... ],
//     events:  [ { year, kind, severity, text }, ... ],
//     final:   last series row + derived fields (fairnessGap, debt),
//   }
// ===========================================================================

import { CONST, PARTICIPATION_MODES, GUARDIAN_MODES } from './constants.js'
import { makeRng } from './rng.js'

const clamp = (x, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, x))
const clamp01 = (x) => Math.max(0, Math.min(1, x))

// Districts of AILandia (drawn from the island map) used to colour events.
// Districts later in the list are poorer / more exposed — they map loosely to
// the higher-disadvantage groups so bias events land where you'd expect.
const DISTRICTS = [
  'the Capital Towers',
  'Windward Heights',
  'Solar Flats',
  'Harbor District',
  'Mistral Farms',
  'Cape Lantern',
]

// Move a metric a fraction of the way to its target. Trust falls faster than
// it rises (asymmetric inertia) to model hard-won-but-easily-lost credibility.
function moveToward(current, target, inertia, isTrust = false) {
  const gap = target - current
  const rate = isTrust && gap < 0 ? inertia * CONST.TRUST_FALL_MULTIPLIER : inertia
  return current + gap * Math.min(1, rate)
}

// Gini coefficient of an array of non-negative incomes (0 = equal, 1 = max).
function gini(values) {
  const xs = values.slice().sort((a, b) => a - b)
  const n = xs.length
  let cum = 0
  let weighted = 0
  for (let i = 0; i < n; i++) {
    cum += xs[i]
    weighted += cum
  }
  if (cum === 0) return 0
  // Standard discrete Gini from the Lorenz partial sums.
  return clamp01((n + 1 - (2 * weighted) / cum) / n)
}

// The five seeded shock types. Each returns the damage it does this year as a
// map of metric deltas (negative = harm), given current state + settings.
// Severity is the headline 0..1 number used for narration and the event log.
function applyShock(kind, st, dyn, rng) {
  const { g, sv, f, en, part, guard, automation } = st
  const resilFactor = 1 - CONST.SHOCKS.resilienceMitigation * (dyn.resilience / 100)
  let sev = 0
  let deltas = {}
  let text = ''
  const district = DISTRICTS[rng.int(0, DISTRICTS.length - 1)]

  switch (kind) {
    case 'pandemic': {
      // Coordination + a safety net + human capacity blunt a pandemic.
      const mitig = 0.5 * sv.coverage + 0.25 * sv.humanInLoop + 0.25 * g.centralization
      sev = clamp01(rng.range(0.45, 0.75) * resilFactor * (1 - 0.5 * mitig))
      deltas = { wellbeing: -22 * sev, economy: -0.07 * sev, trust: -8 * sev }
      text = `A pandemic sweeps AILandia. Hospitals in ${district} strain; ${sv.coverage > 0.6 ? 'universal coverage absorbs much of the shock' : 'the means-tested system leaves gaps'}.`
      break
    }
    case 'crash': {
      // A safety net and broad-based (less centralized) economy cushion a crash.
      const mitig = 0.45 * sv.coverage + 0.3 * (1 - g.centralization) + 0.25 * (dyn.trust / 100)
      sev = clamp01(rng.range(0.5, 0.8) * resilFactor * (1 - 0.5 * mitig))
      deltas = { economy: -0.13 * sev, wellbeing: -10 * sev, trust: -7 * sev }
      text = `An economic crash hits. ${sv.coverage > 0.6 ? 'Automatic stabilisers steady households' : 'Without a strong safety net, hardship spreads through ' + district}.`
      break
    }
    case 'aiFailure': {
      // The more the society leaned on autonomous, centralized automation, the
      // worse a core AI-system failure hurts. Humans-in-the-loop are the airbag.
      const reliance = 0.4 * g.aiAutonomy + 0.35 * automation + 0.25 * g.centralization
      const airbag = 0.5 * sv.humanInLoop + 0.3 * g.transparency + 0.2 * (1 - g.centralization)
      sev = clamp01(rng.range(0.4, 0.7) * resilFactor * (0.5 + reliance) * (1 - 0.5 * airbag))
      deltas = { wellbeing: -14 * sev, economy: -0.08 * sev, trust: -16 * sev, legitimacy: -10 * sev }
      text = `A core AI system fails. ${reliance > 0.6 ? 'With few human fallbacks, services in ' + district + ' seize up for weeks' : 'Human operators take over and limit the damage'}.`
      break
    }
    case 'climate': {
      // Banked environmental debt is the real killer here.
      const debtAmp = 1 + CONST.ENVIRO.debtClimateAmp * clamp01(dyn.debt)
      const mitig = 0.4 * en.resourceCap + 0.3 * en.timeDiscount + 0.3 * guard.protect
      sev = clamp01(rng.range(0.4, 0.7) * resilFactor * debtAmp * (1 - 0.5 * mitig))
      deltas = { environment: -20 * sev, economy: -0.08 * sev, wellbeing: -10 * sev }
      text = `A climate disaster strikes ${district}. ${dyn.debt > 0.4 ? 'Years of unchecked extraction make it far worse than it should have been' : 'Earlier restraint keeps the damage contained'}.`
      break
    }
    case 'disinfo': {
      // Disinformation preys on low transparency and manipulable participation.
      const exposure = 0.6 * part.disinfoVuln + 0.4 * (1 - g.transparency)
      const defense = 0.5 * g.transparency + 0.3 * f.auditFrequency + 0.2 * (dyn.trust / 100)
      sev = clamp01(rng.range(0.4, 0.7) * (0.5 + exposure) * (1 - 0.5 * defense))
      deltas = { trust: -15 * sev, legitimacy: -12 * sev, liberties: -5 * sev }
      text = `A disinformation wave targets the ${part.label.toLowerCase()} process. ${g.transparency > 0.6 ? 'Open records let citizens debunk it quickly' : 'In the absence of transparency, rumours harden into belief'}.`
      break
    }
    default:
      break
  }
  return { sev, deltas, text }
}

export function runSimulation(settings, seed) {
  const rng = makeRng(`${seed}`)
  const { INIT, INERTIA, ECON, BIAS, GOODHART, ENVIRO, GROUP_DISADVANTAGE, N_AGENTS, N_GROUPS, YEARS } = CONST

  const g = settings.governance
  const sv = settings.services
  const f = settings.fairness
  const en = settings.environment
  const part = PARTICIPATION_MODES[g.participation]
  const guard = GUARDIAN_MODES[en.futureGuardian]
  const automation = 1 - sv.humanInLoop

  // Static bundle handed to the shock functions.
  const st = { g, sv, f, en, part, guard, automation }

  // ---- Static derived factors (don't change year to year) ----------------
  const efficiency = clamp01(
    0.35 * g.aiAutonomy + 0.25 * g.centralization + 0.25 * automation + 0.15 * sv.dataSharing,
  )
  // Goodhart on bias correction: only the part up to the peak helps; the part
  // beyond the peak is wasted effort that drags accuracy/output.
  const usefulCorrection = Math.min(f.biasCorrection, GOODHART.biasCorrectionPeak)
  const overCorrection = Math.max(0, f.biasCorrection - GOODHART.biasCorrectionPeak)
  const accuracyPenalty = GOODHART.biasCorrectionPenalty * overCorrection

  // Fragility add-ons from pushing centralization / automation past their
  // safe thresholds.
  const centralFrag = Math.max(0, g.centralization - GOODHART.centralizationFragility)
  const autoFrag = Math.max(0, automation - GOODHART.automationFragility)

  // How much extra services personalization actually delivers (needs data,
  // and strong privacy throttles the data it can use).
  const persEffective = sv.personalization * (0.4 + 0.6 * sv.dataSharing) * (1 - 0.4 * f.privacy)

  // How strongly the system compresses the income distribution.
  const redistribution = clamp01(0.5 * sv.coverage + 0.4 * usefulCorrection + 0.2 * f.humanReview)

  // ---- Agents ------------------------------------------------------------
  // Each citizen has a group (fairness measurement) and an income that
  // compounds over time. Disadvantaged groups grow slower unless redistribution
  // lifts them — that's what makes inequality emerge from the settings.
  const agents = []
  for (let i = 0; i < N_AGENTS; i++) {
    const group = i % N_GROUPS
    agents.push({
      group,
      income: 100 * rng.range(0.55, 1.5) * (1 - 0.25 * GROUP_DISADVANTAGE[group]),
    })
  }

  // ---- Dynamic state -----------------------------------------------------
  const dyn = {
    wellbeing: INIT.wellbeing,
    trust: INIT.trust,
    liberties: INIT.liberties,
    environment: INIT.environment,
    economy: INIT.economy,
    resilience: INIT.resilience,
    legitimacy: INIT.legitimacy,
    debt: 0, // environmental debt, 0..~1
    gini: 0,
  }

  const series = []
  const events = []

  // Seed an initial gini from the starting incomes.
  dyn.gini = gini(agents.map((a) => a.income))

  for (let year = 0; year <= YEARS; year++) {
    // === 0. Compliance: low trust/legitimacy means citizens disengage, which
    // bleeds real economic output (a key feedback / death-spiral channel). ===
    const complianceNorm = clamp01(0.5 * (dyn.trust / 100) + 0.5 * (dyn.legitimacy / 100))
    const compliance = ECON.complianceFloor + (1 - ECON.complianceFloor) * complianceNorm

    if (year > 0) {
      // === 1. Economic growth ===
      let growth =
        ECON.baseGrowth +
        ECON.efficiencyGain * efficiency -
        ECON.deliberationDrag * part.drag -
        ECON.coverageCost * sv.coverage -
        ECON.capCost * en.resourceCap -
        ECON.biasCorrectionCost * accuracyPenalty -
        ECON.privacyCost * f.privacy -
        ECON.humanInLoopCost * sv.humanInLoop - // human review is slower than automation
        ECON.timeDiscountCost * en.timeDiscount // long-termism forgoes near-term output
      growth *= 0.55 + 0.45 * compliance // trust gates real output
      dyn.economy *= 1 + growth

      // === 2. Agent incomes & inequality ===
      // Two forces shape the income distribution each year:
      //   (a) a structural growth penalty on disadvantaged groups (shrinks as
      //       redistribution rises), and
      //   (b) redistribution pulls incomes toward the mean, while its ABSENCE
      //       lets returns concentrate on those already ahead (rich-get-richer).
      // Together these make inequality genuinely responsive to the settings.
      const meanIncome = agents.reduce((s, a) => s + a.income, 0) / agents.length
      const compression = 0.015 * redistribution
      const concentration = 0.032 * (1 - redistribution)
      for (const a of agents) {
        const dis = GROUP_DISADVANTAGE[a.group]
        const penalty = dis * (0.55 - 0.5 * redistribution)
        a.income *= 1 + growth * (1 - penalty)
        a.income += (meanIncome - a.income) * compression // pull toward mean
        if (a.income > meanIncome) a.income *= 1 + concentration // returns concentrate
      }

      // === 3. Bias incidents ===
      let biasRisk =
        BIAS.baseRisk +
        BIAS.dataSharingAmp * sv.dataSharing +
        BIAS.automationAmp * automation -
        BIAS.correctionMitigation * usefulCorrection -
        BIAS.auditMitigation * f.auditFrequency -
        BIAS.humanReviewMitigation * f.humanReview
      biasRisk = clamp01(biasRisk)
      if (biasRisk > 0.02 && rng.chance(biasRisk)) {
        // Pick an affected group, weighted toward the more disadvantaged.
        const weights = GROUP_DISADVANTAGE.map((d) => 0.2 + d)
        const total = weights.reduce((s, w) => s + w, 0)
        let r = rng.float() * total
        let hitGroup = 0
        for (let gi = 0; gi < weights.length; gi++) {
          r -= weights[gi]
          if (r <= 0) {
            hitGroup = gi
            break
          }
        }
        // Contestability + transparency soften both the income hit and the
        // trust hit (problems are caught and corrected, not buried).
        const softening = clamp01(0.5 * f.humanReview + 0.5 * g.transparency)
        const incomeHit = 0.05 * (1 - 0.6 * softening)
        for (const a of agents) if (a.group === hitGroup) a.income *= 1 - incomeHit
        const trustHit =
          BIAS.trustHitOpaque - (BIAS.trustHitOpaque - BIAS.trustHitTransparent) * softening
        dyn.trust = clamp(dyn.trust - trustHit)
        const district = DISTRICTS[Math.min(hitGroup, DISTRICTS.length - 1)]
        events.push({
          year,
          kind: 'bias',
          severity: clamp01(trustHit / BIAS.trustHitOpaque),
          text: `Bias incident in an automated decision system; ${district} bears the brunt. Trust −${trustHit.toFixed(0)}. ${softening > 0.5 ? 'Strong contestability means it is caught and partly remedied.' : 'With weak oversight, the harm compounds quietly.'}`,
        })
      }

      // === 4. Environment & debt ===
      const activity = clamp01((dyn.economy / 100 - 0.6) / 2) // 0..1 economic pressure
      const extraction = clamp01(
        (1 - en.resourceCap) * (0.55 + 0.45 * activity) * (1 - 0.45 * en.timeDiscount) * (1 - 0.5 * guard.protect),
      )
      const over = extraction - ENVIRO.sustainableExtraction
      if (over > 0) {
        dyn.environment = clamp(dyn.environment - ENVIRO.extractionToDamage * over * 100 * 0.35)
        dyn.debt = clamp01(dyn.debt + ENVIRO.debtAccrual * over)
      } else {
        dyn.environment = clamp(
          dyn.environment + ENVIRO.recovery * 100 * (-over / ENVIRO.sustainableExtraction) + ENVIRO.recovery * 30 * guard.protect,
        )
        dyn.debt = clamp01(dyn.debt - 0.03 * en.resourceCap) // slowly repay
      }
    }

    // === 5. Inequality recompute ===
    dyn.gini = gini(agents.map((a) => a.income))
    const giniPenalty = clamp01(dyn.gini * 1.8)

    // === 6. Legitimacy ===
    const legitTarget =
      100 *
      clamp01(
        0.2 +
          0.3 * part.legit +
          0.18 * g.transparency +
          0.14 * f.humanReview +
          0.1 * (dyn.liberties / 100) +
          0.1 * sv.coverage -
          0.22 * g.aiAutonomy -
          0.1 * g.centralization -
          guard.legitCost,
      )
    dyn.legitimacy = moveToward(dyn.legitimacy, legitTarget, INERTIA.legitimacy)

    // === 7. Civil liberties ===
    const libTarget =
      100 *
      clamp01(
        0.34 +
          0.22 * f.privacy +
          0.2 * f.humanReview +
          0.15 * g.transparency +
          0.1 * part.legit -
          0.17 * g.aiAutonomy -
          0.11 * g.centralization -
          0.13 * sv.dataSharing,
      )
    dyn.liberties = moveToward(dyn.liberties, libTarget, INERTIA.liberties)

    // === 8. Trust (relax toward target; incident hits already applied) ===
    const trustTarget =
      100 *
      clamp01(
        0.15 +
          0.25 * (dyn.legitimacy / 100) +
          0.2 * g.transparency +
          0.18 * (dyn.wellbeing / 100) +
          0.12 * f.humanReview +
          0.12 * (1 - giniPenalty) +
          0.08 * f.auditFrequency,
      )
    dyn.trust = moveToward(dyn.trust, trustTarget, INERTIA.trust, true)

    // === 9. Resilience (feeds on environment + trust; drained by brittleness) ===
    const resilTarget =
      100 *
      clamp01(
        0.3 +
          0.18 * (1 - g.centralization) +
          0.16 * part.resil +
          0.14 * sv.coverage +
          0.12 * sv.humanInLoop +
          0.1 * (dyn.environment / 100) +
          0.1 * (dyn.trust / 100) +
          0.08 * en.timeDiscount +
          0.08 * guard.protect -
          0.22 * g.aiAutonomy -
          0.18 * automation -
          0.4 * centralFrag -
          0.4 * autoFrag,
      )
    dyn.resilience = moveToward(dyn.resilience, resilTarget, INERTIA.resilience)

    // === 10. Wellbeing ===
    const econNorm = clamp01((dyn.economy / 100 - 0.7) / 1.6)
    const serviceEff = clamp01(
      0.35 + 0.3 * persEffective + 0.22 * sv.coverage + 0.1 * sv.humanInLoop - 0.25 * accuracyPenalty,
    )
    const wellbeingTarget =
      100 *
      clamp01(
        0.16 +
          0.3 * serviceEff +
          0.18 * econNorm +
          0.12 * (dyn.environment / 100) +
          0.1 * (dyn.liberties / 100) +
          0.08 * (dyn.trust / 100) -
          0.25 * giniPenalty,
      )
    dyn.wellbeing = moveToward(dyn.wellbeing, wellbeingTarget, INERTIA.wellbeing)

    // === 11. Shocks ===
    if (year >= CONST.SHOCKS.minYear && rng.chance(CONST.SHOCKS.yearlyChance)) {
      const kind = rng.pick(['pandemic', 'crash', 'aiFailure', 'climate', 'disinfo'])
      const { sev, deltas, text } = applyShock(kind, st, dyn, rng)
      if (sev > 0.05) {
        for (const [k, d] of Object.entries(deltas)) {
          if (k === 'economy') dyn.economy *= 1 + d
          else dyn[k] = clamp(dyn[k] + d)
        }
        if (kind === 'climate') dyn.debt = clamp01(dyn.debt + 0.05 * sev)
        events.push({ year, kind, severity: sev, text })
      }
    }

    // === 12. Clamp & record ===
    dyn.wellbeing = clamp(dyn.wellbeing)
    dyn.trust = clamp(dyn.trust)
    dyn.liberties = clamp(dyn.liberties)
    dyn.environment = clamp(dyn.environment)
    dyn.resilience = clamp(dyn.resilience)
    dyn.legitimacy = clamp(dyn.legitimacy)

    series.push({
      year,
      wellbeing: round(dyn.wellbeing),
      gini: round(dyn.gini, 3),
      trust: round(dyn.trust),
      liberties: round(dyn.liberties),
      environment: round(dyn.environment),
      economy: round(dyn.economy),
      resilience: round(dyn.resilience),
      legitimacy: round(dyn.legitimacy),
    })
  }

  // ---- Derived fairness gap: advantaged vs disadvantaged mean income ----
  const adv = agents.filter((a) => GROUP_DISADVANTAGE[a.group] <= 0.15)
  const dis = agents.filter((a) => GROUP_DISADVANTAGE[a.group] >= 0.3)
  const meanAdv = adv.reduce((s, a) => s + a.income, 0) / Math.max(1, adv.length)
  const meanDis = dis.reduce((s, a) => s + a.income, 0) / Math.max(1, dis.length)
  const fairnessGap = round(meanAdv / Math.max(1, meanDis), 2)

  const final = { ...series[series.length - 1], debt: round(dyn.debt, 2), fairnessGap }

  return { settings, seed, series, events, final }
}

function round(x, dp = 1) {
  const m = Math.pow(10, dp)
  return Math.round(x * m) / m
}
