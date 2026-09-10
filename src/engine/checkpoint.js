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
 * this wave: retrying hands back the focus and the board you had when the wave
 * was still ahead of you, and full sanity, because a retry is a fresh go at
 * the wave rather than a continuation of the run that just ended.
 *
 * The same snapshot goes to storage, where it outlives the page. Resuming from
 * there is the same rewind with the sanity you actually had, so that walking
 * out and back in is not a way to heal.
 */

let saved = null;

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
  rewind(saved, saved.max, saved.retries + 1);
  return true;
}

/**
 * Picks up the stored run where it was left, at the top of its wave.
 * Returns false if there is nothing stored.
 */
export function resumeRun() {
  const s = resumableRun();
  if (!s) return false;
  const sanity = s.sanity > 0 ? Math.min(s.sanity, s.max) : s.max;
  rewind(s, sanity, s.retries || 0);
  return true;
}
