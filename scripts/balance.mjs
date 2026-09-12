/**
 * Headless balance probe: how a wave actually plays, rather than whether it
 * runs. `smoke.mjs` hands itself focus and sanity every briefing so every
 * wave's data gets exercised; this one plays the real economy, so its numbers
 * mean something and a tuning change shows up in them.
 *
 *   node scripts/balance.mjs [waves] [handicap]
 *
 * It prints one row per cleared wave: how long the wave took, what it cost in
 * sanity, the focus banked either side of it, and the board that held it.
 *
 * The bot is not a good player. It builds to a fixed shopping list, puts every
 * defence on the plot nearest the lane and furthest from what it already owns,
 * and levels the cheapest thing it can afford — no retargeting, no selling, no
 * reading the briefing. `handicap` is extra focus per wave, and it stands in
 * for the skill it does not have: at 0 it plays like somebody's first run, and
 * at 300 like somebody who knows the campaign. Read the rows as a shape rather
 * than a verdict — where the sanity goes, whether focus has anywhere to go,
 * and whether a wave is fifteen seconds or ninety.
 */

/* ----------------------------------------------------------- DOM stubs */

const noop = () => {};
const ctx2d = new Proxy({}, {
  get(_, prop) {
    if (prop === 'canvas') return { width: 0, height: 0 };
    return (...args) => {
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient') {
        return { addColorStop: noop };
      }
      if (prop === 'measureText') return { width: (String(args[0] || '')).length * 6 };
      return undefined;
    };
  },
  set() { return true; },
});

const store = new Map();
globalThis.localStorage = {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k),
};
globalThis.window = { addEventListener: noop, devicePixelRatio: 1, AudioContext: null };
globalThis.document = {
  createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d, toDataURL: () => '' }),
};
globalThis.performance = globalThis.performance || { now: () => Date.now() };

/* ------------------------------------------------------------- harness */

const { initView } = await import('../src/core/view.js');
const { S } = await import('../src/core/state.js');
const { on } = await import('../src/core/bus.js');
const { TOWERS } = await import('../src/data/towers.js');
const { CAMPAIGN_WAVES } = await import('../src/data/waves.js');
const { COLS, ROWS, pathKeys, START_FOCUS, BANK_RATE } = await import('../src/core/config.js');
const { stepFoes } = await import('../src/engine/foes.js');
const { stepTowers, stepShots, placeTower, canBuild, upgradeTower } =
  await import('../src/engine/towers.js');
const { stepWave, nextBrief, beginBuildPhase, startWave } = await import('../src/engine/waves.js');

const canvas = { style: {}, width: 0, height: 0, getContext: () => ctx2d };
const stage = {
  style: { setProperty: noop },
  getBoundingClientRect: () => ({ width: 380, height: 620 }),
};
initView(canvas, stage, noop);

const lane = [...pathKeys].map(k => k.split(',').map(Number));

/** Every buildable cell, with how far it sits from the lane. */
function plots() {
  const out = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!canBuild(c, r)) continue;
      out.push({ c, r, d: Math.min(...lane.map(([lc, lr]) => Math.hypot(lc - c, lr - r))) });
    }
  }
  return out.sort((a, b) => a.d - b.d);
}

/** Near the lane, and away from what is already built, so coverage spreads. */
function bestSpot() {
  let best = null, score = -Infinity;
  for (const p of plots()) {
    if (p.d > 1.5) continue; // anything further covers nothing
    const near = S.towers.length
      ? Math.min(...S.towers.map(t => Math.hypot(t.c - p.c, t.r - p.r)))
      : 9;
    const s = Math.min(near, 4) * 2 - p.d;
    if (s > score) { score = s; best = p; }
  }
  return best;
}

/** The board the bot is aiming at by wave `w`. */
function shoppingList(w) {
  return [
    ['evalsuite', Math.min(6, 3 + Math.floor(w / 3))],
    ['observ', w >= 3 ? Math.min(5, 1 + Math.floor(w / 5)) : 0],
    ['router', w >= 6 ? Math.min(5, 1 + Math.floor((w - 6) / 4)) : 0],
    ['guardrail', w >= 4 ? Math.min(3, 1 + Math.floor(w / 10)) : 0],
    ['council', w >= 8 ? Math.min(5, 1 + Math.floor((w - 8) / 4)) : 0],
    ['killswitch', w >= 13 ? Math.min(4, 1 + Math.floor((w - 13) / 5)) : 0],
  ];
}

const owned = key => S.towers.filter(t => t.key === key).length;

const MAX_TOWERS = 34;

function spend(w) {
  for (let again = true; again;) {
    again = false;
    for (const [key, want] of shoppingList(w)) {
      if (owned(key) >= want || S.focus < TOWERS[key].cost) continue;
      const spot = bestSpot();
      if (spot && placeTower(key, spot.c, spot.r)) again = true;
    }
  }
  // Only once the list is met does spare focus go into levels, and then into
  // widening the board — a plot the bot cannot afford to level is still a plot.
  if (!shoppingList(w).every(([k, n]) => owned(k) >= n)) return;
  for (let again = true; again;) {
    again = false;
    const up = S.towers.filter(t => t.lv < 3);
    for (const t of up) if (upgradeTower(t)) { again = true; break; }
    if (S.towers.length < MAX_TOWERS) {
      const key = w >= 13 ? 'killswitch' : w >= 8 ? 'council' : w >= 6 ? 'router' : 'evalsuite';
      const spot = bestSpot();
      if (spot && S.focus >= TOWERS[key].cost && placeTower(key, spot.c, spot.r)) again = true;
    }
  }
}

/* ---------------------------------------------------------------- play */

const target = Number(process.argv[2] || CAMPAIGN_WAVES);
const HANDICAP = Number(process.argv[3] || 0);
const DT = 1 / 60;
const MAX_FRAMES = 60 * 60 * 60;

const rows = [];
let frames = 0, finished = false, lostAt = 0, peakFoes = 0;
let sanityBefore = 0, focusBefore = START_FOCUS, waveStart = 0;

on('run:lost', () => { lostAt = S.wave; finished = true; });
on('run:won', () => { if (target > CAMPAIGN_WAVES) nextBrief(); else finished = true; });
on('run:brief', () => {
  beginBuildPhase();
  S.focus += HANDICAP;
  spend(S.wave);
  S.focus += Math.round(Math.max(0, S.buildT) * BANK_RATE); // calls the wave early
  sanityBefore = S.sanity;
  focusBefore = S.focus;
  waveStart = frames;
  startWave();
});
on('wave:cleared', () => rows.push({
  w: S.wave,
  secs: (frames - waveStart) / 60,
  sanity: S.sanity,
  cost: sanityBefore - S.sanity,
  focusIn: Math.round(focusBefore),
  focusOut: Math.round(S.focus),
  towers: S.towers.length,
  lv: S.towers.reduce((a, t) => a + t.lv, 0) / (S.towers.length || 1),
}));

nextBrief();
while (!finished && S.wave <= target && frames < MAX_FRAMES) {
  frames++;
  stepFoes(DT);
  stepTowers(DT);
  stepShots(DT);
  if (S.phase === 'wave') {
    stepWave(DT);
    if (S.foes.length > peakFoes) peakFoes = S.foes.length;
    if (frames % 90 === 0) spend(S.wave); // players keep building mid-wave
  }
}

/* -------------------------------------------------------------- report */

const cols = ['wave', 'secs', 'sanity', 'cost', 'focus in', 'focus out', 'plots', 'avg lv'];
console.log(cols.map((c, i) => c.padStart(i ? 9 : 4)).join(''));
for (const r of rows) {
  console.log(
    String(r.w).padStart(4) +
    r.secs.toFixed(1).padStart(9) +
    String(r.sanity).padStart(9) +
    String(r.cost).padStart(9) +
    String(r.focusIn).padStart(9) +
    String(r.focusOut).padStart(9) +
    String(r.towers).padStart(9) +
    r.lv.toFixed(2).padStart(9));
}
console.log(lostAt ? '\nlost on wave ' + lostAt : '\nheld to wave ' + S.best);
console.log('threats handled    ', S.killed, '| leaked', S.leaked, '| defences lost', S.lost);
console.log('most on the board  ', peakFoes, 'at once');
console.log('played             ', (frames / 60).toFixed(0) + 's with a handicap of', HANDICAP);
