import { CAMPAIGN_WAVES } from '../data/waves.js';
import { S, runDuration } from '../core/state.js';
import { emit } from '../core/bus.js';
import { savedRun, saveRun } from '../core/storage.js';
import { reviveTower } from './towers.js';

/**
 * The start of the current wave, kept so a defeat costs you the wave rather
 * than the whole run, and so leaving the page does not cost you the run.
 *
 * Taken when the build phase opens, which is before you have spent anything on
 * this wave: retrying hands back the focus, the board and the sanity you had
 * when the wave was still ahead of you.
 *
 * The same snapshot goes to storage, where it outlives the page. Resuming from
 * there is the same rewind, so that walking out and back in is not a way to
 * heal — and neither is losing on purpose.
 */

let saved = null;

/**
 * The floor a retry tops sanity up to, as a fraction of your maximum.
 *
 * A retry used to hand back full sanity, which sounds generous and quietly
 * wasn't: it meant the sanity carried between waves was never really spent,
 * because any wave could be entered at full health by losing it once first.
 * Every run was played on the hardest reading of the game or the easiest
 * depending on whether the player had noticed, which is not a difficulty
 * setting anybody chose.
 *
 * It hands back what you walked in with instead. The floor is what stops that
 * being a trap: arrive on a wave with three sanity left and no retry can ever
 * clear it, so the run is over without saying so. Half your maximum is enough
 * to have a real go, and not enough to be worth dying for.
 */
const RETRY_FLOOR = 0.5;

/** Sanity a retry of `s` would hand back. */
function retrySanity(s) {
  return Math.min(s.max, Math.max(s.sanity, Math.ceil(s.max * RETRY_FLOOR)));
}

/** What the defeat screen promises, so the copy cannot drift from the rule. */
export function retrySanityValue() {
  return saved ? retrySanity(saved) : 0;
}

function snapshot(wave) {
  return {
    runId: S.runId,
    wave,
    elapsedMs: runDuration(),
    focus: S.focus,
    sanity: S.sanity,
    max: S.max,
    best: S.best,
    killed: S.killed,
    leaked: S.leaked,
    lost: S.lost,
    retries: S.retries,
    towers: S.towers.map(t => ({ key: t.key, c: t.c, r: t.r, lv: t.lv, spent: t.spent })),
  };
}

export function takeCheckpoint() {
  saved = snapshot(S.wave);
  saveRun(saved);
}

/**
 * After the campaign is won the run does not stop, so what is waiting to be
 * resumed is the endless continuation rather than a replay of wave 25. Only
 * the stored copy moves on; a retry still belongs to the wave just played.
 */
export function saveEndlessEntry() {
  saveRun(snapshot(CAMPAIGN_WAVES + 1));
}

export function hasCheckpoint() {
  return !!saved;
}

export function checkpointWave() {
  return saved ? saved.wave : 0;
}

export function clearCheckpoint() {
  saved = null;
}

/** The stored run, if there is one worth offering. Null otherwise. */
export function resumableRun() {
  const s = savedRun();
  if (!s || typeof s.wave !== 'number' || s.wave < 1) return null;
  if (typeof s.focus !== 'number' || typeof s.max !== 'number' || s.max < 1) return null;
  if (!Array.isArray(s.towers)) return null;
  return s;
}

/** Rewinds the run to the top of a wave, from a snapshot. */
function rewind(s, sanity, retries) {
  // Everything live on the board belongs to the attempt being left behind.
  for (const list of [S.foes, S.shots, S.sludge, S.towers, S.queue,
    S.fx, S.parts, S.conf, S.floats]) list.length = 0;
  S.banner = null;
  S.cheer = null;
  S.cheerT = 0;
  S.boss = null;
  S.shake = 0;
  S.flashT = 0;
  S.flashCol = null;
  S.sel = null;
  S.build = null;
  S.t = 0;

  S.runId = s.runId || S.runId;
  S.startedAt = Date.now() - (s.elapsedMs || 0);
  S.wave = s.wave;
  S.endless = Math.max(0, s.wave - CAMPAIGN_WAVES);
  S.focus = s.focus;
  S.max = s.max;
  S.sanity = sanity;
  S.best = s.best || 0;
  S.killed = s.killed || 0;
  S.leaked = s.leaked || 0;
  S.lost = s.lost || 0;
  S.retries = retries;
  for (const t of s.towers) reviveTower(t);

  S.phase = 'brief';
  emit('run:brief', { wave: S.wave });
}

/**
 * Rewinds to the start of the wave and asks the UI for its briefing again.
 * Returns false if there is nothing to go back to.
 */
export function retryWave() {
  if (!saved) return false;
  rewind(saved, retrySanity(saved), saved.retries + 1);
  return true;
}

/**
 * Picks up the stored run where it was left, at the top of its wave.
 * Returns false if there is nothing stored.
 */
export function resumeRun() {
  const s = resumableRun();
  if (!s) return false;
  // A run left on zero was a defeat walked away from, so picking it up again
  // is a retry and gets a retry's terms rather than a free run.
  const sanity = s.sanity > 0 ? Math.min(s.sanity, s.max) : retrySanity(s);
  rewind(s, sanity, s.retries || 0);
  return true;
}
