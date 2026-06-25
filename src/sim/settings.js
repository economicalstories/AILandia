// ===========================================================================
// Settings schema — the four founding "dial" domains.
//
// This descriptor drives BOTH the UI (labels, tooltips, control types) and the
// shape of the settings object the model consumes. Keeping one source of truth
// means a new dial only has to be declared once.
//
// Control types:
//   'slider'  -> continuous 0..1 float. `ends` labels the two extremes.
//   'choice'  -> one of `options` (value/label pairs).
// Each control's `tip` explains the tradeoff it controls.
// ===========================================================================

export const DOMAINS = [
  {
    key: 'governance',
    title: 'Governance',
    blurb: 'How major policy decisions get made.',
    icon: '🏛️',
    controls: [
      {
        key: 'aiAutonomy',
        label: 'AI autonomy',
        type: 'slider',
        ends: ['Advisory', 'Full autonomy'],
        tip: 'How much decision-making is handed to AI. Higher = faster, more efficient governance, but weaker human consent, fewer liberties, and a more brittle system if the AI fails.',
      },
      {
        key: 'centralization',
        label: 'Centralization',
        type: 'slider',
        ends: ['Distributed / local', 'Centralized'],
        tip: 'Where power sits. Central control coordinates fast (useful in some crises) but creates single points of failure and lowers local resilience and legitimacy.',
      },
      {
        key: 'transparency',
        label: 'Transparency',
        type: 'slider',
        ends: ['Opaque', 'Fully auditable'],
        tip: 'How visible the machinery of state is. Auditability builds trust and catches bias early, at a small efficiency cost and some tension with privacy.',
      },
      {
        key: 'participation',
        label: 'Citizen participation',
        type: 'choice',
        options: [
          { value: 'none', label: 'None' },
          { value: 'periodic', label: 'Periodic vote' },
          { value: 'liquid', label: 'Liquid democracy' },
          { value: 'sortition', label: 'Sortition assemblies' },
        ],
        tip: 'How citizens shape decisions. More participation builds legitimacy and resilience but slows decisions; liquid democracy is powerful yet exposed to disinformation, while sortition is steadier under manipulation.',
      },
    ],
  },
  {
    key: 'services',
    title: 'Services',
    blurb: 'Health, education and social support.',
    icon: '🏥',
    controls: [
      {
        key: 'personalization',
        label: 'Personalization',
        type: 'slider',
        ends: ['Standardized', 'Hyper-personalized'],
        tip: 'How tailored services are. Personalization lifts wellbeing but depends on data sharing (privacy cost) and raises bias risk if the data is skewed.',
      },
      {
        key: 'coverage',
        label: 'Coverage',
        type: 'slider',
        ends: ['Means-tested', 'Universal'],
        tip: 'Who gets support. Universal coverage cuts inequality and builds legitimacy and resilience, but carries a real fiscal cost that slows raw output.',
      },
      {
        key: 'humanInLoop',
        label: 'Human-in-the-loop',
        type: 'slider',
        ends: ['Fully automated', 'Human-reviewed'],
        tip: 'How much a person checks automated decisions. Review reduces bias and builds trust and contestability, but is slower and costlier than full automation.',
      },
      {
        key: 'dataSharing',
        label: 'Data sharing',
        type: 'slider',
        ends: ['Siloed', 'Fully integrated'],
        tip: 'How freely data flows between services. Integration boosts personalization and coordination, but erodes privacy and liberties and widens the blast radius of any bias incident.',
      },
    ],
  },
  {
    key: 'fairness',
    title: 'Fairness, Rights & Bias',
    blurb: 'Protection, contestability and bias control.',
    icon: '⚖️',
    controls: [
      {
        key: 'auditFrequency',
        label: 'Audit frequency',
        type: 'slider',
        ends: ['Rare', 'Continuous'],
        tip: 'How often systems are audited for bias and error. Frequent audits catch problems early and build trust, at a modest efficiency cost.',
      },
      {
        key: 'humanReview',
        label: 'Right to human review',
        type: 'slider',
        ends: ['Off', 'Strong'],
        tip: 'Whether people can contest automated decisions and reach a human. Strong contestability protects rights, fairness and trust; it slows throughput slightly.',
      },
      {
        key: 'biasCorrection',
        label: 'Bias-correction aggressiveness',
        type: 'slider',
        ends: ['None', 'Aggressive'],
        tip: 'How hard the system actively corrects group disparities. Helps fairness up to a point — then Goodhart bites: over-correction degrades overall accuracy and output.',
      },
      {
        key: 'privacy',
        label: 'Privacy protection',
        type: 'slider',
        ends: ['Weak', 'Strong'],
        tip: 'How well personal data is protected. Strong privacy lifts liberties and trust, but limits the data reuse that powers personalization and growth.',
      },
    ],
  },
  {
    key: 'environment',
    title: 'Environment & Future Generations',
    blurb: 'The long horizon and those not yet born.',
    icon: '🌱',
    controls: [
      {
        key: 'timeDiscount',
        label: 'Time horizon',
        type: 'slider',
        ends: ['Short-termist', 'Long-termist'],
        tip: 'How much the future is valued against today. Long horizons protect the environment and long-run resilience, but suppress near-term economic output.',
      },
      {
        key: 'futureGuardian',
        label: 'Future-generations representation',
        type: 'choice',
        options: [
          { value: 'none', label: 'None' },
          { value: 'advisory', label: 'Advisory guardian' },
          { value: 'veto', label: 'Guardian with veto' },
        ],
        tip: 'Whether the unborn get a voice. An AI guardian defends the long term — but a veto that overrides the living electorate can itself dent legitimacy.',
      },
      {
        key: 'resourceCap',
        label: 'Resource-extraction cap',
        type: 'slider',
        ends: ['No cap', 'Strict cap'],
        tip: 'How hard limits are placed on extraction. No cap boosts the early economy but banks environmental debt that amplifies later climate shocks; a strict cap costs growth now to stay safe.',
      },
    ],
  },
]

// Default founding settings — a deliberately middling, balanced start.
export const DEFAULT_SETTINGS = {
  governance: { aiAutonomy: 0.5, centralization: 0.5, transparency: 0.5, participation: 'periodic' },
  services: { personalization: 0.5, coverage: 0.5, humanInLoop: 0.5, dataSharing: 0.5 },
  fairness: { auditFrequency: 0.5, humanReview: 0.5, biasCorrection: 0.4, privacy: 0.5 },
  environment: { timeDiscount: 0.5, futureGuardian: 'advisory', resourceCap: 0.5 },
}

// Deep clone helper so presets/defaults are never mutated by the UI.
export function cloneSettings(s) {
  return {
    governance: { ...s.governance },
    services: { ...s.services },
    fairness: { ...s.fairness },
    environment: { ...s.environment },
  }
}
