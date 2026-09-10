import { THREATS } from '../data/threats.js';
import { CAMPAIGN_WAVES, waveTitle, waveEra, waveRoster } from '../data/waves.js';
import { S, newRun, runDuration } from '../core/state.js';
import { layout } from '../core/view.js';
import { on } from '../core/bus.js';
import { sfx } from '../core/audio.js';
import { progress, recordSession, unlockedCount, clearSavedRun } from '../core/storage.js';
import { scale } from '../engine/spawn.js';
import { startWave, nextBrief, beginBuildPhase } from '../engine/waves.js';
import { hasCheckpoint, retryWave, clearCheckpoint, resumableRun, resumeRun,
  saveEndlessEntry } from '../engine/checkpoint.js';
import { threatThumbnail } from '../render/shapes.js';
import { el, refs, esc } from './dom.js';
import { buildShop } from './shop.js';
import { hud, invalidateHud } from './hud.js';
import { hidePreview, hideInspect } from './panels.js';
import { lessonListHTML, progressHTML } from './lesson-list.js';
import { shareRun, saveCard } from './share-card.js';
import { toast } from './toast.js';
import { creditHTML } from './credit.js';
import { startCoach, endCoach, coachPending } from './coach.js';

/**
 * Recedes the shop while something else owns the screen — a menu, a briefing,
 * a result, or the moment a wave is cleared. The shop sits outside the board
 * in the layout, so without this it stays lit and tappable underneath every
 * screen, and a defence picked from behind one leaves its sheet on the board.
 */
function holdScreen(held) {
  refs.app.classList.toggle('screen', held);
  if (held) {
    hidePreview();
    hideInspect();
  }
}

/** Full-board overlay used by every screen. */
function openOverlay(html) {
  refs.overlayBox.innerHTML = html;
  holdScreen(true);
  refs.overlay.classList.add('show');
  refs.overlayScroll.scrollTop = 0;
}

function closeOverlay() {
  refs.overlay.classList.remove('show');
  holdScreen(false);
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
  const first = n === 1 && !S.endless && progress.bestWave === 0;

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

  // A list of monsters with jargon on it means nothing until somebody says
  // what the list is for, which is the whole point of the screen.
  const why = first
    ? '<p class="kick">This is the briefing before every wave. It names what is walking in, ' +
      'so you can build the answer before it arrives.</p>'
    : '';

  openOverlay(
    '<div class="eyebrow"><b>' + esc(era.n) + '</b><i></i><s>wave ' + n +
      (S.endless ? '' : ' of ' + CAMPAIGN_WAVES) + '</s></div>' +
    (S.endless ? '' : progressHTML()) +
    '<h1 class="sm">' + esc(waveTitle(n)) + '</h1>' +
    '<p class="kick">' + esc(era.s) + '</p>' + why + mods + unlock +
    '<div class="rowhead">Arriving this wave</div>' +
    '<div class="rows">' + rows + '</div>' +
    '<button id="deploy" type="button">Build defences</button>');

  el('deploy').onclick = () => {
    closeOverlay();
    beginBuildPhase();
    refs.callRow.classList.remove('hidden');
    // Nothing on the board says what to do with it, so on a first run the
    // walkthrough takes over from here.
    startCoach();
    invalidateHud();
    hud();
  };
}

/* ------------------------------------------------------------------- menu */

/**
 * How a wave is named away from the board: campaign waves count out of the
 * campaign, endless ones count from the end of it.
 */
function waveLabel(n) {
  return n > CAMPAIGN_WAVES
    ? 'endless ' + (n - CAMPAIGN_WAVES)
    : 'wave ' + n + ' of ' + CAMPAIGN_WAVES;
}

/**
 * The three taps the whole game is made of, said before anybody has to guess
 * at them. This is the landing page for most people who ever see the game, so
 * it has to answer "what do I do" above the button, in a glance.
 */
function stepsHTML() {
  // Deliberately not "the row at the bottom": on a wide screen the shop is a
  // rail down the side, and a step that points at the wrong edge is worse
  // than one that points at nothing.
  return '<ol class="steps">' +
    '<li><b>1</b><span>Pick a defence from the shop</span></li>' +
    '<li><b>2</b><span>Tap a lit hex to place it beside the lane</span></li>' +
    '<li><b>3</b><span>Kill everything before it walks off your end</span></li>' +
    '</ol>';
}

/** The two numbers on the bar, in the colours they are shown in. */
function legendHTML() {
  return '<ul class="legend">' +
    '<li class="cy"><b>Focus</b> buys defences. Every kill pays more.</li>' +
    '<li class="co"><b>Sanity</b> is your health. You get sixteen, and anything ' +
      'that reaches the end takes some.</li>' +
    '</ul>';
}

export function menu() {
  newRun();
  clearCheckpoint();
  // A restart in the middle of the walkthrough leaves its spotlight lit.
  endCoach();
  layout();
  buildShop();
  invalidateHud();
  hud();
  refs.callRow.classList.add('hidden');
  hideInspect();

  const best = progress.bestWave;
  const record = best > 0
    ? '<p class="record">Best so far: <b>wave ' + best + '</b> · <b>' + unlockedCount() +
      ' of ' + CAMPAIGN_WAVES + '</b> lessons unlocked. Progress is saved in this browser.</p>'
    : '';

  // The playbook is a separate page and a phone drops tabs, so a run is easy
  // to walk out of by accident. It waits here, at the top of the wave it was
  // on, rather than being lost — an endless run especially, which otherwise
  // costs twenty five waves to get back to.
  const open = resumableRun();
  const where = open ? waveLabel(open.wave) : '';
  const built = open ? open.towers.length : 0;
  const pickUp = open
    ? '<p class="lore">You left a run at <b>' + where + '</b>, with <b>' + built + '</b> defence' +
      (built === 1 ? '' : 's') + ' standing and <b>' + Math.floor(open.focus) +
      '</b> focus. It picks up at the top of that wave.</p>' +
      '<button id="pickup" type="button">Back into ' + where + '</button>'
    : '';

  // Everything below the button used to sit above it, and a first-time player
  // met six paragraphs before they met a game. None of it is gone — it is
  // folded, and the walkthrough teaches the parts that matter on the way in.
  const deeper =
    '<details class="more"><summary>How a run actually goes</summary>' +
    '<p class="lore">Every defence is the <b>only</b> answer to something. Read the briefing ' +
      'before each wave: armour, invisibility and immunity are all counters to a choice you ' +
      'made earlier.</p>' +
    '<p class="lore">Bosses freeze, downgrade, hijack and permanently delete your defences. ' +
      'Anything you build in one tidy cluster will be gone by era four.</p>' +
    '<p class="lore">Twenty five waves across five eras, then an endless mode that does not ' +
      'stop. The problems change as you get better at the job.</p>' +
    '<p class="lore">Every wave you clear unlocks one lesson in <b>the playbook</b>, for good. ' +
      'Clear all twenty five and the whole thing is yours.</p>' +
    '</details>';

  openOverlay(
    '<h1>Head of AI<em>defence</em></h1>' +
    '<p class="kick">You run AI at a company. Hallucinations, shadow AI and an audit are ' +
      'walking down that lane. Build the controls that stop them.</p>' +
    pickUp +
    // Only for somebody who has not played: the three taps go above the button
    // so they are read before it is pressed, and a returning player gets a
    // short menu instead of a lesson they have already had.
    (coachPending() ? stepsHTML() + legendHTML() : '') +
    '<button' + (open ? ' class="ghost"' : '') + ' id="go" type="button">' +
      (open ? 'Start a new run instead' : 'Take the role') + '</button>' +
    (coachPending() ? '<p class="under">Wave one walks you through it, tap by tap.</p>' : '') +
    record +
    deeper +
    '<a class="btn ghost" href="lessons.html">Open the playbook</a>' +
    creditHTML());

  if (open) {
    el('pickup').onclick = () => {
      closeOverlay();
      if (!resumeRun()) menu();
      invalidateHud();
      hud();
    };
  }
  el('go').onclick = () => {
    closeOverlay();
    clearSavedRun();
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
    clearSavedRun();
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
 * Writes the finished run to localStorage. Keyed on the run's id, so calling
 * it again for the same run (victory, then the endless continuation ending,
 * or an end either side of a resume) updates that row instead of adding one.
 */
function endSession(outcome) {
  if (outcome === 'abandoned' && S.best === 0) return;
  recordSession({
    runId: S.runId,
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

/** Send the run to someone, or keep the card. Both end screens offer both. */
function shareButtons() {
  return '<button class="ghost" id="send" type="button">Share this run</button>' +
    '<button class="ghost" id="snap" type="button">Save the card</button>';
}

function wireShareButtons() {
  el('send').onclick = shareRun;
  el('snap').onclick = saveCard;
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
    shareButtons());

  if (canRetry) {
    el('retry').onclick = () => {
      closeOverlay();
      refs.callRow.classList.add('hidden');
      if (!retryWave()) menu();
      invalidateHud();
      hud();
    };
  }
  el('again').onclick = () => { closeOverlay(); clearSavedRun(); menu(); };
  wireShareButtons();
}

export function victory() {
  S.phase = 'won';
  sfx.win();
  refs.callRow.classList.add('hidden');
  hideInspect();
  endSession('victory');
  // Winning is not the end of the run: what is waiting to be picked up now is
  // the endless continuation, so leaving this screen does not close the door
  // on it.
  saveEndlessEntry();

  openOverlay(
    '<div class="eyebrow"><b>Campaign complete</b><i></i><s>' + CAMPAIGN_WAVES + ' of ' + CAMPAIGN_WAVES + '</s></div>' +
    '<h1 class="md">The playbook<em>' + S.sanity + ' sanity left</em></h1>' +
    '<p class="kick">Five eras held. Every lesson is yours now, one per wave.</p>' +
    statBlock() +
    '<div class="rows lessons-inline">' + lessonListHTML({ size: 30 }) + '</div>' +
    '<button id="endless" type="button">Continue forever</button>' +
    playbookLink() +
    shareButtons() +
    '<button class="ghost" id="menu2" type="button">New game</button>' +
    creditHTML());

  el('endless').onclick = () => {
    closeOverlay();
    nextBrief();
  };
  wireShareButtons();
  el('menu2').onclick = () => { closeOverlay(); clearSavedRun(); menu(); };
}

/** Wires the engine's events to the screens. Call once at start-up. */
export function initScreens() {
  on('run:brief', briefing);
  on('run:lost', defeat);
  on('run:won', victory);
  on('wave:cleared', ({ lesson }) => {
    // The celebration owns the board for a couple of seconds; nothing should
    // be sitting on top of it or lit up beneath it.
    holdScreen(true);
    if (!lesson) return;
    // A beat behind the celebration, so the two land as two moments.
    setTimeout(() => {
      sfx.unlock();
      toast('Lesson ' + lesson.wave + ' unlocked', lesson.title, { href: 'lessons.html', label: 'read' });
    }, 900);
  });
  on('wave:started', () => {
    refs.callRow.classList.add('hidden');
    invalidateHud();
    hud();
  });
}

export { startWave, endSession };
