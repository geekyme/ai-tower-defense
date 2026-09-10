import { TOWERS, TOWER_NOTES } from '../data/towers.js';
import { MAX_TOWER_LEVEL } from '../core/config.js';
import { S } from '../core/state.js';
import { cell } from '../core/view.js';
import { stat, upgradeCost, sellValue } from '../engine/towers.js';
import { el, refs, esc } from './dom.js';
import { glyph } from './glyphs.js';

/**
 * The two sheets in the board's bottom dock:
 *   #preview  what a defence does, shown while you are choosing where to put it
 *   #inspect  what a placed defence is doing now, with upgrade and sell
 *
 * The preview stays a one-line strip that pointer events fall straight through
 * (see `#preview` in game.css), so reading about a defence never takes the
 * board away from you. Everything below that line only opens on request.
 */

let detailed = false;

function paintDot(node, key, colour, px) {
  node.style.background = 'rgba(255,255,255,.06)';
  node.style.boxShadow = 'inset 0 0 0 1px ' + colour;
  node.innerHTML = glyph(key, colour, px);
}

export function isPreviewOpen() {
  return refs.preview.classList.contains('show');
}

export function showPreview(key) {
  const d = TOWERS[key];
  const notes = TOWER_NOTES[key];
  const short = Math.ceil(d.cost - S.focus);

  paintDot(el('pvDot'), key, d.col, 17);
  el('pvName').textContent = d.name;

  const cost = el('pvCost');
  cost.textContent = d.cost + ' focus';
  cost.style.color = d.col;
  cost.classList.toggle('poor', short > 0);

  el('pvBlurb').textContent = d.blurb;
  el('pvNums').innerHTML =
    '<span>dps <i>' + Math.round(d.dmg / d.rate) + '</i></span>' +
    '<span>hit <i>' + d.dmg + '</i></span>' +
    '<span>every <i>' + d.rate.toFixed(2) + 's</i></span>' +
    '<span>range <i>' + d.range.toFixed(1) + ' cells</i></span>';
  el('pvTags').innerHTML = notes.tags
    .map(t => '<em style="color:' + d.col + '">' + esc(t) + '</em>')
    .join('');
  el('pvGood').textContent = notes.good;
  el('pvWeak').textContent = notes.weak;

  const hint = el('pvHint');
  hint.textContent = short > 0
    ? short + ' focus short. Sell something, or wait for a kill.'
    : detailed ? notes.hint : 'Tap a lit plot to place it.';
  hint.classList.toggle('warn', short > 0);

  refs.preview.classList.add('show');
}

/** Opens or closes the long copy under the strip. */
export function setPreviewDetails(open) {
  detailed = !!open;
  refs.preview.classList.toggle('open', detailed);
  const btn = el('pvInfo');
  btn.textContent = detailed ? 'Hide' : 'Details';
  btn.setAttribute('aria-expanded', String(detailed));
  if (S.build && isPreviewOpen()) showPreview(S.build);
}

export function togglePreviewDetails() {
  setPreviewDetails(!detailed);
}

/** Folds the sheet back to its strip, leaving the chosen defence selected. */
export function collapsePreview() {
  if (detailed) setPreviewDetails(false);
}

export function hidePreview() {
  refs.preview.classList.remove('show');
  setPreviewDetails(false);
}

export function showInspect(tower) {
  S.sel = tower;
  refs.inspect.classList.add('show');
  fillInspect();
}

export function hideInspect() {
  S.sel = null;
  refs.inspect.classList.remove('show');
}

export function fillInspect() {
  const t = S.sel;
  if (!t) return;

  paintDot(el('insDot'), t.key, t.def.col, 15);
  el('insName').textContent = t.def.name;
  el('insLvl').textContent = 'level ' + t.lv + (t.lv >= MAX_TOWER_LEVEL ? ' · max' : '');
  el('insBlurb').textContent = t.def.blurb;
  el('insNums').innerHTML =
    '<span>dps <i>' + Math.round(stat(t, 'dmg') / stat(t, 'rate')) + '</i></span>' +
    '<span>hit <i>' + Math.round(stat(t, 'dmg')) + '</i></span>' +
    '<span>range <i>' + (stat(t, 'range') / cell).toFixed(1) + '</i></span>';

  const up = el('upBtn');
  if (t.lv >= MAX_TOWER_LEVEL) {
    up.disabled = true;
    up.textContent = 'Fully upgraded';
  } else {
    up.disabled = S.focus < upgradeCost(t);
    up.textContent = 'Upgrade  ' + upgradeCost(t);
  }
  el('sellBtn').textContent = 'Sell ' + sellValue(t);
}
