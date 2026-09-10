# Head of AI: defence

A tower defence game about running AI inside a company. Twenty five waves across five
eras — experimentation, scaling, governance, production, institutionalised — then an
endless mode that never stops.

Every threat is a real failure mode (hallucinations, shadow AI, vendor lock-in, the
frozen middle, an EU AI Act audit, a reorg) and every defence is a real control (evals,
guardrails, observability, a model router, a governance council, a kill switch). Each
defence is the *only* answer to something, so the game is really a quiz about which
control you skipped.

**Clearing a wave permanently unlocks that wave's lesson** in [the playbook](lessons.html).
Twenty five waves, twenty five lessons, and the full list once you finish the campaign.

No build step, no dependencies, no server — static files and ES modules.

## Running it locally

ES modules need a real origin, so `file://` will not work. Any static server does:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Deploying to GitHub Pages

The repo *is* the site, so there is nothing to build.

1. Push to `main`.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.

`.github/workflows/pages.yml` runs the smoke test and publishes the repo root on every
push to `main`. Every path in the HTML is relative, so it works at a project URL like
`https://<user>.github.io/<repo>/` as well as at a domain root. If you would rather not
use Actions, setting Pages to *Deploy from a branch → main → / (root)* also works —
`.nojekyll` is already there so Jekyll leaves the files alone.

## Testing

```bash
node scripts/smoke.mjs 25
```

Runs the whole 25-wave campaign headlessly: it stubs the DOM, plays the simulation at a
fixed timestep with a scripted build order, draws every frame through a stub 2D context,
renders all 37 threat artworks, and asserts that waves advance and lessons unlock one per
wave in order. It catches the things that break when the data files are edited. Takes
about five seconds and runs in CI before every deploy.

## Layout

```
index.html            the game
lessons.html          the playbook, unlocked wave by wave
styles/
  tokens.css          colours, reset, and the components both pages share
  game.css            board, HUD, shop, overlays
  lessons.css         the playbook page
src/
  data/               pure content — no engine or DOM
    towers.js         the six defences, their stats and shop copy
    threats.js        all 37 threats as flags the engine reads generically
    waves.js          eras, the 25-wave campaign, endless wave generation
    lessons.js        one lesson per wave
  core/
    config.js         board geometry and every tunable constant
    state.js          the run state `S`, a live binding
    view.js           canvas sizing, the lane in pixels, resize handling
    storage.js        everything that survives a reload, in one localStorage key
    audio.js          the oscillator blip synth
    bus.js            engine → UI events, so the engine imports no UI
  engine/             the simulation: spawn, damage, powers, foes, towers, waves
  render/             canvas drawing: shapes, board, entities, fx, scene
  ui/                 DOM: hud, shop, panels, screens, input, share card
  main.js             wiring and the game loop
scripts/smoke.mjs     headless campaign test
```

Three rules keep it navigable:

- **Data files hold no logic.** A new threat is a new entry in `threats.js` with the
  flags the engine already understands; you should not have to touch `engine/`.
- **The engine never imports the UI.** It emits on `core/bus.js`
  (`wave:cleared`, `run:brief`, `run:won`, `run:lost`, `tower:removed`) and
  `ui/screens.js` listens.
- **Shared state is a live binding.** `S` from `core/state.js` and `cell`/`W`/`H` from
  `core/view.js` are `export let`, so modules read the current value. Read them, never
  reassign them from outside their own module.

## Adding content

**A new threat** — add an entry to `src/data/threats.js`, add its artwork to `SHAPE` in
`src/render/shapes.js` (keyed by its `shape` field), and put it in a wave in
`src/data/waves.js`. The briefing tags in `ui/screens.js` pick up its flags on their own.

**A new lesson** — `src/data/lessons.js` holds exactly one entry per campaign wave, in
order. Adding a wave means adding a lesson; the module warns in the console if the two
files drift apart.

**A new defence** — add it to `src/data/towers.js` and `TOWER_NOTES` in the same file, a
glyph to `src/ui/glyphs.js`, and a chassis branch to `drawTower` in
`src/render/entities.js`. Novel firing behaviour goes in `stepTowers`.

## Saved progress

One localStorage key, `head-of-ai-defence:v1`: unlocked lessons, best wave, lifetime
totals, the last 40 runs, and the sound preference. It never leaves the browser, and
**Clear progress** at the bottom of the playbook wipes it. If storage is blocked, the
game still runs — it just forgets everything when you close the tab.
