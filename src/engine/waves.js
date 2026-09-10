import { CAMPAIGN_WAVES, waveGroups, waveTitle } from '../data/waves.js';
import { lessonForWave } from '../data/lessons.js';
import { BUILD_TIME, BANK_RATE } from '../core/config.js';
import { S } from '../core/state.js';
import { W, H, cell } from '../core/view.js';
import { emit } from '../core/bus.js';
import { recordBestWave, unlockLesson } from '../core/storage.js';
import { spawn } from './spawn.js';
import { say, flash, banner } from './effects.js';

/** Flattens a wave's spawn groups into a time-ordered spawn queue. */
export function makeQueue(n) {
  const q = [];
  for (const [key, count, gap, delay] of waveGroups(n)) {
    for (let i = 0; i < count; i++) q.push({ k: key, t: (delay || 0) + i * gap });
  }
  return q.sort((a, b) => a.t - b.t);
}

/** Ends the build phase early, converting leftover build time into focus. */
export function startWave() {
  if (S.phase !== 'build') return;
  const bonus = Math.round(Math.max(0, S.buildT) * BANK_RATE);
  if (bonus > 0) {
    S.focus += bonus;
    say(W / 2, H * 0.55, '+' + bonus + ' banked', '#35e6d5', cell * 0.34);
  }
  S.queue = makeQueue(S.wave);
  S.phase = 'wave';
  S.t = 0;
  banner(waveTitle(S.wave), 'wave ' + S.wave);
  emit('wave:started', { wave: S.wave });
}

function waveCleared() {
  const reward = 45 + S.wave * 8;
  S.focus += reward;
  S.best = Math.max(S.best, S.wave);
  recordBestWave(S.wave);

  // One lesson per campaign wave, unlocked the first time it is cleared.
  const lesson = S.wave <= CAMPAIGN_WAVES ? lessonForWave(S.wave) : null;
  const isNew = lesson ? unlockLesson(S.wave) : false;

  say(W / 2, H * 0.44, 'wave clear  +' + reward, '#6ee7a0', cell * 0.4);
  if (isNew) {
    say(W / 2, H * 0.52, 'lesson unlocked', '#a379ff', cell * 0.34);
    say(W / 2, H * 0.58, lesson.title, '#35e6d5', cell * 0.26);
    flash('#a379ff', 0.35);
  }

  emit('wave:cleared', { wave: S.wave, reward, lesson: isNew ? lesson : null });

  if (S.wave >= CAMPAIGN_WAVES && !S.endless) {
    emit('run:won', {});
    return;
  }
  nextBrief();
}

export function stepWave(dt) {
  S.t += dt;
  while (S.queue.length && S.queue[0].t <= S.t) spawn(S.queue.shift().k, 0);
  if (!S.queue.length && !S.foes.length) waveCleared();
}

/** Advances to the next wave and asks the UI for a briefing. */
export function nextBrief() {
  S.wave++;
  if (S.wave > CAMPAIGN_WAVES) S.endless = S.wave - CAMPAIGN_WAVES;
  S.sludge.length = 0;
  S.phase = 'brief';
  emit('run:brief', { wave: S.wave });
}

/** Called by the UI once the player dismisses the briefing. */
export function beginBuildPhase() {
  S.phase = 'build';
  S.buildT = BUILD_TIME;
}
