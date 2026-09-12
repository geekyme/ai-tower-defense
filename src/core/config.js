/** Tunables and board geometry. Nothing here reads or writes game state. */

export const COLS = 9;
export const ROWS = 14;

/** Lane waypoints in grid coordinates. -1 and 9 sit off-board so threats
 *  walk in from outside the canvas and leave through the far edge. */
export const WAYPOINTS = [
  [-1, 1], [7, 1], [7, 4], [1, 4], [1, 7], [7, 7], [7, 10], [1, 10], [1, 12], [9, 12],
];

export const START_FOCUS = 300;
/**
 * Sanity is the leak budget, so it has to be read against how much is walking
 * in. Waves now carry two to three times the threats they used to and the
 * board has a fixed number of plots, so a 16 that used to survive an unlucky
 * stretch ended the run on the first one. 26 keeps roughly the old proportion
 * of a wave you are allowed to drop.
 */
export const START_SANITY = 26;
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

/**
 * Focus paid per kill, as a fraction of a threat's listed bounty.
 *
 * Bounties are written per threat and a wave now carries two to three times
 * the threats it used to, so paying them in full handed over two to three
 * times the income for the same board: by the middle of the campaign there
 * was nothing left to buy and every later decision was free. Scaling the
 * payout back keeps a wave's income close to what one plot and one upgrade
 * cost, which is what makes the build phase a choice.
 */
export const BOUNTY_RATE = 0.65;

/**
 * Threat health scaling, as a curve rather than a straight line.
 *
 * A wave is worth `1 + (w-1) * WAVE_HP_SCALE + (w-1)^2 * WAVE_HP_ACCEL`, plus
 * a further +8% for every wave past the campaign.
 *
 * The linear term is deliberately gentler than the volume it now arrives in:
 * a wave carries two to three times the threats it used to, so pushing health
 * at the old rate on top of that would make era one unwinnable rather than
 * busy. The squared term is what makes the back half hurt — it is almost
 * nothing before wave ten and it is most of the multiplier by wave twenty
 * five, so the campaign opens as a crowd you can out-build and closes as one
 * you cannot.
 *
 *   wave  1  ×1.00      wave 15  ×2.32
 *   wave  5  ×1.27      wave 20  ×3.06
 *   wave 10  ×1.72      wave 25  ×3.93
 *
 * `S.endless` counts waves, not laps, so the endless figure is per wave too,
 * and it stacks on top of a curve that is already climbing steeply by then —
 * which is why it is smaller than it looks. At +75% it reached four times the
 * campaign's finale within ten waves and ended the run whatever you built,
 * which is a wall rather than an endless mode.
 */
export const WAVE_HP_SCALE = 0.055;
export const WAVE_HP_ACCEL = 0.0028;
export const ENDLESS_HP_SCALE = 0.08;

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
