// ===========================================================================
// Narration — a one-line "state of the nation" for any single playback year.
//
// This is pure flavour for the year-by-year playback: given a finished run and
// a year, it reads the year-over-year movement in the metrics and turns the
// dominant trend(s) into a sentence, so watching the run feels like a story
// rather than eight rows of numbers. Deterministic and side-effect free.
// ===========================================================================

// Per-metric phrasing. `up`/`down` describe the DIRECTION of the raw value;
// `good` says whether "up" is the desirable direction (Gini is inverted).
const PHRASES = {
  wellbeing: { up: 'wellbeing climbs', down: 'wellbeing slips', good: true },
  trust: { up: 'public trust rebuilds', down: 'public trust erodes', good: true },
  gini: { up: 'inequality widens', down: 'inequality narrows', good: false },
  liberties: { up: 'civil liberties strengthen', down: 'civil liberties are squeezed', good: true },
  environment: { up: 'the environment recovers', down: 'environmental health declines', good: true },
  economy: { up: 'the economy grows', down: 'the economy contracts', good: true },
  resilience: { up: 'the society hardens against shocks', down: 'resilience thins out', good: true },
  legitimacy: { up: 'the government gains legitimacy', down: 'legitimacy drains away', good: true },
}

// Minimum movement (in display units) for a metric to count as "moving" this
// year — below this it's just noise. Economy is a % growth; the rest are points.
const THRESHOLD = { economy: 0.8, gini: 0.5, _default: 0.6 }

// Year-over-year movement of a metric in human-facing units.
function move(cur, prev, key) {
  if (key === 'gini') return (cur.gini - prev.gini) * 100 // Gini points
  if (key === 'economy') return (cur.economy / prev.economy - 1) * 100 // % growth
  return cur[key] - prev[key]
}

function phraseFor(key, d) {
  const p = PHRASES[key]
  return d > 0 ? p.up : p.down
}

// A short standing-state clause when a level is alarming or excellent, so the
// narration carries some absolute context, not just deltas.
function moodClause(cur) {
  if (cur.trust < 25) return 'faith in the system is collapsing'
  if (cur.legitimacy < 25) return 'the government is barely seen as legitimate'
  if (cur.environment < 25) return 'the land itself is in crisis'
  if (cur.wellbeing < 25) return 'daily life has grown hard for many'
  if (cur.trust > 80 && cur.wellbeing > 75) return 'the mood across the island is buoyant'
  return null
}

// The narration for `year` (0..N). Returns one plain sentence.
export function narrateYear(result, year) {
  const { series } = result
  const last = series.length - 1
  if (year <= 0) {
    return 'AILandia is founded. The dials are locked in and the thirty-year clock starts ticking.'
  }
  const cur = series[Math.min(year, last)]
  const prev = series[Math.min(year, last) - 1]

  const keys = ['wellbeing', 'trust', 'gini', 'liberties', 'environment', 'economy', 'resilience', 'legitimacy']
  const movers = keys
    .map((k) => ({ k, d: move(cur, prev, k) }))
    .filter((m) => Math.abs(m.d) >= (THRESHOLD[m.k] ?? THRESHOLD._default))
    .sort((a, b) => Math.abs(b.d) - Math.abs(a.d))

  const mood = moodClause(cur)

  if (movers.length === 0) {
    const calm = mood
      ? `A still year — the metrics barely move, but ${mood}.`
      : 'A still year — the metrics barely move and the island holds its breath.'
    return calm
  }

  const top = movers[0]
  let sentence = capitalize(phraseFor(top.k, top.d))

  // Add a second mover when it pulls the OTHER way (a real tradeoff on screen)
  // or is nearly as large, to make the year read as a tension, not a headline.
  const second = movers[1]
  if (second) {
    const topGood = isGoodMove(top)
    const secondGood = isGoodMove(second)
    const contrast = topGood !== secondGood
    if (contrast || Math.abs(second.d) >= Math.abs(top.d) * 0.6) {
      sentence += `${contrast ? ' — but ' : ', while '}${phraseFor(second.k, second.d)}`
    }
  }

  if (mood) sentence += `; ${mood}`
  if (year >= last) sentence += '. The thirty years are done — the verdict is in'
  return sentence + '.'
}

function isGoodMove(m) {
  const up = m.d > 0
  return PHRASES[m.k].good ? up : !up
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
