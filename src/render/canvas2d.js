/**
 * The one 2D context every renderer draws through, plus shared path helpers.
 *
 * `ctx` is a live binding. `withCtx` temporarily points it at another canvas,
 * which is how threat thumbnails are rendered with the same artwork code that
 * draws the board.
 */

export let ctx = null;

export function setCtx(c) {
  ctx = c;
}

export function withCtx(c, fn) {
  const prev = ctx;
  ctx = c;
  try {
    return fn();
  } finally {
    ctx = prev;
  }
}

/** Rounded rectangle path. */
export function rr(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

/** Regular n-gon path centred on the current origin. */
export function poly(c, n, r, rot) {
  c.beginPath();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 6.283 + (rot || 0);
    if (i) c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    else c.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  c.closePath();
}
