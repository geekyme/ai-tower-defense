import { S } from '../core/state.js';
import { emit } from '../core/bus.js';
import { reviveTower } from './towers.js';

/**
 * The start of the current wave, kept so a defeat costs you the wave rather
 * than the whole run.
 *
 * Taken when the build phase opens, which is before you have spent anything on
 * this wave: retrying hands back the focus and the board you had when the wave
 * was still ahead of you, and full sanity, because a retry is a fresh go at
 * the wave rather than a continuation of the run that just ended.
 */

let saved = null;

export function takeCheckpoint() {
  saved = {
    wave: S.wave,
    endless: S.endless,
    focus: S.focus,
    max: S.max,
    best: S.best,
    killed: S.killed,
    leaked: S.leaked,
    lost: S.lost,
    retries: S.retries,
    towers: S.towers.map(t => ({ key: t.key, c: t.c, r: t.r, lv: t.lv, spent: t.spent })),
  };
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

/**
 * Rewinds to the start of the wave and asks the UI for its briefing again.
 * Returns false if there is nothing to go back to.
 */
export function retryWave() {
  if (!saved) return false;

  // Everything live on the board belongs to the attempt that just failed.
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

  S.wave = saved.wave;
  S.endless = saved.endless;
  S.focus = saved.focus;
  S.max = saved.max;
  S.sanity = saved.max;
  S.best = saved.best;
  S.killed = saved.killed;
  S.leaked = saved.leaked;
  S.lost = saved.lost;
  S.retries = saved.retries + 1;
  for (const t of saved.towers) reviveTower(t);

  S.phase = 'brief';
  emit('run:brief', { wave: S.wave });
  return true;
}
