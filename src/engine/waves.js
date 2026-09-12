import { CAMPAIGN_WAVES, waveGroups, waveTitle } from '../data/waves.js';
import { lessonForWave } from '../data/lessons.js';
import { BUILD_TIME, BANK_RATE } from '../core/config.js';
import { S } from '../core/state.js';
import { W, H, cell } from '../core/view.js';
import { emit } from '../core/bus.js';
import { recordBestWave, unlockLesson } from '../core/storage.js';
import { sfx } from '../core/audio.js';
import { spawn } from './spawn.js';
import { takeCheckpoint } from './checkpoint.js';
import { say, flash, banner, cheer, confetti, shock } from './effects.js';

/** Seconds the wave-clear celebration holds the board before the briefing. */
const CHEER_HOLD = 2.4;

/**
 * What clearing a wave pays.
 *
 * Most of it is conditional. A flat reward pays the same whether you held the
 * lane or let a third of it walk past, which means the run funds itself back
 * out of trouble and the board you end up with has nothing to do with how you
 * played. Splitting it means a wave you hold clean pays for roughly the next
 * upgrade and a wave you scrape through does not, so the gap between playing
 * well and playing adequately compounds instead of washing out.
 */
const CLEAR_BASE = 30;
const CLEAR_PER_WAVE = 5;
const CLEAN_BASE = 30;
const CLEAN_PER_WAVE = 6;

/**
 * Sanity handed back for a wave nothing got through.
 *
 * Sanity has to be recoverable by something, or a run that takes two bad waves
 * early is already over and spends twenty more waves finding out. Losing used
 * to be that something, which made dying on purpose the best move available.
 * This is the same relief attached to the opposite result: hold a wave clean
 * and you claw one back, up to the maximum you started with.
 */
const CLEAN_SANITY = 1;

const CONFETTI = ['#6ee7a0', '#35e6d5', '#a379ff', '#ffc24b', '#eafff4'];

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
  // What the clean-wave bonus is measured against.
  S.waveLeaks = S.leaked;
  banner(waveTitle(S.wave), 'wave ' + S.wave);
  emit('wave:started', { wave: S.wave });
}

function waveCleared() {
  const clean = S.leaked === S.waveLeaks;
  const base = CLEAR_BASE + S.wave * CLEAR_PER_WAVE;
  const bonus = clean ? CLEAN_BASE + S.wave * CLEAN_PER_WAVE : 0;
  const reward = base + bonus;
  S.focus += reward;

  const mended = clean ? Math.min(CLEAN_SANITY, S.max - S.sanity) : 0;
  S.sanity += mended;
  S.best = Math.max(S.best, S.wave);
  recordBestWave(S.wave);

  // One lesson per campaign wave, unlocked the first time it is cleared.
  const lesson = S.wave <= CAMPAIGN_WAVES ? lessonForWave(S.wave) : null;
  const isNew = lesson ? unlockLesson(S.wave) : false;

  const lines = [{ t: '+' + base + ' focus banked', c: '#35e6d5' }];
  if (bonus) lines.push({ t: '+' + bonus + ' nothing got past you', c: '#6ee7a0' });
  if (mended) lines.push({ t: '+' + mended + ' sanity recovered', c: '#6ee7a0' });
  if (S.sanity === S.max) lines.push({ t: 'not a scratch on you', c: '#6ee7a0' });
  if (isNew) lines.push({ t: 'lesson unlocked · ' + lesson.title, c: '#a379ff' });

  cheer('Wave ' + S.wave + ' cleared', S.endless ? 'endless ' + S.endless : waveTitle(S.wave),
    lines, CHEER_HOLD);
  confetti(120, CONFETTI);
  shock(W / 2, H * 0.4, cell * 5, '#6ee7a0', 0.7);
  flash('#6ee7a0', 0.45);
  sfx.clear();

  emit('wave:cleared', { wave: S.wave, reward, clean, mended, lesson: isNew ? lesson : null });

  // Hold here so the celebration is seen, rather than being buried under the
  // next briefing a frame later.
  S.cheerT = CHEER_HOLD;
}

/** Runs once the celebration has had its moment. */
function afterCheer() {
  if (S.wave >= CAMPAIGN_WAVES && !S.endless) {
    emit('run:won', {});
    return;
  }
  nextBrief();
}

export function stepWave(dt) {
  if (S.cheerT > 0) {
    S.cheerT -= dt;
    if (S.cheerT <= 0) afterCheer();
    return;
  }
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
  // Before a single focus is spent on this wave: what a retry rewinds to.
  takeCheckpoint();
}
