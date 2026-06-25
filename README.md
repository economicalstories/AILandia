# 🏝️ AILandia — Simulate an AI-First Society

An interactive, single-page simulation of a fictional AI-governed nation.
The page is built around one workflow: **don't guess the constitution — test
scenarios, watch each play out, and let the evidence pick your final
parameters.**

1. **Pick a starting point** — one of four founding philosophies, or a blank slate.
2. **Tune the founding dials** across four design domains — *then* hit the launch
   button below them.
3. **Live through 30 years** — the run plays out one year at a time (~30s): a
   ticking year clock, charts that draw across the timeline, breaking-news
   banners as shocks land, and a verdict that stays curtained until year 30.
   Pause, scrub, change speed (1×/2×/4×), or skip straight to the reckoning.
4. **Compare & adopt** — save contrasting runs to the comparison bench, weigh
   their tradeoffs side by side, and lock one in as AILandia's founding charter.

> **AILandia is a thinking tool, not a forecast.** Its numbers encode
> plausible-but-arguable social-science intuitions, chosen so that *tradeoffs
> become visible* — not so they are correct. Treat every output as "given
> these assumptions, what tensions appear?", never as a prediction.

The whole thing is built around one lesson: **no configuration wins on
everything.** Every lever that helps one metric is wired to cost another.

---

## Quick start

```bash
npm install
npm run dev      # local dev server (Vite) — open the printed http://localhost URL
```

Other scripts:

```bash
npm run build    # production build into ./dist
npm run preview  # serve the production build locally
npm run test:sim # run the four presets headlessly and print a comparison
```

---

## What you can set (the four domains)

1. **Governance** — AI autonomy (advisory → full), centralized ↔ distributed,
   transparency (opaque ↔ auditable), and citizen participation (none /
   periodic vote / liquid democracy / sortition).
2. **Services** — personalization, coverage (means-tested ↔ universal),
   human-in-the-loop, and data sharing (siloed ↔ integrated).
3. **Fairness, rights & bias** — audit frequency, right to human review /
   contestability, bias-correction aggressiveness, and privacy strength.
4. **Environment & future generations** — time horizon (short ↔ long),
   representation for the unborn (none / advisory / guardian-with-veto), and a
   resource-extraction cap.

Every control has a tooltip (the **ⓘ**) explaining the tradeoff it governs.

## What you get back

- **Live charts** for eight society-level metrics over 30 years: Wellbeing,
  Inequality (Gini), Public Trust, Civil Liberties, Environmental Health,
  Economic Output, Resilience, and Legitimacy. Shock years are marked.
- A **scrolling event log** narrating each notable year (bias incidents,
  pandemics, crashes, AI-system failures, climate disasters, disinformation
  waves).
- A 30-year **Society Report Card**: a letter grade per domain, the single
  biggest tradeoff the settings made, how it weathered shocks, and a verdict.
- A 10-year **Evaluation Crew** review in a fixed marking format (Quality of
  life / Fairness / Resilience to crisis, each rated /10).

Four **presets** to start from: *Technocratic Efficiency*, *Participatory
Guardrails*, *Laissez-faire*, and *Long-termist Stewardship*.

---

## The model (and its simplifications)

The simulation lives in `src/sim/`, kept separate from the UI:

| File | Role |
|------|------|
| `rng.js` | Seedable, deterministic PRNG (mulberry32 + xmur3). |
| `constants.js` | **All tunable constants and documented assumptions.** Start here. |
| `settings.js` | The four-domain settings schema (drives UI and model). |
| `model.js` | The stepped, year-by-year simulation engine. |
| `presets.js` | The four founding philosophies. |
| `evaluate.js` | Turns a run into the Report Card and Crew Evaluation. |

### How a year is simulated

A population of citizen-agents (each with a social group and a compounding
income) lives through 30 yearly steps. Each year the model, in order:

1. Gates real output by **compliance** (low trust/legitimacy → disengagement).
2. Grows the **economy** (efficiency levers add growth; coverage, caps,
   privacy, deliberation and long-termism subtract it).
3. Evolves **agent incomes** — disadvantaged groups grow slower unless
   redistribution lifts them; absent redistribution, returns concentrate.
   **Inequality (Gini)** is measured from the resulting distribution.
4. Rolls for **bias incidents** (more likely with heavy automation + data
   sharing, less likely with audits, correction and human review). Incidents
   hit a disadvantaged group and dent trust — harder when the state is opaque.
5. Updates the **environment** and banks **environmental debt** when extraction
   exceeds the sustainable rate.
6. Moves **legitimacy, liberties, trust, resilience and wellbeing** toward
   targets derived from the settings and the current state.
7. Applies any **seeded shock** for the year, with damage scaled by resilience,
   brittleness, and (for climate) accumulated debt.

### Feedback loops it tries to capture

- **Trust death-spiral**: opacity + bias incidents erode trust → lower
  compliance → worse output → less trust. Trust falls faster than it recovers.
- **Brittleness**: over-automation and over-centralization boost efficiency but
  amplify shock damage and starve resilience.
- **Legitimacy buffer**: participation + transparency build legitimacy and
  resilience that absorb shocks (sortition resists disinformation; liquid
  democracy is powerful but more manipulable).
- **Deferred environmental cost**: ignoring the future looks cheap for years,
  then a climate shock collects the banked debt all at once.
- **Goodhart**: pushing bias-correction past a threshold keeps "fixing" the
  metric while degrading overall service accuracy and output.

### Honest limitations

- Effect sizes are hand-tuned for *legibility*, not estimated from data.
- Agents are deliberately simple (group + income); there is no migration,
  no markets, no politics-as-bargaining, no spatial structure.
- "Groups" are an abstraction for measuring fairness, not real demographics.
- Shocks are independent draws; real crises cluster and interact.
- Determinism is a feature for teaching, not a claim about real predictability.

Treat AILandia as a structured way to *argue about tradeoffs*, then go read the
constants and disagree with them.

---

## Deploying to Cloudflare Pages

This is a fully static build (no backend — the simulation runs in the browser),
so it drops straight onto Cloudflare Pages.

**Option A — Git integration (recommended).** In the Cloudflare dashboard:
*Workers & Pages → Create → Pages → Connect to Git*, pick this repo, then set:

- **Framework preset:** Vite
- **Build command:** `npm run build`
- **Build output directory:** `dist`

Every push to the branch builds and deploys automatically.

**Option B — Direct upload with Wrangler.**

```bash
npm run build
npx wrangler pages deploy        # uses pages_build_output_dir from wrangler.toml
# or explicitly:
npx wrangler pages deploy dist --project-name ailandia
```

The included `public/_redirects` (`/* /index.html 200`) keeps the SPA served
from the root on any path.

---

*Built as a workshop thinking-tool for reasoning about how AI governance
choices trade off against each other.*
