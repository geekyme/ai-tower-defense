/**
 * Headless smoke test: runs the simulation without a browser.
 *
 *   node scripts/smoke.mjs [waves]
 *
 * Stubs just enough DOM for `core/view.js` and the engine to load, then plays
 * fixed-step frames with a scripted build order. It asserts that waves
 * advance, lessons unlock one per wave, and nothing throws — which is what
 * usually breaks when the data files are edited.
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

globalThis.window = {
  addEventListener: noop,
  devicePixelRatio: 1,
  AudioContext: null,
};
globalThis.document = {
  createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d, toDataURL: () => '' }),
};
globalThis.performance = globalThis.performance || { now: () => Date.now() };

/* ------------------------------------------------------------- harness */

const { initView } = await import('../src/core/view.js');
const { S } = await import('../src/core/state.js');
const { on } = await import('../src/core/bus.js');
const { THREATS } = await import('../src/data/threats.js');
const { TOWER_KEYS } = await import('../src/data/towers.js');
const { CAMPAIGN_WAVES } = await import('../src/data/waves.js');
const { COLS, ROWS, pathKeys } = await import('../src/core/config.js');
const { progress } = await import('../src/core/storage.js');
const { stepFoes } = await import('../src/engine/foes.js');
const { stepTowers, stepShots, placeTower, canBuild } = await import('../src/engine/towers.js');
const { stepWave, nextBrief, beginBuildPhase, startWave } = await import('../src/engine/waves.js');
const { takeCheckpoint, retryWave, clearCheckpoint } = await import('../src/engine/checkpoint.js');
const { START_FOCUS } = await import('../src/core/config.js');
const { render } = await import('../src/render/scene.js');
const { paintBackground } = await import('../src/render/board.js');
const { threatThumbnail } = await import('../src/render/shapes.js');

const canvas = { style: {}, width: 0, height: 0, getContext: () => ctx2d };
const stage = {
  style: { setProperty: noop },
  getBoundingClientRect: () => ({ width: 380, height: 620 }),
};
initView(canvas, stage, paintBackground);

// Every threat's artwork must at least draw without throwing.
for (const key of Object.keys(THREATS)) threatThumbnail(key, 32);

/*
 * A defeat costs the wave, not the run. Retrying has to hand back exactly the
 * board and the focus the wave started with, before any listeners are wired
 * up so the briefing it asks for goes nowhere.
 */
const early = [];
{
  S.wave = 4;
  S.focus = 500;
  takeCheckpoint();

  const spot = plots()[0];
  placeTower(TOWER_KEYS[0], spot.c, spot.r);
  S.sanity = 0;
  S.killed = 12;

  if (!retryWave()) early.push('a retry after a defeat did not restore anything');
  if (S.wave !== 4) early.push('a retry left the run on wave ' + S.wave + ', not 4');
  if (S.focus !== 500) early.push('a retry left ' + S.focus + ' focus, not the 500 the wave started with');
  if (S.towers.length !== 0) early.push('a retry kept ' + S.towers.length + ' defence(s) built during the failed attempt');
  if (S.sanity !== S.max) early.push('a retry left sanity at ' + S.sanity + ', not ' + S.max);
  if (S.killed !== 0) early.push('a retry kept the failed attempt\'s kill count');
  if (S.retries !== 1) early.push('a retry was not counted');

  // Back to a fresh run by hand: `S` was destructured out of the module above,
  // so it is a copy of the binding and `newRun()` would leave it behind.
  clearCheckpoint();
  S.wave = 0;
  S.phase = 'menu';
  S.focus = START_FOCUS;
  S.retries = 0;
}

const targetWaves = Number(process.argv[2] || 8);
const DT = 1 / 60;
const MAX_FRAMES = 60 * 60 * 40; // 40 simulated minutes, a hard stop on hangs

const unlocks = [];
const failures = [];
let finished = false;

on('wave:cleared', ({ lesson }) => { if (lesson) unlocks.push(lesson.wave); });
on('run:lost', () => { failures.push('sanity hit zero on wave ' + S.wave); finished = true; });
on('run:won', () => { finished = true; });
on('run:brief', () => {
  beginBuildPhase();
  // This is a code-path test, not a balance test: the harness plays with a
  // grant of focus and sanity so every wave's data actually gets exercised.
  S.focus += 2200;
  S.sanity = S.max;
  spendFocus();
  startWave();
});

/** Buildable cells, nearest to the lane first — where a player would build. */
function plots() {
  const lane = [...pathKeys].map(k => k.split(',').map(Number));
  const out = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!canBuild(c, r)) continue;
      const d = Math.min(...lane.map(([lc, lr]) => Math.hypot(lc - c, lr - r)));
      out.push({ c, r, d });
    }
  }
  return out.sort((a, b) => a.d - b.d);
}

/** Spends whatever focus is banked on a rotating mix of defences. */
function spendFocus() {
  const CAP = 30;
  for (const { c, r } of plots()) {
    if (S.towers.length >= CAP) return;
    const key = TOWER_KEYS[(S.wave + c + r) % TOWER_KEYS.length];
    if (!placeTower(key, c, r)) return; // out of focus
  }
}

nextBrief();

let frames = 0;
while (!finished && S.wave <= targetWaves && frames < MAX_FRAMES) {
  frames++;
  stepFoes(DT);
  stepTowers(DT);
  stepShots(DT);
  if (S.phase === 'wave') stepWave(DT);
  S.shake = Math.max(0, S.shake - DT * 24);
  render(DT, frames % 120 === 0 ? { c: 3, r: 3 } : null);
  // The harness never idles in the build phase; run:brief starts the wave.
}

/* --------------------------------------------------------------- report */

const reached = S.best;
const expected = Array.from({ length: reached }, (_, i) => i + 1);
const problems = [...early];

if (frames >= MAX_FRAMES) problems.push('simulation did not settle within ' + MAX_FRAMES + ' frames');
if (reached === 0) problems.push('no wave was cleared');
if (String(unlocks) !== String(expected)) {
  problems.push('lessons unlocked ' + JSON.stringify(unlocks) + ', expected ' + JSON.stringify(expected));
}
if (String(progress.unlockedLessons) !== String(expected)) {
  problems.push('stored unlocks ' + JSON.stringify(progress.unlockedLessons) + ' do not match');
}

console.log('waves cleared      ', reached + ' of ' + Math.min(targetWaves, CAMPAIGN_WAVES));
console.log('lessons unlocked   ', unlocks.length);
console.log('threats handled    ', S.killed, '| leaked', S.leaked, '| defences lost', S.lost);
console.log('sanity left        ', S.sanity + '/' + S.max);
console.log('simulated          ', (frames / 60).toFixed(0) + 's of play across', Object.keys(THREATS).length, 'threat types');
if (failures.length) console.log('run ended          ', failures.join('; '));

if (problems.length) {
  console.error('\nFAIL');
  for (const p of problems) console.error(' -', p);
  process.exit(1);
}
console.log('\nOK');
