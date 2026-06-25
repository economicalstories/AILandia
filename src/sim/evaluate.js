// ===========================================================================
// Evaluation — turns a finished run into human-readable judgement.
//
// Two products:
//   1. reportCard(result)  — a 30-year Society Report Card: letter grade per
//      domain, a verdict, the biggest tradeoff made, and shock weathering.
//   2. crewEvaluation(result) — the 10-year evaluation in the EXACT marking
//      format the assignment asks for (Quality of life / Fairness / Resilience
//      to crisis, each rated /10, with "Why" and "In 10 years" lines, plus a
//      blunt overall verdict). This deliberately judges the society at the
//      10-year mark, because that is what the marking crew is asked to review.
// ===========================================================================

import { PARTICIPATION_MODES, GUARDIAN_MODES } from './constants.js'

const clamp = (x, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, x))
const avg = (series, key, from = 0) => {
  const xs = series.slice(from).map((r) => r[key])
  return xs.reduce((s, x) => s + x, 0) / xs.length
}

// Map an economy index to a 0..100 score (130 ≈ modest growth ≈ 50).
const econScore = (idx) => clamp(50 + (idx - 130) / 3.5)

// 0..100 -> letter grade.
function letter(score) {
  if (score >= 85) return 'A'
  if (score >= 75) return 'A−'
  if (score >= 68) return 'B+'
  if (score >= 60) return 'B'
  if (score >= 53) return 'B−'
  if (score >= 46) return 'C+'
  if (score >= 38) return 'C'
  if (score >= 30) return 'C−'
  if (score >= 22) return 'D'
  return 'F'
}

// 0..100 -> rating out of 10 (never 0; floors at 1 so there is always a number).
const toTen = (score) => clamp(Math.round(score / 10), 1, 10)

// ---------------------------------------------------------------------------
// Composite scores shared by both products.
// ---------------------------------------------------------------------------
function scores(result, snap, eventsUpTo) {
  const { series } = result
  const giniPenalty = clamp(100 - (snap.gini - 0.12) * 240)
  const gapScore = clamp(110 - (result.final.fairnessGap || 1.5) * 30)
  const biasCount = eventsUpTo.filter((e) => e.kind === 'bias').length
  const contest = result.settings.fairness.humanReview * 100

  // Worst single-year wellbeing after the settling period — a shock-vulnerability proxy.
  const worstWellbeing = Math.min(...series.slice(5, snap.year + 1).map((r) => r.wellbeing), snap.wellbeing)

  const qol = clamp(
    0.42 * snap.wellbeing +
      0.18 * econScore(snap.economy) +
      0.15 * snap.liberties +
      0.12 * snap.environment +
      0.13 * giniPenalty,
  )
  const fairness = clamp(
    0.38 * giniPenalty +
      0.18 * gapScore +
      0.2 * snap.liberties +
      0.24 * contest -
      Math.min(22, biasCount * 4),
  )
  const resilience = clamp(
    0.4 * snap.resilience +
      0.15 * snap.trust +
      0.15 * snap.environment +
      0.15 * worstWellbeing +
      0.15 * (100 - (result.final.debt || 0) * 100),
  )
  return { qol, fairness, resilience, biasCount, worstWellbeing }
}

// ---------------------------------------------------------------------------
// 30-year Society Report Card.
// ---------------------------------------------------------------------------
export function reportCard(result) {
  const { settings, series, events, final } = result
  const s = settings

  const governance = clamp(0.4 * final.legitimacy + 0.3 * final.trust + 0.3 * final.liberties)
  const servicesD = clamp(
    0.45 * avg(series, 'wellbeing') + 0.3 * clamp(100 - (final.gini - 0.12) * 240) + 0.25 * econScore(final.economy),
  )
  const sc = scores(result, final, events)
  const environmentD = clamp(0.45 * final.environment + 0.3 * sc.resilience + 0.25 * (100 - (final.debt || 0) * 100))

  const domains = [
    { key: 'Governance', score: governance, grade: letter(governance) },
    { key: 'Services', score: servicesD, grade: letter(servicesD) },
    { key: 'Fairness', score: sc.fairness, grade: letter(sc.fairness) },
    { key: 'Environment', score: environmentD, grade: letter(environmentD) },
  ]

  // Biggest tradeoff: the largest gap between this run's strongest and weakest
  // headline metric, described in plain language.
  const headline = [
    { name: 'economic output', v: econScore(final.economy) },
    { name: 'wellbeing', v: final.wellbeing },
    { name: 'equality', v: clamp(100 - (final.gini - 0.12) * 240) },
    { name: 'civil liberties', v: final.liberties },
    { name: 'public trust', v: final.trust },
    { name: 'environmental health', v: final.environment },
    { name: 'resilience', v: final.resilience },
    { name: 'legitimacy', v: final.legitimacy },
  ].sort((a, b) => b.v - a.v)
  const best = headline[0]
  const worst = headline[headline.length - 1]
  const tradeoff = `This society bought high ${best.name} (${best.v.toFixed(0)}/100) largely at the expense of ${worst.name} (${worst.v.toFixed(0)}/100).`

  // Shock weathering.
  const shocks = events.filter((e) => e.kind !== 'bias')
  const bigShocks = shocks.filter((e) => e.severity > 0.45)
  const shockText = shocks.length
    ? `AILandia faced ${shocks.length} major shock${shocks.length === 1 ? '' : 's'} (${[...new Set(shocks.map((e) => e.kind))].join(', ')}). ${
        final.resilience > 60
          ? 'Its buffers held and it recovered each time.'
          : final.resilience > 40
          ? 'It absorbed them unevenly, with lasting scars in the weaker years.'
          : 'It struggled to recover, and the damage compounded.'
      }${bigShocks.length ? ` ${bigShocks.length} hit hard.` : ''}`
    : 'No major shocks struck on this seed — a comparatively gentle 30 years.'

  const overall = clamp((governance + servicesD + sc.fairness + environmentD) / 4)
  const verdict = buildVerdict(overall, best, worst)

  return { domains, overall, grade: letter(overall), tradeoff, shockText, verdict }
}

function buildVerdict(overall, best, worst) {
  if (overall >= 72)
    return `A broadly thriving AILandia: strong on ${best.name}, with no domain left to collapse — a defensible founding settlement.`
  if (overall >= 55)
    return `A workable but uneven AILandia: ${best.name} carries it, while ${worst.name} is the standing liability the founders chose to accept.`
  if (overall >= 40)
    return `A mixed, fragile AILandia: gains in ${best.name} are undercut by a serious deficit in ${worst.name}.`
  return `A failing AILandia: the settings sacrificed ${worst.name} so heavily that the gains in ${best.name} cannot hold the society together.`
}

// ---------------------------------------------------------------------------
// 10-year crew evaluation, in the exact required marking format.
// ---------------------------------------------------------------------------
export function crewEvaluation(result) {
  // The crew reviews the society as it stands at the 10-year mark.
  const yr = Math.min(10, result.series.length - 1)
  const snap = result.series[yr]
  const eventsUpTo = result.events.filter((e) => e.year <= yr)
  const sc = scores(result, snap, eventsUpTo)
  const s = result.settings

  const qolR = toTen(sc.qol)
  const fairR = toTen(sc.fairness)
  const resR = toTen(sc.resilience)

  const part = PARTICIPATION_MODES[s.governance.participation].label.toLowerCase()
  const guard = GUARDIAN_MODES[s.environment.futureGuardian].label.toLowerCase()

  // ---- Quality of life lines ----
  const qolWhy =
    sc.qol >= 70
      ? `Services are effective and broadly funded, and prosperity is shared enough that most people are healthy, supported and secure.`
      : sc.qol >= 50
      ? `Average wellbeing is decent, but ${snap.gini > 0.4 ? 'sharp inequality' : 'thin coverage'} leaves a real slice of the population underserved.`
      : `Thin coverage and ${snap.gini > 0.25 ? 'sharp inequality' : 'an uneven safety net'} mean a meaningful share of people lack health, support or security.`
  const qolFuture =
    sc.qol >= 70
      ? `Life is comfortable and improving for most, with good schools, healthcare and a visible social floor.`
      : sc.qol >= 50
      ? `Life is tolerable for the middle but precarious at the bottom, where the safety net is thin.`
      : `Daily life is a struggle for many, with overstretched services and little reliable support.`

  // ---- Fairness lines ----
  const fairWhy =
    sc.fairness >= 70
      ? `Strong contestability and active bias control keep groups close to parity and let people challenge bad decisions.`
      : sc.fairness >= 50
      ? `Some safeguards exist, but ${s.fairness.humanReview < 0.5 ? 'weak rights to human review' : 'persistent group gaps'} let unfairness accumulate.`
      : `With ${s.fairness.humanReview < 0.4 ? 'almost no right to challenge decisions' : 'minimal bias correction'} and ${sc.biasCount} recorded bias incident${sc.biasCount === 1 ? '' : 's'}, disadvantaged groups are systematically worse off.`
  const fairFuture =
    sc.fairness >= 70
      ? `Different groups are treated comparably and citizens trust they can contest the system and be heard.`
      : sc.fairness >= 50
      ? `A two-tier feel is emerging: fair enough on paper, uneven in practice.`
      : `A clear underclass has formed, with little recourse against automated decisions that go against them.`

  // ---- Resilience lines ----
  const shocksSoFar = eventsUpTo.filter((e) => e.kind !== 'bias')
  const resWhy =
    sc.resilience >= 70
      ? `Distributed structures, a safety net and human fallbacks give AILandia deep buffers against shocks.`
      : sc.resilience >= 50
      ? `It can take a hit, but ${s.governance.aiAutonomy > 0.7 || s.services.humanInLoop < 0.3 ? 'heavy reliance on automation' : s.governance.centralization > 0.7 ? 'central single points of failure' : 'thin reserves'} make recovery slow.`
      : `Over-${s.governance.aiAutonomy > 0.7 ? 'automation' : s.governance.centralization > 0.7 ? 'centralization' : 'extraction'} and weak buffers leave it brittle; a serious crisis could cascade.`
  const resFuture =
    sc.resilience >= 70
      ? `When a major crisis hits, AILandia coordinates, absorbs the blow and bounces back within a year or two.`
      : sc.resilience >= 50
      ? `A major crisis is survivable but costly, leaving scars that take years to heal.`
      : `A major crisis — ${shocksSoFar.length ? shocksSoFar[0].kind : 'a pandemic or system failure'} — risks tipping the society into a downward spiral it cannot easily escape.`

  const overall = (sc.qol + sc.fairness + sc.resilience) / 3
  const overallVerdict =
    overall >= 68
      ? `Overall verdict: A genuinely thriving, broadly ethical society — the founders made hard tradeoffs but left no domain to rot.`
      : overall >= 48
      ? `Overall verdict: A mixed outcome — real strengths in places, but ${qolR <= fairR && qolR <= resR ? 'quality of life' : fairR <= resR ? 'fairness' : 'resilience'} was sacrificed enough to keep this from being a clear success.`
      : `Overall verdict: A serious failure in the making — the settings optimised a narrow goal and let the foundations of a liveable, fair, shock-proof society erode.`

  const text =
    `Quality of life: ${qolR}/10 Why: ${qolWhy} In 10 years: ${qolFuture}\n\n` +
    `Fairness: ${fairR}/10 Why: ${fairWhy} In 10 years: ${fairFuture}\n\n` +
    `Resilience to crisis: ${resR}/10 Why: ${resWhy} In 10 years: ${resFuture}\n\n` +
    `${overallVerdict}`

  return { qol: qolR, fairness: fairR, resilience: resR, text }
}
