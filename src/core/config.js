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

/**
 * How much of the wave's health curve a boss carries.
 *
 * Boss health is written flat in `threats.js` because a boss arrives on one
 * fixed wave, but the campaign's curve climbs past ×9 and a flat boss at the
 * end of it is a speed bump between two harder ordinary waves. A share of the
 * curve keeps each boss the wall its wave is built around.
 *
 * It has to stay under half. At half, every boss from the audit onwards
 * simply outlived its own walk down the lane — measured, the only things
 * reaching the end of a cleared campaign were the three bosses themselves,
 * which is a fixed tax on the run rather than a fight you can win. At 0.42
 * the first pilot review lands at ×1.16 and the rogue agent at ×4.41.
 */
export const BOSS_HP_SHARE = 0.42;

/** Per-level tower scaling. */
export const LEVEL_DAMAGE = 1.55;
export const LEVEL_RANGE = 1.1;
export const LEVEL_RATE = 0.9;

/**
 * Focus paid per kill, as a fraction of a threat's listed bounty.
 *
 * This is the difficulty knob that does not show up in a briefing, and it is
 * the one that decides whether a wave is a fight. A board of forty defences
 * at level three puts out something like 2000 damage a second, which is more
 * than any wave can survive; what stops you owning that board is being able
 * to afford it. At full bounty the campaign paid for it twice over by wave
 * fifteen and every wave after that was a formality, so the payout is set
 * well under one: you can build wide, or you can build tall, and until very
 * late you cannot do both.
 *
 * Raise it and the game gets easier far faster than the health curve makes it
 * harder. Check any change with `node scripts/balance.mjs 25 200`.
 */
export const BOUNTY_RATE = 0.38;

/**
 * Threat health scaling, as a curve rather than a straight line.
 *
 * A wave is worth `1 + (w-1) * WAVE_HP_SCALE + (w-1)^2 * WAVE_HP_ACCEL`, plus
 * a further +8% for every wave past the campaign.
 *
 * Almost all of it is in the squared term, and deliberately. Volume cannot
 * carry difficulty on its own — a threat pays a bounty when it dies, so a
 * bigger wave part-funds the board that answers it, and past a point the
 * board runs out of plots rather than money. Health pays nothing, so it is
 * the term that actually decides whether a wave is a fight.
 *
 * Keeping the linear term small is what leaves era one learnable while the
 * finale is nine times the base: a defence you place on wave two is still
 * worth placing on wave four, and worth nothing on its own by wave twenty.
 *
 *   wave  1  ×1.00      wave 12  ×2.99
 *   wave  4  ×1.26      wave 16  ×4.45
 *   wave  8  ×1.94      wave 20  ×6.28
 *   wave 10  ×2.42      wave 25  ×9.11
 *
 * `S.endless` counts waves, not laps, so the endless figure is per wave too,
 * and it stacks on top of a curve that is already climbing steeply by then —
 * which is why it is smaller than it looks. At +75% it reached four times the
 * campaign's finale within ten waves and ended the run whatever you built,
 * which is a wall rather than an endless mode.
 */
export const WAVE_HP_SCALE = 0.05;
export const WAVE_HP_ACCEL = 0.012;
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
