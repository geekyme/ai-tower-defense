import { THREATS } from '../data/threats.js';
import { CAMPAIGN_WAVES, waveTitle, waveEra, waveRoster } from '../data/waves.js';
import { S, newRun, runDuration } from '../core/state.js';
import { layout } from '../core/view.js';
import { on } from '../core/bus.js';
import { sfx } from '../core/audio.js';
import { progress, recordSession, unlockedCount } from '../core/storage.js';
import { scale } from '../engine/spawn.js';
import { startWave, nextBrief, beginBuildPhase } from '../engine/waves.js';
import { hasCheckpoint, retryWave, clearCheckpoint } from '../engine/checkpoint.js';
import { threatThumbnail } from '../render/shapes.js';
import { el, refs, esc } from './dom.js';
import { buildShop } from './shop.js';
import { hud, invalidateHud } from './hud.js';
import { hidePreview, hideInspect } from './panels.js';
import { lessonListHTML, progressHTML } from './lesson-list.js';
import { shareCard } from './share-card.js';
import { creditHTML } from './credit.js';

/** Full-board overlay used by every screen. */
function openOverlay(html) {
  refs.overlayBox.innerHTML = html;
  hidePreview();
  refs.overlay.classList.add('show');
  refs.overlayScroll.scrollTop = 0;
}

function closeOverlay() {
  refs.overlay.classList.remove('show');
}

/* --------------------------------------------------------------- briefing */

/** Threat traits worth calling out before a wave. `[label, isDanger]`. */
function tagsFor(D) {
  const t = [];
  if (D.boss) t.push(['boss', 1]);
  if (D.armor) t.push(['armour ' + D.armor, D.armor >= 10]);
  if (D.antiPierce) t.push(['pierce proof', 1]);
  if (D.onlyEval) t.push(['eval only', 1]);
  if (D.noAoE) t.push(['single target only', 1]);
  if (D.cloak) t.push(['invisible', 1]);
  if (D.slowProof) t.push(['ignores slows', 0]);
  if (D.aura) t.push(['shields allies', 1]);
  if (D.regen || D.heal) t.push(['self heals', 0]);
  if (D.grow) t.push(['grows', 0]);
  if (D.drain) t.push(['drains focus', 1]);
  if (D.split) t.push(['splits', 0]);
  if (D.spawn) t.push(['spawns', 0]);
  if (D.hijack || D.sunset || D.page || D.attrition || D.power) t.push(['attacks your defences', 1]);
  if (D.towerSlow || D.sludge) t.push(['slows your defences', 1]);
  if (D.mimic) t.push(['disguised', 1]);
  if (D.dmg >= 4) t.push([D.dmg + ' sanity', 1]);
  if (D.spd >= 2.2) t.push(['very fast', 0]);
  return t;
}

function threatRow(key, later) {
  const D = THREATS[key];
  const tags = tagsFor(D).map(([t, hot]) => '<em class="' + (hot ? 'hot' : '') + '">' + esc(t) + '</em>').join('');
  return '<div class="foe"><img src="' + threatThumbnail(key, 38) + '" width="38" height="38" alt="">' +
    '<div><div class="fn">' + esc(D.n) +
    (later ? ' <span class="later">(arrives later)</span>' : '') + '</div>' +
    '<div class="fd">' + esc(D.d) + '</div><div class="tg">' + tags + '</div></div></div>';
}

export function briefing() {
  const n = S.wave;
  const era = waveEra(n);
  const { direct, later } = waveRoster(n);

  const rows = direct.map(k => threatRow(k, false)).join('') +
    later.map(k => threatRow(k, true)).join('');

  const mods = S.endless
    ? '<p class="lore">Endless ' + S.endless + '. Every threat has ' +
      Math.round((scale() - 1) * 100) + '% more health than the base and the mix is randomised.</p>'
    : '';

  const unlock = S.endless
    ? ''
    : '<p class="lore">Clear this wave and lesson ' + n + ' of ' + CAMPAIGN_WAVES +
      ' opens in your <b>playbook</b>. You have ' + unlockedCount() + ' so far.</p>';

  openOverlay(
    '<div class="eyebrow"><b>' + esc(era.n) + '</b><i></i><s>wave ' + n +
      (S.endless ? '' : ' of ' + CAMPAIGN_WAVES) + '</s></div>' +
    (S.endless ? '' : progressHTML()) +
    '<h1 class="sm">' + esc(waveTitle(n)) + '</h1>' +
    '<p class="kick">' + esc(era.s) + '</p>' + mods + unlock +
    '<div class="rows">' + rows + '</div>' +
    '<button id="deploy" type="button">Build defences</button>');

  el('deploy').onclick = () => {
    closeOverlay();
    beginBuildPhase();
    refs.callRow.classList.remove('hidden');
    invalidateHud();
    hud();
  };
}

/* ------------------------------------------------------------------- menu */

export function menu() {
  newRun();
  clearCheckpoint();
  layout();
  buildShop();
  invalidateHud();
  hud();
  refs.callRow.classList.add('hidden');
  hideInspect();

  const best = progress.bestWave;
  const resume = best > 0
    ? '<p class="lore">Best so far: <b>wave ' + best + '</b> · <b>' + unlockedCount() +
      ' of ' + CAMPAIGN_WAVES + '</b> lessons unlocked. Progress is saved in this browser.</p>'
    : '';

  openOverlay(
    '<h1>Head of AI<em>defence</em></h1>' +
    '<p class="kick">Twenty five waves across five eras, then it never stops. The problems change as you get better at the job.</p>' +
    resume +
    '<p class="lore">Threats walk from <b>inbound</b> to <b>you</b>. Kills pay <b>focus</b>. Anything that lands costs <b>sanity</b>, and you only have sixteen.</p>' +
    '<p class="lore">Tap a defence to pick it, then tap a lit plot to place it. Tap the same defence again to read what it is for.</p>' +
    '<p class="lore">Every defence has one thing it is the only answer to. Read the briefing before each wave, because armour, invisibility and immunity are all counters to a specific choice you made earlier.</p>' +
    '<p class="lore">Bosses freeze, downgrade, hijack and permanently delete your defences. Anything you build in one tidy cluster will be gone by era four.</p>' +
    '<p class="lore">Every wave you clear unlocks one lesson in <b>the playbook</b>. Clear all twenty five and the whole thing is yours.</p>' +
    '<button id="go" type="button">Take the role</button>' +
    '<a class="btn ghost" href="lessons.html">Open the playbook</a>' +
    creditHTML());

  el('go').onclick = () => {
    closeOverlay();
    nextBrief();
  };
}

/* ------------------------------------------------------------------ pause */

export function pauseScreen() {
  openOverlay(
    '<h1 class="sm">Paused</h1>' +
    '<p class="kick">Nothing is on fire while you are here.</p>' +
    '<button id="res" type="button">Back in</button>' +
    '<a class="btn ghost" href="lessons.html">Open the playbook</a>' +
    '<button class="ghost" id="quit" type="button">Restart</button>');

  el('res').onclick = () => {
    closeOverlay();
    S.phase = S.prev || 'build';
  };
  el('quit').onclick = () => {
    closeOverlay();
    endSession('abandoned');
    menu();
  };
}

/* ----------------------------------------------------------------- result */

function statBlock() {
  return '<div id="ovStats">' +
    '<div><b style="color:#35e6d5">' + S.killed + '</b><span>handled</span></div>' +
    '<div><b style="color:#ff6b6b">' + S.leaked + '</b><span>got through</span></div>' +
    '<div><b style="color:#a379ff">' + S.lost + '</b><span>defences lost</span></div>' +
    (S.retries ? '<div><b style="color:#ffc24b">' + S.retries + '</b><span>waves retried</span></div>' : '') +
    '</div>';
}

/**
 * Writes the finished run to localStorage. Keyed on the run's start time, so
 * calling it again for the same run (victory, then the endless continuation
 * ending) updates that row instead of adding another.
 */
function endSession(outcome) {
  if (outcome === 'abandoned' && S.best === 0) return;
  recordSession({
    runId: S.startedAt,
    outcome,
    wave: S.wave,
    bestWave: S.best,
    handled: S.killed,
    leaked: S.leaked,
    defencesLost: S.lost,
    retries: S.retries,
    sanity: S.sanity,
    maxSanity: S.max,
    towers: [...new Set(S.towers.map(t => t.key))],
    durationMs: runDuration(),
  });
}

function playbookLink() {
  return '<a class="btn ghost" href="lessons.html">Open the playbook</a>';
}

export function defeat() {
  if (S.phase === 'over') return;
  S.phase = 'over';
  S.build = null;
  hideInspect();
  refs.callRow.classList.add('hidden');
  endSession('defeat');

  const got = unlockedCount();
  const left = CAMPAIGN_WAVES - got;
  const push = got === 0
    ? 'Clear a single wave and its lesson is yours for good.'
    : left === 0
      ? 'You already have the full playbook.'
      : 'You have ' + got + ' of ' + CAMPAIGN_WAVES + ' lessons. Every wave you clear keeps one more, permanently.';

  // A defeat costs you the wave, not the run: the retry rewinds to the moment
  // this wave's briefing ended, with the focus and the board you had then.
  const canRetry = hasCheckpoint();
  const retry = canRetry
    ? '<p class="lore">Go again from the top of this wave: the defences and the focus you' +
      ' started it with, and your sanity back to ' + S.max + '. Build it differently.</p>' +
      '<button id="retry" type="button">Try wave ' + S.wave + ' again</button>'
    : '';

  openOverlay(
    '<div class="eyebrow"><b>' + esc(waveEra(Math.min(S.wave, CAMPAIGN_WAVES)).n) + '</b><i></i></div>' +
    '<h1 class="md">Burnt out<em>wave ' + S.wave + (S.endless ? '' : ' of ' + CAMPAIGN_WAVES) + '</em></h1>' +
    '<p class="kick">' + esc(waveTitle(S.wave)) + '</p>' + statBlock() + progressHTML() +
    '<p class="lore">' + push +
      (left > 0 ? ' Everything that just killed you has a counter written down in there.' : '') + '</p>' +
    retry +
    '<button' + (canRetry ? ' class="ghost"' : '') + ' id="again" type="button">Start a new run' +
      (left > 0 && !canRetry ? ' · ' + left + ' lessons to go' : '') + '</button>' +
    playbookLink() +
    '<button class="ghost" id="snap" type="button">Save result card</button>');

  if (canRetry) {
    el('retry').onclick = () => {
      closeOverlay();
      refs.callRow.classList.add('hidden');
      if (!retryWave()) menu();
      invalidateHud();
      hud();
    };
  }
  el('again').onclick = () => { closeOverlay(); menu(); };
  el('snap').onclick = shareCard;
}

export function victory() {
  S.phase = 'won';
  sfx.win();
  refs.callRow.classList.add('hidden');
  hideInspect();
  endSession('victory');

  openOverlay(
    '<div class="eyebrow"><b>Campaign complete</b><i></i><s>' + CAMPAIGN_WAVES + ' of ' + CAMPAIGN_WAVES + '</s></div>' +
    '<h1 class="md">The playbook<em>' + S.sanity + ' sanity left</em></h1>' +
    '<p class="kick">Five eras held. Every lesson is yours now, one per wave.</p>' +
    statBlock() +
    '<div class="rows lessons-inline">' + lessonListHTML({ size: 30 }) + '</div>' +
    '<button id="endless" type="button">Continue forever</button>' +
    playbookLink() +
    '<button class="ghost" id="snap" type="button">Save result card</button>' +
    '<button class="ghost" id="menu2" type="button">New game</button>' +
    creditHTML());

  el('endless').onclick = () => {
    closeOverlay();
    nextBrief();
  };
  el('snap').onclick = shareCard;
  el('menu2').onclick = () => { closeOverlay(); menu(); };
}

/* ------------------------------------------------------- lesson unlock toast */

function toast(text, sub) {
  const node = document.createElement('div');
  node.className = 'toast';
  node.innerHTML = '<b>' + esc(text) + '</b><span>' + esc(sub) + '</span>' +
    '<a href="lessons.html">read</a>';
  document.body.appendChild(node);
  requestAnimationFrame(() => node.classList.add('in'));
  setTimeout(() => {
    node.classList.remove('in');
    setTimeout(() => node.remove(), 400);
  }, 4200);
}

/** Wires the engine's events to the screens. Call once at start-up. */
export function initScreens() {
  on('run:brief', briefing);
  on('run:lost', defeat);
  on('run:won', victory);
  on('wave:cleared', ({ lesson }) => {
    if (!lesson) return;
    // A beat behind the celebration, so the two land as two moments.
    setTimeout(() => {
      sfx.unlock();
      toast('Lesson ' + lesson.wave + ' unlocked', lesson.title);
    }, 900);
  });
  on('wave:started', () => {
    refs.callRow.classList.add('hidden');
    invalidateHud();
    hud();
  });
}

export { startWave, endSession };
