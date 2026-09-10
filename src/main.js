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

initView(refs.canvas, refs.stage, onLayoutChange);
initScreens();
initInput();
menu();

window.addEventListener('load', layout);
requestAnimationFrame(ts => { last = ts; frame(ts); });
