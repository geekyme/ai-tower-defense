import { S } from '../core/state.js';
import { cell } from '../core/view.js';
import { sfx } from '../core/audio.js';
import { spawn } from './spawn.js';
import { burst, say, flash, shake, fx } from './effects.js';

/** Damage taken from a defence the "eval gap" is blind to. */
const EVAL_GAP_RESIST = 0.35;
/** Focus bonus for killing a boss, on top of its bounty. */
const BOSS_BOUNTY = 180;

/** Strongest damage reduction aura covering this threat, if any. */
function auraReduction(f) {
  let dr = 0;
  for (const o of S.foes) {
    if (o === f || o.dead || !o.def.aura) continue;
    if (Math.hypot(o.x - f.x, o.y - f.y) < cell * 2.2) dr = Math.max(dr, o.def.aura);
  }
  return dr;
}

/**
 * Applies damage, resolving every mitigation in a fixed order:
 * family bonus, eval-gap resist, protective aura, armour, then shield.
 *
 * @param {object} f    threat
 * @param {number} amt  raw damage
 * @param {object} src  the tower definition that dealt it
 */
export function hurt(f, amt, src) {
  if (f.dead) return;
  let d = amt;

  if (src && src.bonusFam && f.def.fam === src.bonusFam) d *= src.bonus;
  if (f.def.onlyEval && !(src && src.key === 'evalsuite')) d *= EVAL_GAP_RESIST;

  const dr = auraReduction(f);
  if (dr) d *= 1 - dr;

  if (f.def.armor) {
    const pierce = src && src.pierceArmor && !f.def.antiPierce;
    if (!pierce) d = Math.max(1, d - f.def.armor);
  }

  // AI washing drops its disguise the moment anything connects.
  if (!f.shown) {
    f.shown = true;
    f.spd *= 1.5;
    say(f.x, f.y - cell * 0.6, 'not actually AI', '#d8c4ff', cell * 0.28);
  }

  if (f.shield > 0) {
    f.shield -= d;
    f.shT = 0;
    f.fl = 0.1;
    if (f.shield < 0) {
      d = -f.shield;
      f.shield = 0;
    } else {
      return;
    }
  }

  f.hp -= d;
  f.fl = 0.12;
  if (f.hp <= 0) slay(f);
}

export function slay(f) {
  if (f.dead) return;
  f.dead = true;
  S.killed++;
  S.focus += f.b;

  say(f.x, f.y - cell * 0.5, '+' + f.b, '#35e6d5');
  burst(f.x, f.y, f.def.c, f.def.boss ? 52 : 11, cell * 3.4, 0.55);
  fx({ k: 'shock', x: f.x, y: f.y, l: 0.42, m: 0.42, r: cell * (f.def.boss ? 3.6 : 1.1), c: f.def.c });
  fx({ k: 'implode', x: f.x, y: f.y, l: 0.3, m: 0.3, r: cell * 1.4, c: f.def.c });
  sfx.die();

  if (f.def.split) {
    const [key, n] = f.def.split;
    for (let i = 0; i < n; i++) spawn(key, Math.max(0, f.d - cell * 0.3 * i));
  }

  if (f.def.boss) {
    shake(18);
    S.boss = null;
    flash('#fff', 0.45);
    S.focus += BOSS_BOUNTY;
  }
}
