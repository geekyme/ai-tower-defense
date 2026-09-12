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
const { THREATS } = await import('../src/data/threats.js');
const { CAMPAIGN_WAVES, waveRoster } = await import('../src/data/waves.js');
const { COLS, ROWS, pathKeys, START_FOCUS, BANK_RATE } = await import('../src/core/config.js');
const { stepFoes } = await import('../src/engine/foes.js');
const view = await import('../src/core/view.js');
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

/**
 * The board the bot is aiming at by wave `w`.
 *
 * The default list is a generic mix that ignores the briefing — a board that
 * looks sensible and answers nothing in particular, which is the baseline a
 * difficulty change has to be read against.
 */
function genericList(w) {
  return [
    ['evalsuite', Math.min(6, 3 + Math.floor(w / 3))],
    ['observ', w >= 3 ? Math.min(5, 1 + Math.floor(w / 5)) : 0],
    ['router', w >= 6 ? Math.min(5, 1 + Math.floor((w - 6) / 4)) : 0],
    ['guardrail', w >= 4 ? Math.min(3, 1 + Math.floor(w / 10)) : 0],
    ['council', w >= 8 ? Math.min(5, 1 + Math.floor((w - 8) / 4)) : 0],
    ['killswitch', w >= 13 ? Math.min(4, 1 + Math.floor((w - 13) / 5)) : 0],
  ];
}

/**
 * The same board size, spent on what the next wave is actually made of.
 *
 * Every defence is the only answer to something, so this reads the roster the
 * briefing shows and weights its purchases against the flags: armour wants the
 * council, splash- and chain-immunity and the eval gap want single target,
 * anything cloaked wants observability, and a crowd wants the router. It buys
 * the same number of plots as the generic list so the comparison is about the
 * mix and nothing else.
 *
 * It is still a crude player — it never sells, never repositions, never reacts
 * mid-wave and never reads where the lane doubles back — so the gap between
 * the two lists is a floor on what reading the briefing is worth, not a
 * ceiling on what playing well is worth.
 */
function counterList(w) {
  const { direct, later } = waveRoster(w);
  const roster = [...direct, ...later].map(k => THREATS[k]);
  const some = fn => roster.some(fn);
  const count = fn => roster.filter(fn).length;

  const weights = {
    // Cheap single target, and the only thing an eval gap or a silent
    // regression respects.
    evalsuite: 3 + count(D => D.noAoE || D.onlyEval) * 3 + (some(D => D.fam === 'hallu') ? 2 : 0),
    // Armour is subtracted before damage for everything except this.
    council: w < 6 ? 0 : 2 + count(D => (D.armor || 0) >= 10 || D.boss) * 2,
    // Nothing else can target something cloaked.
    observ: 1 + (some(D => D.cloak) ? 4 : 0),
    // Four arcs from one shot, wasted on anything that travels alone.
    router: some(D => (D.sz || 1) < 0.4 || D.split || D.spawn) ? 3 : 0,
    // Multiplies everything near it, unless the wave ignores slows.
    guardrail: some(D => D.slowProof) ? 1 : 2,
    killswitch: w < 12 ? 0 : 2,
  };

  // Same plot count as the generic board, distributed by need instead.
  const total = genericList(w).reduce((a, [, n]) => a + n, 0);
  const sum = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(weights).map(([k, v]) => [k, Math.round(total * v / sum)]);
}

const SMART = process.argv.includes('smart');
const shoppingList = w => (SMART ? counterList(w) : genericList(w));

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
      const key = SMART
        ? shoppingList(w).reduce((a, b) => (owned(a[0]) / (a[1] || 1) <= owned(b[0]) / (b[1] || 1) ? a : b))[0]
        : w >= 13 ? 'killswitch' : w >= 8 ? 'council' : w >= 6 ? 'router' : 'evalsuite';
      const spot = bestSpot();
      if (spot && S.focus >= TOWERS[key].cost && placeTower(key, spot.c, spot.r)) again = true;
    }
  }
}

/**
 * How far down the lane a threat got before it died, as a fraction.
 *
 * The most useful number here, and the one a wave's size hides completely. A
 * wave of eighty that evaporates at 6% of the lane is decoration; the same
 * wave dying at half way is a wave the board is working for. Watch this rather
 * than the count when tuning.
 */
let depthSum = 0, depthN = 0, deepest = 0;

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
  depthSum = 0;
  depthN = 0;
  deepest = 0;
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
  depth: depthN ? depthSum / depthN : 0,
  deepest,
}));

nextBrief();
while (!finished && S.wave <= target && frames < MAX_FRAMES) {
  frames++;
  const before = S.foes.slice();
  stepFoes(DT);
  if (before.length !== S.foes.length) {
    const still = new Set(S.foes);
    for (const f of before) {
      if (still.has(f)) continue;
      const frac = f.d / view.TOTAL;
      depthSum += frac;
      depthN++;
      if (frac > deepest) deepest = frac;
    }
  }
  stepTowers(DT);
  stepShots(DT);
  if (S.phase === 'wave') {
    stepWave(DT);
    if (S.foes.length > peakFoes) peakFoes = S.foes.length;
    if (frames % 90 === 0) spend(S.wave); // players keep building mid-wave
  }
}

/* -------------------------------------------------------------- report */

const cols = ['wave', 'secs', 'sanity', 'cost', 'focus in', 'focus out', 'plots', 'avg lv',
  'depth', 'deepest'];
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
    r.lv.toFixed(2).padStart(9) +
    (Math.round(r.depth * 100) + '%').padStart(9) +
    (Math.round(r.deepest * 100) + '%').padStart(9));
}
console.log(lostAt ? '\nlost on wave ' + lostAt : '\nheld to wave ' + S.best);
console.log('threats handled    ', S.killed, '| leaked', S.leaked, '| defences lost', S.lost);
console.log('most on the board  ', peakFoes, 'at once');
console.log('played             ', (frames / 60).toFixed(0) + 's with a handicap of', HANDICAP,
  '·', SMART ? 'buying against the briefing' : 'a generic board');
