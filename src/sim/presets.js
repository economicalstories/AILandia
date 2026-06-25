// ===========================================================================
// Presets — four contrasting founding philosophies for AILandia.
//
// Each is designed to WIN on some measures and LOSE on others, so that
// comparing them makes the central lesson (no configuration wins on
// everything) impossible to miss.
// ===========================================================================

export const PRESETS = {
  technocratic: {
    name: 'Technocratic Efficiency',
    tagline: 'Hand the wheel to the machine. Optimize output, worry about consent later.',
    settings: {
      governance: { aiAutonomy: 0.95, centralization: 0.9, transparency: 0.25, participation: 'none' },
      services: { personalization: 0.9, coverage: 0.45, humanInLoop: 0.15, dataSharing: 0.95 },
      fairness: { auditFrequency: 0.3, humanReview: 0.2, biasCorrection: 0.35, privacy: 0.2 },
      environment: { timeDiscount: 0.2, futureGuardian: 'none', resourceCap: 0.2 },
    },
  },
  participatory: {
    name: 'Participatory Guardrails',
    tagline: 'Keep humans in charge. Trade some speed for consent, rights and recovery.',
    settings: {
      governance: { aiAutonomy: 0.45, centralization: 0.3, transparency: 0.9, participation: 'sortition' },
      services: { personalization: 0.6, coverage: 0.85, humanInLoop: 0.75, dataSharing: 0.45 },
      fairness: { auditFrequency: 0.8, humanReview: 0.9, biasCorrection: 0.55, privacy: 0.75 },
      environment: { timeDiscount: 0.6, futureGuardian: 'advisory', resourceCap: 0.55 },
    },
  },
  laissez: {
    name: 'Laissez-faire',
    tagline: 'Minimal state, minimal safety net. Let outcomes fall where they may.',
    settings: {
      governance: { aiAutonomy: 0.3, centralization: 0.25, transparency: 0.45, participation: 'periodic' },
      services: { personalization: 0.55, coverage: 0.15, humanInLoop: 0.35, dataSharing: 0.55 },
      fairness: { auditFrequency: 0.2, humanReview: 0.25, biasCorrection: 0.1, privacy: 0.4 },
      environment: { timeDiscount: 0.25, futureGuardian: 'none', resourceCap: 0.2 },
    },
  },
  longtermist: {
    name: 'Long-termist Stewardship',
    tagline: 'Govern for the century. Protect the planet and the unborn, accept slower growth.',
    settings: {
      governance: { aiAutonomy: 0.5, centralization: 0.45, transparency: 0.85, participation: 'sortition' },
      services: { personalization: 0.6, coverage: 0.8, humanInLoop: 0.7, dataSharing: 0.5 },
      fairness: { auditFrequency: 0.75, humanReview: 0.8, biasCorrection: 0.6, privacy: 0.7 },
      environment: { timeDiscount: 0.95, futureGuardian: 'veto', resourceCap: 0.9 },
    },
  },
}

export const PRESET_ORDER = ['technocratic', 'participatory', 'laissez', 'longtermist']
