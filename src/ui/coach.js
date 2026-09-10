import { TOWERS } from '../data/towers.js';
import { S } from '../core/state.js';
import { progress, getPref, setPref } from '../core/storage.js';
import { el, refs } from './dom.js';

/**
 * The first run's walkthrough.
 *
 * A briefing tells you what is coming and nothing at all about what to do with
 * the screen it hands you: a board of identical hexes, a row of six cards with
 * numbers on them, and eighteen seconds before a wave starts on its own. Every
 * one of those is obvious after one run and opaque before it, so the first run
 * gets four short steps that name the next tap and wait for it.
 *
 * Rules it follows, all of them for the same reason — a walkthrough that gets
 * in the way is worse than none:
 *   · it holds the build clock, so nothing starts while it is still talking;
 *   · every step ends because the player did the thing, never on a timer;
 *   · one tap dismisses it for good, and it never runs for anyone who has
 *     already cleared a wave.
 */

/** The cheapest defence, which is what step one asks for. */
const FIRST = 'evalsuite';

/**
 * A step is a line of copy, the thing it lights up, and the condition that
 * counts as done. Nothing here reads the clock.
 *
 * `spot` names the region to highlight: 'shop', 'board' or 'call'. `body` is
 * a function so a step can quote the focus you actually have when it opens.
 */
const STEPS = [
  {
    spot: 'shop',
    title: 'Pick a defence',
    // No "below" or "beside": the shop is a bottom row on a phone and a side
    // rail on a desktop, so the step points at the glow instead.
    body: () => 'Tap the glowing <b>' + TOWERS[FIRST].name + '</b> card. It costs ' +
      TOWERS[FIRST].cost + ' of your ' + Math.floor(S.focus) + ' focus.',
    done: () => !!S.build,
  },
  {
    spot: 'board',
    title: 'Now put it on the board',
    body: () => 'Every hex that lit up is a plot. Tap one <b>beside the lane</b> — a defence ' +
      'only shoots what walks past it.',
    done: () => S.towers.length >= 1,
  },
  {
    spot: 'shop',
    title: 'One is never enough',
    body: () => 'You have <b>' + Math.floor(S.focus) + '</b> focus left. Spend it along the ' +
      'lane, and tap a card a second time to read what it is for.',
    // Or when nothing on the board is affordable any more, so the step can
    // never become a dead end.
    done: () => S.towers.length >= 3 || S.focus < TOWERS[FIRST].cost,
  },
  {
    spot: 'call',
    title: 'Start it when you are ready',
    body: () => 'Threats walk from <b>inbound</b> to <b>you</b>. Each one that reaches the ' +
      'end costs <b>sanity</b>; each one you kill pays <b>focus</b>.',
    done: () => S.phase === 'wave',
  },
];

const SPOTS = ['spot-shop', 'spot-board', 'spot-call'];

let at = -1;
let running = false;

/** True while the walkthrough owns the pacing of the build phase. */
export function coachHoldsBuild() {
  return running && S.phase === 'build';
}

/** True while the walkthrough is saying something, so nothing else says it too. */
export function coachSpeaking() {
  return running;
}

/** Has this browser been shown the walkthrough — or outgrown it? */
function coached() {
  return getPref('coached') === true || progress.bestWave > 0;
}

/** True while a first wave would still be walked through, so the menu can say so. */
export function coachPending() {
  return !coached();
}

/**
 * Starts the walkthrough, if this is a first build phase on a first run.
 * Called when the wave one briefing is dismissed; safe to call any other time.
 */
export function startCoach() {
  if (running || coached()) return;
  if (S.wave !== 1 || S.endless || S.towers.length) return;
  running = true;
  at = -1;
  advance();
}

/** Ends it, remembers that, and puts the board back the way it was. */
export function endCoach() {
  if (!running) return;
  running = false;
  at = -1;
  setPref('coached', true);
  paint();
}

/**
 * Moves to the next step, skipping any that are already satisfied — a player
 * who places a defence while step one is still up should not be told to place
 * one — and finishing when there are none left.
 */
function advance() {
  do {
    at++;
  } while (at < STEPS.length && STEPS[at].done());
  if (at >= STEPS.length) {
    endCoach();
    return;
  }
  paint();
}

/** Lights up the region the current step is talking about. */
function spotlight(which) {
  const app = refs.app;
  if (!app) return;
  for (const cls of SPOTS) app.classList.toggle(cls, which === cls.slice(5));

  const card = refs.shop && refs.shop.querySelector('[data-k="' + FIRST + '"]');
  if (card) card.classList.toggle('coachmark', which === 'shop' && at === 0);
}

// Starts as null rather than '' so the first repaint always runs: '' is the
// signature of a bar that should be hidden, and hiding it is a real change.
let painted = null;

function paint() {
  const bar = el('coach');
  if (!bar) return;

  const step = running ? STEPS[at] : null;
  // Rebuilt every frame, so a step that quotes your focus keeps up with it.
  const body = step ? step.body() : '';
  const key = step ? at + '|' + body : '';
  if (key === painted) return;
  painted = key;

  if (!step) {
    bar.hidden = true;
    spotlight(null);
    return;
  }

  el('coachNum').textContent = (at + 1) + '/' + STEPS.length;
  el('coachTitle').textContent = step.title;
  el('coachBody').innerHTML = body;
  bar.hidden = false;
  spotlight(step.spot);
}

/**
 * Checked every frame from `hud()`. Steps end because the board changed, so
 * this is where every one of them ends.
 */
export function coachTick() {
  if (!running) return;
  // A screen has taken the board — a pause, a defeat, the menu. The
  // walkthrough waits rather than ending: the CSS hides it meanwhile.
  if (S.phase !== 'build' && S.phase !== 'wave') return;
  // The wave is away, so there is nothing left to walk anyone through.
  if (S.phase === 'wave') {
    endCoach();
    return;
  }
  if (STEPS[at].done()) advance();
  else paint();
}

/** Wires the dismiss button. Call once at start-up. */
export function initCoach() {
  const skip = el('coachSkip');
  if (skip) skip.addEventListener('click', endCoach);
}
