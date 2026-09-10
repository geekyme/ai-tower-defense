import { TOWERS, TOWER_KEYS } from '../data/towers.js';
import { S } from '../core/state.js';
import { W, H, cell } from '../core/view.js';
import { say } from '../engine/effects.js';
import { refs } from './dom.js';
import { glyph } from './glyphs.js';
import { showPreview, hidePreview, hideInspect, isPreviewOpen } from './panels.js';
import { hud, invalidateHud } from './hud.js';

/** The scrolling row of buildable defences. */
export function buildShop() {
  const shop = refs.shop;
  shop.innerHTML = '';
  for (const key of TOWER_KEYS) {
    const d = TOWERS[key];
    const card = document.createElement('button');
    card.className = 'card';
    card.dataset.k = key;
    card.style.color = d.col;
    card.type = 'button';
    card.setAttribute('aria-label', d.name + ', ' + d.cost + ' focus');
    card.innerHTML =
      '<div class="g">' + glyph(key, d.col) + '</div>' +
      '<div class="nm">' + d.name + '</div>' +
      '<div class="ct">' + d.cost + '</div>';
    card.addEventListener('click', () => selectTower(key));
    shop.appendChild(card);
  }
}

/**
 * Picks the defence the next board tap will place.
 *
 * Selecting one puts nothing over the board — the card lights up and so do the
 * plots you can build on, which is all you need while you are choosing where
 * it goes. Tapping the card you already have selected is what opens its
 * details, and while those are open, tapping any card shows that one's.
 */
export function selectTower(key) {
  // The shop is dimmed behind a screen, but a stray tap must not get through
  // it either: a defence chosen from behind a briefing is a defence you did
  // not mean to choose.
  if (S.phase !== 'build' && S.phase !== 'wave') return;

  const open = isPreviewOpen();
  const same = S.build === key;

  S.build = key;
  hideInspect();

  if (open && same) hidePreview();
  else if (open || same) showPreview(key);
  else if (!S.towers.length) {
    // Early in a run the lit plots need a word of explanation. It floats over
    // the board and fades, so it is never something to dismiss.
    say(W / 2, H * 0.5, 'tap a lit plot to place it', TOWERS[key].col, cell * 0.32);
  }

  invalidateHud();
  hud();
}

/** Drops the selection and the details with it. */
export function clearSelection() {
  S.build = null;
  hidePreview();
  invalidateHud();
  hud();
}
