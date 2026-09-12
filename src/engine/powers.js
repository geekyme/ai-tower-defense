import { S } from '../core/state.js';
import { cell } from '../core/view.js';
import { sfx } from '../core/audio.js';
import { emit } from '../core/bus.js';
import { burst, say, flash, shake, fx, pulse } from './effects.js';

/**
 * Boss abilities, fired on a cooldown from `stepFoes`. Each one attacks the
 * player's board rather than their sanity, which is why clustering defences
 * stops working from era three onwards.
 */

function nearestTower(x, y, radiusCells) {
  let best = null, bd = Infinity;
  for (const t of S.towers) {
    const d = Math.hypot(t.x - x, t.y - y);
    if (radiusCells && d > radiusCells * cell) continue;
    if (d < bd) { bd = d; best = t; }
  }
  return best;
}

/**
 * Applies `fn` to each tower in range, at most once per threat per tower, and
 * at most `max` towers over the threat's whole walk down the lane.
 *
 * The cap is what makes the count in a wave mean anything. These effects mark
 * every defence they pass, so without one their cost is not the number of
 * threats but the length of the lane: twenty pagers walking the board end to
 * end leave every tower stunned for the whole wave, and no board answers that
 * because no board is firing. Capped, a wave with twice as many of them is
 * twice as bad rather than absolutely bad, and killing them early is worth
 * something.
 */
export function touchTowers(f, radiusCells, max, fn) {
  if (f.took >= max) return;
  for (const t of S.towers) {
    if (f.marked.has(t)) continue;
    if (Math.hypot(t.x - f.x, t.y - f.y) < cell * radiusCells) {
      f.marked.add(t);
      if (fn(t) !== false && ++f.took >= max) return;
    }
  }
}

export function removeTower(t) {
  S.towers = S.towers.filter(x => x !== t);
  emit('tower:removed', { tower: t });
}

function freeze(f) {
  let n = 0;
  for (const t of S.towers) {
    if (Math.hypot(t.x - f.x, t.y - f.y) < cell * 3.7) {
      t.stunT = Math.max(t.stunT, 4.2);
      t.kind = 'freeze';
      n++;
    }
  }
  if (!n) return;
  pulse(f.x, f.y, cell * 3.7, '#ffd84b', 0.7);
  say(f.x, f.y - cell, 'budget freeze', '#ffd84b', cell * 0.32);
  sfx.power();
  shake(8);
  flash('#ffd84b', 0.25);
}

function destroy(f) {
  const t = nearestTower(f.x, f.y, 4.6);
  if (!t) {
    say(f.x, f.y - cell, 'nothing to audit', '#5c8dff', cell * 0.28);
    return;
  }
  removeTower(t);
  S.lost++;
  burst(t.x, t.y, '#5c8dff', 30, cell * 3.6, 0.7);
  fx({ k: 'shock', x: t.x, y: t.y, l: 0.5, m: 0.5, r: cell * 1.8, c: '#5c8dff' });
  fx({ k: 'wreck', x: t.x, y: t.y, l: 2.8, m: 2.8, c: '#5c8dff' });
  say(t.x, t.y - cell * 0.5, 'non-compliant', '#5c8dff', cell * 0.3);
  sfx.wreck();
  shake(14);
  flash('#5c8dff', 0.32);
}

function hijack(f) {
  const closest = S.towers
    .slice()
    .sort((a, b) => Math.hypot(a.x - f.x, a.y - f.y) - Math.hypot(b.x - f.x, b.y - f.y))
    .slice(0, 3);
  for (const t of closest) {
    t.stunT = Math.max(t.stunT, 6);
    t.kind = 'hijack';
  }
  if (!closest.length) return;
  pulse(f.x, f.y, cell * 5, '#ff3b6b', 0.7);
  say(f.x, f.y - cell, 'ignore previous instructions', '#ff3b6b', cell * 0.28);
  sfx.power();
  shake(9);
  flash('#ff3b6b', 0.3);
}

/**
 * Levels are the only thing a boss takes that does not come back on its own,
 * and this is the only power that takes them. Uncapped it stripped every
 * defence within four cells on every cooldown, which over a boss's walk down
 * the lane is the whole board: eight sweeps later you own forty level-one
 * towers and no campaign's income buys that back. Capped, it is something you
 * play around instead of a tax — three levels a sweep, taken nearest first,
 * and how many sweeps you eat is how long you let the boss walk.
 */
const DOWNGRADE_MAX = 3;

function downgrade(f) {
  const hit = S.towers
    .filter(t => t.lv > 1 && Math.hypot(t.x - f.x, t.y - f.y) < cell * 4.2)
    .sort((a, b) => Math.hypot(a.x - f.x, a.y - f.y) - Math.hypot(b.x - f.x, b.y - f.y))
    .slice(0, DOWNGRADE_MAX);
  for (const t of hit) {
    t.lv--;
    pulse(t.x, t.y, cell * 0.9, '#a379ff', 0.5);
  }
  say(f.x, f.y - cell, hit.length ? 'restructured' : 'nothing left to cut', '#a379ff', cell * 0.3);
  if (!hit.length) return;
  sfx.power();
  shake(10);
  flash('#a379ff', 0.3);
}

export const POWERS = { freeze, destroy, hijack, downgrade };
