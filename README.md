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

Burning out costs you the wave rather than the run: every briefing leaves a checkpoint
behind, so a defeat offers the same wave again with the board and the focus you started
it with, and your sanity back.

Past wave 25 it keeps going for as long as you can hold it. Endless waves are improvised
from the campaign's threat pool with a boss every third one, and threat health keeps
climbing — gently enough that how far you get is a question about your board rather than
a wall a few waves after the campaign ends.

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
the sheets and the call-wave row can never cover each other. Where there is room the dock
leaves the board alone entirely: on a phone it spends the letterboxing under the board, on
a rail layout it moves into the empty column below the shop, and in short landscape the
board shifts left and the dock sits beside it — a sheet across a 243px board hides the
whole game.

Choosing a defence puts nothing over the board at all. The card lights up, every plot you
could build on lights up with it, and that is the whole interface: the lower rows stay
reachable. What a defence is *for* is a sheet you ask for — tap the card you already have
selected — and any tap outside closes it again.

The shop is the one part of the layout that sits outside the board, so an overlay cannot
cover it. While a screen is up, or a wave is being celebrated, `#app.screen` recedes it
and takes it out of play: otherwise it stays lit under every menu and briefing, and a
defence picked from behind one leaves its sheet on the board afterwards.

`layout()` in `core/view.js` publishes the measured board size as `--board-w` and
`--board-h` on the stage, which is what keeps the floating sheets and the call-wave row
pinned to the board rather than stretching across a much wider stage on desktop.

## Deploying a change safely

The site ships as raw ES modules, which browsers *link* rather than merely fetch. If a
visitor still holds one file from the previous deploy while another arrives fresh, an
import that no longer matches takes down the whole graph — not one broken feature, a
black page. Safari is especially willing to keep serving a module it already has,
reload or no reload. Three things guard against that, and against ordinary bugs at
start-up:

- **Versioned module URLs.** `scripts/stamp-modules.mjs` rewrites every relative import
  and both `<script type="module">` tags to carry `?v=<commit sha>`. The Pages workflow
  runs it on the copy it publishes, so a deploy's modules can only be fetched as a set.
  The repo itself is never stamped: local development stays a plain static server.
- **A boot check.** `main.js` stamps `data-booted` on the document. If that is missing by
  `DOMContentLoaded` — module scripts are deferred, so by then it has either run or
  failed — the page reloads once, and a second failure shows the error rather than
  looping.
- **Start-up steps that fail alone.** Each step in `main.js` runs inside `boot()`, so
  one that throws is reported in the panel and the next still runs; the soundtrack is
  loaded with a dynamic `import()` and talks over the bus, so it is not in the game's
  module graph at all and cannot stop the board from appearing.

## Testing

```bash
node scripts/smoke.mjs 25
```

Runs the whole 25-wave campaign headlessly: it stubs the DOM, plays the simulation at a
fixed timestep with a scripted build order, draws every frame through a stub 2D context,
renders all 37 threat artworks, and asserts that waves advance, that lessons unlock one
per wave in order, and that retrying a wave hands back exactly the board and the focus it
started with. Ask it for more waves than the campaign has — `node scripts/smoke.mjs 34` —
and it plays on into the endless ones, which is how the generated waves stay tested. It catches the things that break when the data files are edited. Takes
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
    checkpoint.js     the start of the current wave, for retrying after a defeat
  render/             canvas drawing: shapes, board, entities, fx, scene
  ui/                 DOM: hud, shop, panels, screens, input, toast, share card
  main.js             wiring and the game loop
scripts/
  smoke.mjs           headless campaign test
  stamp-modules.mjs   versions module URLs at deploy time (CI only)
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

## Sharing a run

Both end screens offer **Share this run** and **Save the card**. The card is a 1080x1350
PNG drawn on a canvas at the moment you ask for it, and it carries the wave you reached,
the tally, the defences left standing, the lessons unlocked and the site's own address.

Sharing hands that PNG to the native share sheet along with a message that is already
written — how far the run got, what it cost, and a link back to the game. Where files
cannot be shared it sends the message and the link alone; where there is no share sheet
at all it saves the card and puts the message on the clipboard, and says so.

The link comes from the page's own `<link rel="canonical">`, so it is right wherever the
site is served from and there is no second copy of the URL to keep in step. One detail
worth keeping: the card is built with the synchronous `toDataURL` rather than `toBlob`,
because Safari drops the user gesture across an `await` and then refuses to open the
share sheet.

## Sound

Neither the effects nor the soundtrack load a file. `core/audio.js` is one oscillator per
blip with a decaying gain envelope. `core/music.js` is a sixteenth-note sequencer that
schedules its voices a fraction of a second ahead of the audio clock, over four bars of
ii–V–I–vi in C voiced as rootless sevenths.

It is lo-fi mostly by subtraction: the whole mix runs through one lowpass at 2.1kHz so
nothing is bright, the off sixteenths land late so nothing sits on the grid, and vinyl
crackle runs underneath it all. Two moods, switched by the run's own events — `calm` is
keys, bass and crackle for menus, briefings and the build phase; `combat` brings in a
soft kick, a brushed snare and hats while a wave runs. Measured at the destination it
sits around −37 dBFS between waves and −30 during one, with 85–90% of its energy below
2kHz.

Both share one AudioContext, created on the first tap because browsers keep a page silent
until then, and one `♪` in the HUD switches both. A backgrounded tab stops the loop rather
than playing to nobody.

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
totals, the last 40 runs, and the sound preference. It never leaves the browser, and
**Clear progress** at the bottom of the playbook wipes it. If storage is blocked, the
game still runs — it just forgets everything when you close the tab.
