import { TOWERS } from '../data/towers.js';
import { S } from '../core/state.js';
import { cell, cellOf, canvas } from '../core/view.js';
import { unlockAudio, toggleSound, soundEnabled } from '../core/audio.js';
import { on } from '../core/bus.js';
import { canBuild, placeTower, towerAt, upgradeTower, sellTower } from '../engine/towers.js';
import { startWave } from '../engine/waves.js';
import { say } from '../engine/effects.js';
import { el, refs } from './dom.js';
import { hud, invalidateHud } from './hud.js';
import { showInspect, hideInspect, hidePreview } from './panels.js';
import { clearSelection } from './shop.js';
import { briefing, pauseScreen } from './screens.js';

/** The hovered build cell, read by the renderer to draw the placement ghost. */
export let ghost = null;

function refresh() {
  invalidateHud();
  hud();
}

function onBoardTap(ev) {
  ev.preventDefault();
  unlockAudio();
  if (S.phase !== 'wave' && S.phase !== 'build') return;
  hidePreview();

  const { c, r } = cellOf(ev);
  const existing = towerAt(c, r);

  if (existing) {
    S.build = null;
    showInspect(existing);
    refresh();
    return;
  }

  if (S.build && canBuild(c, r)) {
    if (!placeTower(S.build, c, r)) {
      say((c + 0.5) * cell, (r + 0.5) * cell, 'not enough focus', '#ff6b6b', cell * 0.28);
    } else if (S.focus < TOWERS[S.build].cost) {
      S.build = null;
    }
    refresh();
    return;
  }

  hideInspect();
}

export function initInput() {
  canvas.addEventListener('pointerdown', onBoardTap, { passive: false });
  canvas.addEventListener('pointermove', ev => { ghost = S.build ? cellOf(ev) : null; });
  canvas.addEventListener('pointerleave', () => { ghost = null; });

  el('upBtn').addEventListener('click', () => {
    if (upgradeTower(S.sel)) refresh();
  });
  el('sellBtn').addEventListener('click', () => {
    sellTower(S.sel);
    refresh();
  });
  el('closeBtn').addEventListener('click', hideInspect);
  el('pvX').addEventListener('click', clearSelection);
  refs.callBtn.addEventListener('click', startWave);

  el('briefBtn').addEventListener('click', () => {
    if (S.phase !== 'build') return;
    S.phase = 'brief';
    briefing();
  });

  el('sndBtn').addEventListener('click', e => {
    e.currentTarget.classList.toggle('on', toggleSound());
  });
  el('sndBtn').classList.toggle('on', soundEnabled());

  el('pauseBtn').addEventListener('click', () => {
    if (S.phase !== 'wave' && S.phase !== 'build') return;
    S.prev = S.phase;
    S.phase = 'paused';
    pauseScreen();
  });

  // A defence removed by an audit or a sale must not stay selected.
  on('tower:removed', ({ tower }) => {
    if (S.sel === tower) hideInspect();
  });
}
