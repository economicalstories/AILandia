# AILandia

An interactive, agent-based simulation of a tiny AI society — autonomous
agents wander, befriend each other, trade resources, and spread "ideas"
(cultures) across the population in real time. Everything runs in the
browser; there is no backend.

## Live deployment (Cloudflare Pages)

The site is a static app served from the [`dist/`](dist) directory.

`wrangler.toml` sets:

```toml
pages_build_output_dir = "dist"
```

There is **no build step** — the files in `dist/` (`index.html`,
`styles.css`, `sim.js`) are the deployable output. Cloudflare Pages serves
that directory directly.

## Run locally

Just open `dist/index.html` in a browser, or serve the folder:

```sh
npx serve dist
# or
python3 -m http.server --directory dist 8000
```

## How it works

- Each dot is an agent with a personality (openness, generosity), wealth,
  and a favourite idea (its colour).
- When agents meet they may form friendships, trade wealth, and adopt one
  another's ideas — so culture spreads.
- Use the sliders to change population, simulation speed, and sociability;
  click any agent to inspect it.
