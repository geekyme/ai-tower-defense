/** Tunables and board geometry. Nothing here reads or writes game state. */

export const COLS = 9;
export const ROWS = 14;

/** Lane waypoints in grid coordinates. -1 and 9 sit off-board so threats
 *  walk in from outside the canvas and leave through the far edge. */
export const WAYPOINTS = [
  [-1, 1], [7, 1], [7, 4], [1, 4], [1, 7], [7, 7], [7, 10], [1, 10], [1, 12], [9, 12],
];

export const START_FOCUS = 300;
export const START_SANITY = 16;
/** Seconds of build time before a wave auto-starts. */
export const BUILD_TIME = 18;
/** Focus refunded per second of unused build time when you call the wave early. */
export const BANK_RATE = 4;

export const MAX_TOWER_LEVEL = 3;
export const SELL_REFUND = 0.45;
/** Upgrade cost = base cost * UPGRADE_COST_FACTOR * current level. */
export const UPGRADE_COST_FACTOR = 0.9;

/** Per-level tower scaling. */
export const LEVEL_DAMAGE = 1.55;
export const LEVEL_RANGE = 1.1;
export const LEVEL_RATE = 0.9;

/** Threat health scaling: +8.5% per wave, +75% per endless lap. */
export const WAVE_HP_SCALE = 0.085;
export const ENDLESS_HP_SCALE = 0.75;

/** Cell keys covered by the lane, so nothing can be built on it. */
export const pathKeys = (() => {
  const keys = new Set();
  for (let i = 0; i < WAYPOINTS.length - 1; i++) {
    const [ax, ay] = WAYPOINTS[i];
    const [bx, by] = WAYPOINTS[i + 1];
    const dx = Math.sign(bx - ax), dy = Math.sign(by - ay);
    let x = ax, y = ay;
    while (x !== bx || y !== by) {
      if (x >= 0 && x < COLS) keys.add(x + ',' + y);
      x += dx; y += dy;
    }
    if (bx >= 0 && bx < COLS) keys.add(bx + ',' + by);
  }
  return keys;
})();

export function isLane(c, r) {
  return pathKeys.has(c + ',' + r);
}
