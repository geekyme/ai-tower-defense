import { THREATS } from './data/threats.js';
import { BANK_RATE } from './core/config.js';
import { S } from './core/state.js';
import { initView, layout, rescaleEntities } from './core/view.js';
import { stepFoes } from './engine/foes.js';
import { stepTowers, stepShots } from './engine/towers.js';
import { stepWave, startWave } from './engine/waves.js';
import { paintBackground } from './render/board.js';
import { render } from './render/scene.js';
import { advanceClock } from './render/clock.js';
import { refs } from './ui/dom.js';
import { hud } from './ui/hud.js';
import { initInput, ghost } from './ui/input.js';
import { initScreens, menu } from './ui/screens.js';

/** Longest frame delta the simulation will accept, so a backgrounded tab
 *  resumes rather than fast-forwarding. */
const MAX_STEP = 0.05;

let last = 0;

function step(dt) {
  stepFoes(dt);
  stepTowers(dt);
  stepShots(dt);

  if (S.phase === 'wave') {
    stepWave(dt);
  } else {
    S.buildT -= dt;
    refs.callBonus.textContent = S.buildT > 0 ? '+' + Math.round(S.buildT * BANK_RATE) : '';
    if (S.buildT <= 0) startWave();
  }

  if (S.shake > 0) S.shake = Math.max(0, S.shake - dt * 24);
  if (S.flashT > 0) S.flashT -= dt;
  hud();
}

function frame(ts) {
  requestAnimationFrame(frame);
  const dt = Math.min(MAX_STEP, (ts - last) / 1000 || 0);
  last = ts;
  advanceClock(dt);
  if (S.phase === 'wave' || S.phase === 'build') step(dt);
  render(dt, ghost);
}

function onLayoutChange(prevTotal) {
  paintBackground();
  rescaleEntities(prevTotal, THREATS);
}

/**
 * One start-up step. A step that throws must not take the rest of the game
 * with it — the board is the point, the soundtrack is not — so each one is
 * reported to the panel in index.html and the next one still runs.
 */
function boot(label, fn) {
  try {
    fn();
  } catch (e) {
    if (window.gameProblem) window.gameProblem(label, e && e.message);
    console.error(label, e);
  }
}

boot('The board could not be set up', () => initView(refs.canvas, refs.stage, onLayoutChange));
boot('The screens could not be wired up', initScreens);
boot('The controls could not be wired up', initInput);
boot('The menu could not open', menu);

/*
 * The soundtrack is the newest and most exotic code here, and it is a nicety.
 * Loading it on the side keeps it out of the game's own module graph, so a
 * problem with it can slow the music down and nothing else. It talks to the
 * rest of the game over the bus, never by being imported.
 */
import('./core/music.js')
  .then(m => boot('The soundtrack could not start', m.initMusic))
  .catch(e => {
    if (window.gameProblem) window.gameProblem('The soundtrack could not load', e && e.message);
  });

window.addEventListener('load', layout);
requestAnimationFrame(ts => { last = ts; frame(ts); });

// Tells the boot check in index.html that the module graph linked and ran.
document.documentElement.setAttribute('data-booted', '');
try {
  sessionStorage.removeItem('head-of-ai-defence:reboot');
} catch (e) {
  // Storage can be blocked; the flag is a nicety, not a requirement.
}
