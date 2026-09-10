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

## Sharing and discovery

Both pages carry a full set of Open Graph and Twitter card tags, a canonical link,
and JSON-LD (`VideoGame` on the game, `CollectionPage` on the playbook), so a pasted
link renders as a large card on LinkedIn, X, Slack, Discord, iMessage and WhatsApp
rather than as a bare URL. `robots.txt` and `sitemap.xml` sit at the root.

Social crawlers do not reliably resolve relative image URLs, so `og:image`, `og:url`
and the canonical links are absolute and hardcoded to
`https://geekyme.github.io/ai-tower-defense/`. **If the site moves to another domain,
search and replace that origin** in `index.html`, `lessons.html`, `robots.txt` and
`sitemap.xml`.

The preview images are `assets/og-game.png` and `assets/og-playbook.png`, both
1200x630. Their source is `scripts/og-card.html`, a plain HTML file with no
dependencies: open it in a browser and screenshot each card, or render both cards and
the PNG touch icons at once with

```bash
npm i -g playwright && npx playwright install chromium
node scripts/render-og.mjs
```

That script is the only thing in the repo that wants a dependency, it is optional, and
nothing the site serves needs it. Re-run it when the card art or the favicon changes,
and commit the PNGs.

## Responsive layouts

The board is a fixed 9x14 portrait grid, so its size is almost always limited by
height, not width. `#app` is a single CSS grid whose children never move in the DOM —
only which grid area they land in — so the three layouts are pure CSS:

| Viewport | Layout | Board on a phone/laptop |
| --- | --- | --- |
| Narrow portrait | HUD on top, board, shop below | 378x588 at 390x844 |
| Portrait ≥ 620px | Same, wider column | 540x840 on an iPad |
| ≥ 900px wide, or landscape under 620px tall | HUD and shop in a side rail, board takes the full height | 567x882 at 1440x900 |

Everything that floats over the board lives in one bottom dock, stacked in a column, so
the build sheets and the call-wave row can never cover each other. Where there is room
the dock leaves the board alone entirely: on a phone it spends the letterboxing under
the board, on a rail layout it moves into the empty column below the shop, and in short
landscape the board shifts left and the dock sits beside it — a sheet across a 243px
board hides the whole game.

`layout()` in `core/view.js` publishes the measured board size as `--board-w` and
`--board-h` on the stage, which is what keeps the floating sheets and the call-wave row
pinned to the board rather than stretching across a much wider stage on desktop.

## Testing

```bash
node scripts/smoke.mjs 25
```

Runs the whole 25-wave campaign headlessly: it stubs the DOM, plays the simulation at a
fixed timestep with a scripted build order, draws every frame through a stub 2D context,
renders all 37 threat artworks, and asserts that waves advance and lessons unlock one per
wave in order. It catches the things that break when the data files are edited. Takes
about five seconds and runs in CI before every deploy.

## Project structure

```
index.html            the game
lessons.html          the playbook, unlocked wave by wave
site.webmanifest      name, icons and colours for install-to-home-screen
robots.txt            crawl policy, points at the sitemap
sitemap.xml           the two pages
assets/
  favicon.svg         the shield mark
  icon-180.png        apple-touch-icon, rendered from the favicon
  icon-512.png        manifest icon, rendered from the favicon
  og-game.png         1200x630 social card for the game
  og-playbook.png     1200x630 social card for the playbook
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
    music.js          the soundtrack: a step sequencer, also without files
    bus.js            engine → UI events, so the engine imports no UI
  engine/             the simulation: spawn, damage, powers, foes, towers, waves
  render/             canvas drawing: shapes, board, entities, fx, scene
  ui/                 DOM: hud, shop, panels, screens, input, share card
  main.js             wiring and the game loop
scripts/
  smoke.mjs           headless campaign test
  og-card.html        source art for the two social cards
  render-og.mjs       renders the cards and the PNG icons (optional, dev only)
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

## Sound

Neither the effects nor the soundtrack load a file. `core/audio.js` is one oscillator
per blip with a decaying gain envelope; `core/music.js` is a sixteenth-note sequencer
that schedules pad, bass, arpeggio and drum voices a fraction of a second ahead of the
audio clock, over four bars in A minor. It has two moods and the run's own events switch
them: `calm` for menus, briefings and the build phase, `combat` while a wave is running.
Both share one AudioContext, created on the first tap because browsers keep a page
silent until then, and both have their own toggle in the HUD (`♪` effects, `♫` music).
A backgrounded tab stops the loop rather than playing to nobody.

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

## Credits

Made by a fellow head of AI — [linkedin.com/in/geekyme](https://www.linkedin.com/in/geekyme/).

The byline lives in [`src/ui/credit.js`](src/ui/credit.js); the menu, the victory screen
and the playbook footer all render from it.

## Saved progress

One localStorage key, `head-of-ai-defence:v1`: unlocked lessons, best wave, lifetime
totals, the last 40 runs, and the sound and music preferences. It never leaves the browser, and
**Clear progress** at the bottom of the playbook wipes it. If storage is blocked, the
game still runs — it just forgets everything when you close the tab.
