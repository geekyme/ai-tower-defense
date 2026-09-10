import { TOWERS } from '../data/towers.js';
import { CAMPAIGN_WAVES } from '../data/waves.js';
import { S } from '../core/state.js';
import { el, refs } from './dom.js';
import { fillInspect, showPreview, isPreviewOpen } from './panels.js';
import { placeHint, invalidateHint } from './place-hint.js';
import { coachTick } from './coach.js';

/**
 * The top status bar and the shop's affordability state.
 *
 * `hud()` runs every frame, so it early-outs on an unchanged signature rather
 * than touching the DOM 60 times a second.
 */

let lastKey = '';

/** Forces the next hud() call to repaint, after anything changes off-frame. */
export function invalidateHud() {
  lastKey = '';
  invalidateHint();
}

export function hud() {
  // Both of these live outside the signature check below. The walkthrough
  // steps on things the bar cannot see, and the strip also answers to the
  // sheets opening and closing, which leave every number on the bar untouched.
  coachTick();
  placeHint();

  const key = S.sanity + '|' + Math.floor(S.focus) + '|' + S.wave + '|' + S.towers.length;
  if (key === lastKey) return;
  lastKey = key;

  el('sanityVal').textContent = S.sanity;
  el('focusVal').textContent = Math.floor(S.focus);
  el('waveVal').textContent = S.wave + '/' + (S.endless ? '∞' : CAMPAIGN_WAVES);
  el('sanityFill').style.width = (S.sanity / S.max * 100) + '%';
  refs.callBtn.querySelector('span').textContent = 'Start wave ' + S.wave;

  for (const card of refs.shop.children) {
    const d = TOWERS[card.dataset.k];
    const picked = S.build === card.dataset.k;
    card.classList.toggle('poor', S.focus < d.cost);
    card.classList.toggle('sel', picked);
    card.setAttribute('aria-pressed', picked ? 'true' : 'false');
    card.setAttribute('aria-label', picked
      ? d.name + ', ' + d.cost + ' focus, selected. Tap a lit plot on the board '
        + 'to place it, or this card again for what it does.'
      : d.name + ', ' + d.cost + ' focus');
  }

  if (S.sel) fillInspect();
  if (S.build && isPreviewOpen()) showPreview(S.build);
}
