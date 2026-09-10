import { TOWERS, TOWER_KEYS } from '../data/towers.js';
import { S } from '../core/state.js';
import { refs } from './dom.js';
import { glyph } from './glyphs.js';
import { showPreview, hidePreview, hideInspect } from './panels.js';
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

/** Toggles a defence as the thing the next board tap will place. */
export function selectTower(key) {
  S.build = S.build === key ? null : key;
  hideInspect();
  if (S.build) showPreview(key);
  else hidePreview();
  invalidateHud();
  hud();
}

export function clearSelection() {
  S.build = null;
  hidePreview();
  invalidateHud();
  hud();
}
