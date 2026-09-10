import { TOWERS } from '../data/towers.js';
import { S } from '../core/state.js';
import { el, refs } from './dom.js';

/**
 * The one-line strip above the call-wave row, shown for as long as a defence
 * is selected and waiting to be put somewhere.
 *
 * Two things a new player has no way to guess: that the lit hexes on the board
 * are where the thing goes, and that the card they just tapped will explain
 * itself if they tap it again. Both are said here, in words, until the defence
 * is placed. It sits in the dock with the sheets, so it never covers a plot,
 * and it takes no pointer events, so it is never between a tap and the board.
 */

// Starts as null rather than '' so the first repaint always runs: '' is the
// signature of a strip that should be hidden, and hiding it is a real change.
let last = null;

/** Repaints the strip. Cheap enough to call every frame. */
export function placeHint() {
  const bar = el('placeHint');
  if (!bar) return;

  // A sheet already says more than this strip can, and a screen owns the
  // whole board, so in either case the strip stands down.
  const busy = refs.preview.classList.contains('show')
    || refs.inspect.classList.contains('show');
  const key = S.build && !busy ? S.build + '|' + (S.focus >= (TOWERS[S.build] || {}).cost) : '';
  if (key === last) return;
  last = key;

  if (!key) {
    bar.hidden = true;
    return;
  }

  const d = TOWERS[S.build];
  const short = Math.ceil(d.cost - S.focus);

  bar.hidden = false;
  // Colouring the whole strip tints its border and the badge with it.
  bar.style.color = short > 0 ? '#ff9aa4' : d.col;
  el('phMain').innerHTML = short > 0
    ? '<b>' + d.name + '</b> needs ' + short + ' more focus'
    : 'Tap a lit plot to place <b>' + d.name + '</b>';
}

/** Forces the next placeHint() call to repaint. */
export function invalidateHint() {
  last = null;
}
