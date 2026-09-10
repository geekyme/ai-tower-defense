import { THREATS, MIMIC_POOL } from '../data/threats.js';
import { WAVE_HP_SCALE, ENDLESS_HP_SCALE } from '../core/config.js';
import { S } from '../core/state.js';
import { cell, at } from '../core/view.js';
import { sfx } from '../core/audio.js';
import { flash, shake } from './effects.js';

/** Health multiplier for the current wave. Bosses use a gentler curve. */
export function scale() {
  return 1 + (S.wave - 1) * WAVE_HP_SCALE + S.endless * ENDLESS_HP_SCALE;
}

/**
 * Puts a threat on the lane.
 * @param {string} key   key into THREATS
 * @param {number} [d]   distance along the lane to start at
 */
export function spawn(key, d) {
  const D = THREATS[key];
  const mult = D.boss ? 1 + S.endless * 0.8 : scale();

  const f = {
    k: key,
    def: D,
    hp: D.hp * mult,
    max: D.hp * mult,
    d: d || 0,
    spd: D.spd * cell,
    b: Math.round(D.b * (1 + S.endless * 0.2)),

    // status
    slowT: 0, slowA: 0, stunT: 0, revT: 0, acc: 0,
    shield: 0, shMax: 0, shT: 0,

    // timers
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
