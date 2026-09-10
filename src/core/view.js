import { COLS, ROWS, WAYPOINTS } from './config.js';
import { setCtx } from '../render/canvas2d.js';
import { S } from './state.js';

/**
 * Canvas sizing and the lane in pixel space.
 *
 * Everything on the board is measured in `cell`, so the same simulation runs
 * at any screen size. All of these are live bindings — read them, never
 * reassign them from outside this module.
 */

export let canvas = null;
export let cell = 32;
export let W = 0;
export let H = 0;
export let dpr = 1;
/** Lane waypoints in pixels. */
export let WP = [];
/** Length of each lane segment, and the total lane length. */
export let SEG = [];
export let TOTAL = 0;

let stage = null;
let onResize = null;

export function initView(canvasEl, stageEl, resizeHook) {
  canvas = canvasEl;
  stage = stageEl;
  onResize = resizeHook;
  setCtx(canvas.getContext('2d'));

  window.addEventListener('resize', layout);
  window.addEventListener('orientationchange', () => setTimeout(layout, 220));
  if (window.ResizeObserver) {
    let timer;
    new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(layout, 90);
    }).observe(stage);
  }
  layout();
}

/**
 * Recomputes cell size from the stage box and rescales anything already on
 * the board, so a rotate or resize mid-wave does not teleport threats.
 */
export function layout() {
  const box = stage.getBoundingClientRect();
  const prevTotal = TOTAL;

  cell = Math.max(15, Math.floor(Math.min(
    ((box.width || 360) - 10) / COLS,
    ((box.height || 560) - 6) / ROWS,
  )));
  W = cell * COLS;
  H = cell * ROWS;
  dpr = Math.min(window.devicePixelRatio || 1, 2.5);

  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);

  WP = WAYPOINTS.map(([c, r]) => ({ x: (c + 0.5) * cell, y: (r + 0.5) * cell }));
  SEG = [];
  TOTAL = 0;
  for (let i = 0; i < WP.length - 1; i++) {
    const d = Math.hypot(WP[i + 1].x - WP[i].x, WP[i + 1].y - WP[i].y);
    SEG.push(d);
    TOTAL += d;
  }

  if (onResize) onResize(prevTotal);
}

/** Point, heading and lane normal at distance `d` along the lane. */
export function at(d) {
  let x = d;
  for (let i = 0; i < SEG.length; i++) {
    if (x <= SEG[i]) {
      const a = WP[i], b = WP[i + 1], t = x / SEG[i];
      return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        ang: Math.atan2(b.y - a.y, b.x - a.x),
        nx: -(b.y - a.y) / SEG[i],
        ny: (b.x - a.x) / SEG[i],
      };
    }
    x -= SEG[i];
  }
  const last = WP[WP.length - 1];
  return { x: last.x, y: last.y, ang: 0, nx: 0, ny: 0 };
}

/** Where the lane ends — the thing you are defending. */
export function exitPoint() {
  return WP[WP.length - 1];
}

/** Grid cell under a pointer event. */
export function cellOf(ev) {
  const box = canvas.getBoundingClientRect();
  return {
    c: Math.floor((ev.clientX - box.left) / cell),
    r: Math.floor((ev.clientY - box.top) / cell),
  };
}

/** Rescales live entities after a resize so positions stay proportional. */
export function rescaleEntities(prevTotal, threats) {
  if (!S || prevTotal <= 0) return;
  const k = TOTAL / prevTotal;
  for (const f of S.foes) {
    f.d *= k;
    f.spd = threats[f.k].spd * cell;
    if (f.tr) f.tr.length = 0;
  }
  for (const t of S.towers) {
    t.x = (t.c + 0.5) * cell;
    t.y = (t.r + 0.5) * cell;
  }
  S.shots.length = 0;
  S.parts.length = 0;
  S.fx.length = 0;
  S.floats.length = 0;
  S.sludge.length = 0;
}
