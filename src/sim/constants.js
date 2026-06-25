// ===========================================================================
// AILandia simulation — TUNABLE CONSTANTS & DOCUMENTED ASSUMPTIONS
// ===========================================================================
//
// This file is the "dial board" behind the dial board. Everything that shapes
// how the model behaves lives here so the behaviour is auditable and tweakable
// in one place. The model itself (model.js) only reads from CONST.
//
// CORE MODELLING ASSUMPTIONS (read me before trusting any number):
//
//  1. This is a THINKING TOOL, not a forecast. The relationships below encode
//     plausible-but-arguable social-science intuitions, not measured effects.
//     Numbers are chosen so that tradeoffs are *visible*, not so they are
//     *correct*. Treat outputs as "given these assumptions, what tensions
//     emerge?" — never as a prediction about any real society.
//
//  2. NO SETTING WINS ON EVERYTHING. This is enforced on purpose. Every lever
//     that helps one metric is wired to cost another:
//        - Efficiency levers (full AI autonomy, centralization, automation,
//          data sharing) raise economic output but lower liberties, legitimacy,
//          and resilience (brittleness).
//        - Legitimacy levers (participation, transparency, contestability)
//          raise trust/resilience but add a "deliberation drag" on output.
//        - Care levers (universal coverage, human-in-loop, privacy, strong
//          rights) raise wellbeing/fairness but cost fiscal/efficiency.
//        - Stewardship levers (long time horizon, resource cap, future
//          guardian) protect the environment and long-run resilience but
//          suppress near-term output, and a guardian VETO can dent legitimacy
//          by overriding the living electorate.
//
//  3. GOODHART: pushing any single lever to its extreme triggers diminishing
//     or negative returns on a *related* metric (see GOODHART_* below). The
//     classic case modelled here is aggressive bias-correction, which improves
//     group fairness up to a point and then starts degrading overall service
//     accuracy/efficiency.
//
//  4. FEEDBACK & PATH DEPENDENCE: trust is sticky and self-reinforcing. Low
//     trust lowers compliance, which lowers real output and crisis response,
//     which lowers trust further — a death spiral is possible. High
//     participation + transparency build a legitimacy buffer that absorbs
//     shocks.
//
//  5. The environment carries DEBT. Extraction beyond the sustainable rate
//     accumulates invisibly and amplifies the damage of later climate shocks.
//     A society can look rich for 15 years and then pay all at once.
// ===========================================================================

export const CONST = {
  YEARS: 30, // simulation horizon
  N_AGENTS: 240, // citizen-agents (kept small for instant client-side reruns)
  N_GROUPS: 6, // social groups, used to measure fairness ACROSS groups

  // Groups 0..N_GROUPS-1. A "disadvantage" weight makes some groups more
  // exposed to bias incidents and underservice — this is what lets the model
  // measure fairness rather than just average wellbeing.
  GROUP_DISADVANTAGE: [0.0, 0.05, 0.15, 0.3, 0.5, 0.7],

  // ---- Starting metric values (0..100 scale unless noted) ----
  INIT: {
    wellbeing: 58,
    trust: 60,
    liberties: 62,
    environment: 72,
    economy: 100, // an index, not 0..100 — can grow without bound
    resilience: 58,
    legitimacy: 58,
  },

  // How fast a metric moves toward its yearly "target" (inertia). Lower =
  // more sluggish/sticky. Trust falls faster than it rises (asymmetry below).
  INERTIA: {
    wellbeing: 0.35,
    trust: 0.3,
    liberties: 0.4,
    environment: 0.25,
    resilience: 0.3,
    legitimacy: 0.33,
  },

  // Trust drops faster than it recovers (loss aversion / hard-won credibility).
  TRUST_FALL_MULTIPLIER: 1.7,

  // ---- Economy ----
  // Costs below are growth REDUCTIONS, tuned so an "expensive" society (heavy
  // coverage/cap/privacy) still grows slowly rather than collapsing — the
  // tradeoff is slower growth, not ruin.
  ECON: {
    baseGrowth: 0.03, // background productivity growth per year
    efficiencyGain: 0.04, // max extra growth from full efficiency levers
    deliberationDrag: 0.015, // max growth lost to slow/participatory process
    coverageCost: 0.012, // max growth lost to universal coverage (fiscal load)
    capCost: 0.018, // max growth lost to a strict extraction cap (near-term)
    biasCorrectionCost: 0.02, // max growth lost to over-aggressive bias correction
    privacyCost: 0.006, // max growth lost to strong privacy (less data reuse)
    humanInLoopCost: 0.006, // max growth lost to human review being slower
    timeDiscountCost: 0.008, // max growth lost to forgoing near-term output
    // Compliance gate: real output is scaled by how much citizens go along
    // with institutions. trust/legitimacy below the floor bleed output.
    complianceFloor: 0.55,
  },

  // ---- Bias incidents ----
  BIAS: {
    baseRisk: 0.22, // baseline yearly probability of a bias incident
    dataSharingAmp: 0.18, // integrated data => bigger blast radius / more risk
    automationAmp: 0.16, // unsupervised automation raises incident risk
    correctionMitigation: 0.16, // aggressive correction lowers risk...
    auditMitigation: 0.14, // ...as does frequent auditing...
    humanReviewMitigation: 0.12, // ...and a strong right to human review
    trustHitOpaque: 16, // trust lost when an incident hits under opacity
    trustHitTransparent: 5, // trust lost when caught early & contestable
    giniHit: 0.02, // each incident widens income gaps
  },

  // ---- Goodhart thresholds: extremes that backfire ----
  GOODHART: {
    biasCorrectionPeak: 0.65, // fairness gain peaks here; beyond it, accuracy
    biasCorrectionPenalty: 0.5, // strength of the over-correction backfire
    centralizationFragility: 0.6, // centralization above this adds fragility fast
    automationFragility: 0.6, // automation above this adds fragility fast
  },

  // ---- Environment ----
  ENVIRO: {
    sustainableExtraction: 0.4, // extraction at/below this leaves no debt
    extractionToDamage: 0.35, // how strongly over-extraction degrades enviro
    recovery: 0.04, // yearly regen toward 100 when well managed
    debtAccrual: 0.4, // how fast unsustainable extraction banks debt
    debtClimateAmp: 0.9, // how much banked debt amplifies climate shocks
  },

  // ---- Shocks (see model.js for the seeded schedule logic) ----
  SHOCKS: {
    yearlyChance: 0.28, // probability a given year carries a shock
    minYear: 3, // no shocks in the very first couple of settling years
    brittlenessAmp: 1.6, // multiplier on damage from a brittle society
    resilienceMitigation: 0.7, // fraction of damage a maximally resilient state avoids
  },

  // Display metadata for the eight tracked metrics.
  METRICS: [
    { key: 'wellbeing', label: 'Wellbeing', color: '#2f9e8f', higherBetter: true },
    { key: 'gini', label: 'Inequality (Gini)', color: '#c2410c', higherBetter: false, scale: 'gini' },
    { key: 'trust', label: 'Public Trust', color: '#2563eb', higherBetter: true },
    { key: 'liberties', label: 'Civil Liberties', color: '#7c3aed', higherBetter: true },
    { key: 'environment', label: 'Environmental Health', color: '#16a34a', higherBetter: true },
    { key: 'economy', label: 'Economic Output', color: '#b45309', higherBetter: true, scale: 'index' },
    { key: 'resilience', label: 'Resilience', color: '#0891b2', higherBetter: true },
    { key: 'legitimacy', label: 'Legitimacy', color: '#db2777', higherBetter: true },
  ],
}

// Participation modes map to a profile of effects rather than a single number.
//   legit  : baseline legitimacy/consent the mode can generate
//   resil  : resilience contribution (distributed sense-making, buy-in)
//   drag   : economic deliberation drag it imposes
//   disinfoVuln : how exposed the mode is to a disinformation shock
export const PARTICIPATION_MODES = {
  none: { label: 'None', legit: 0.1, resil: 0.05, drag: 0.0, disinfoVuln: 0.5 },
  periodic: { label: 'Periodic vote', legit: 0.45, resil: 0.3, drag: 0.15, disinfoVuln: 0.7 },
  liquid: { label: 'Continuous liquid democracy', legit: 0.8, resil: 0.6, drag: 0.45, disinfoVuln: 0.85 },
  sortition: { label: 'Sortition assemblies', legit: 0.75, resil: 0.75, drag: 0.3, disinfoVuln: 0.35 },
}

// Future-generations guardian modes.
//   protect : how strongly it defends the environment / long horizon
//   legitCost : how much overriding the living electorate dents legitimacy
export const GUARDIAN_MODES = {
  none: { label: 'None', protect: 0.0, legitCost: 0.0 },
  advisory: { label: 'Advisory guardian', protect: 0.45, legitCost: 0.03 },
  veto: { label: 'Guardian with veto', protect: 0.9, legitCost: 0.12 },
}
