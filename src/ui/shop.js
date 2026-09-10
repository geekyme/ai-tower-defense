import { TOWERS, TOWER_KEYS } from '../data/towers.js';
import { S } from '../core/state.js';
import { clock } from '../render/clock.js';
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
    // Both of these are rewritten by `hud()` the moment the card is selected.
    card.setAttribute('aria-pressed', 'false');
    // The badge only shows once the card is selected, which is the only time
    // tapping it again does anything other than select it.
    card.innerHTML =
      '<div class="g">' + glyph(key, d.col) + '</div>' +
      '<div class="nm">' + d.name + '</div>' +
      '<div class="ct">' + d.cost + '</div>' +
      '<i class="tip" aria-hidden="true">i</i>';
    card.addEventListener('click', () => selectTower(key));
    shop.appendChild(card);
  }
}

/**
 * Picks the defence the next board tap will place.
 *
 * Selecting one puts nothing over the board — the card lights up, the plots
 * you can build on flare, and a strip above the call row names the defence and
 * says the card will explain itself if you tap it again. Tapping the card you
 * already have selected is what opens those details, and while they are open,
 * tapping any card shows that one's.
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

  // Restarts the flare across the plots, so a fresh pick is always announced
  // on the board and not just in the shop.
  if (!same) S.pickAt = clock();

  if (open && same) hidePreview();
  else if (open || same) showPreview(key);

  invalidateHud();
  hud();
}

/** Drops the selection and the details with it. */
export function clearSelection() {
  S.build = null;
  S.pickAt = -99;
  hidePreview();
  invalidateHud();
  hud();
}
