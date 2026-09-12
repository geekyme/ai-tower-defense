import { THREATS, MIMIC_POOL } from '../data/threats.js';
import { WAVE_HP_SCALE, WAVE_HP_ACCEL, ENDLESS_HP_SCALE, BOUNTY_RATE, BOSS_HP_SHARE }
  from '../core/config.js';
import { S } from '../core/state.js';
import { cell, at } from '../core/view.js';
import { sfx } from '../core/audio.js';
import { flash, shake } from './effects.js';

/** Health multiplier for the current wave. Bosses use a gentler curve. */
export function scale() {
  const w = S.wave - 1;
  return 1 + w * WAVE_HP_SCALE + w * w * WAVE_HP_ACCEL + S.endless * ENDLESS_HP_SCALE;
}

/**
 * Puts a threat on the lane.
 * @param {string} key   key into THREATS
 * @param {number} [d]   distance along the lane to start at
 */
export function spawn(key, d) {
  const D = THREATS[key];
  // Bosses take half the wave curve, so the finale is still a finale.
  const mult = D.boss ? 1 + (scale() - 1) * BOSS_HP_SHARE + S.endless * 0.8 : scale();

  const f = {
    k: key,
    def: D,
    hp: D.hp * mult,
    max: D.hp * mult,
    d: d || 0,
    spd: D.spd * cell,
    b: Math.max(1, Math.round(D.b * BOUNTY_RATE * (1 + S.endless * 0.2))),

    // status
    slowT: 0, slowA: 0, stunT: 0, revT: 0, acc: 0,
    shield: 0, shMax: 0, shT: 0,

    // timers
    took: 0,
    sT: D.spawn ? D.spawn[1] : 0,
    pT: D.pcd || 0,
    slT: 0,

    // presentation
    w: Math.random() * 6, fl: 0, tr: [], dead: false,
    phase: 0,
    marked: new Set(),
    shown: !D.mimic,
    mim: D.mimic ? MIMIC_POOL[Math.floor(Math.random() * MIMIC_POOL.length)] : null,
  };

  if (D.shield) {
    f.shield = D.shield * mult;
    f.shMax = f.shield;
  }

  const p = at(f.d);
  f.x = p.x;
  f.y = p.y;
  f.ang = p.ang;
  S.foes.push(f);

  if (D.boss) {
    S.boss = f;
    sfx.boss();
    shake(13);
    flash(D.c, 0.55);
  }
  return f;
}
