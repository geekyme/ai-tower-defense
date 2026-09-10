import { TOWERS } from '../data/towers.js';
import {
  COLS, ROWS, isLane, MAX_TOWER_LEVEL, SELL_REFUND, UPGRADE_COST_FACTOR,
  LEVEL_DAMAGE, LEVEL_RANGE, LEVEL_RATE,
} from '../core/config.js';
import { S } from '../core/state.js';
import { cell } from '../core/view.js';
import { sfx } from '../core/audio.js';
import { hurt } from './damage.js';
import { removeTower } from './powers.js';
import { burst, say, shake, fx, pulse, shock } from './effects.js';

/** Cooldown multiplier while a tower stands in data-swamp sludge. */
const SLUDGE_PENALTY = 1.7;
/** Cooldown multiplier while a power-budget threat is nearby. */
const POWER_PENALTY = 1.8;
/** How far a chain can jump between targets, in cells. */
const CHAIN_REACH = 2.5;

export function towerAt(c, r) {
  return S.towers.find(t => t.c === c && t.r === r);
}

export function canBuild(c, r) {
  return c >= 0 && c < COLS && r >= 0 && r < ROWS && !isLane(c, r) && !towerAt(c, r);
}

/**
 * Effective stat for a tower at its current level, including live debuffs.
 * @param {'dmg'|'range'|'rate'} which
 */
export function stat(t, which) {
  const d = t.def;
  const lv = t.lv - 1;
  if (which === 'dmg') return d.dmg * Math.pow(LEVEL_DAMAGE, lv);
  if (which === 'range') return d.range * Math.pow(LEVEL_RANGE, lv) * cell;
  if (which === 'rate') {
    let rate = d.rate * Math.pow(LEVEL_RATE, lv);
    for (const s of S.sludge) {
      if (Math.hypot(s.x - t.x, s.y - t.y) < s.r) { rate *= SLUDGE_PENALTY; break; }
    }
    for (const f of S.foes) {
      if (f.def.towerSlow && !f.dead && Math.hypot(f.x - t.x, f.y - t.y) < cell * 3) {
        rate *= POWER_PENALTY;
        break;
      }
    }
    return rate;
  }
  return 0;
}

export function upgradeCost(t) {
  return Math.round(t.def.cost * UPGRADE_COST_FACTOR * t.lv);
}

export function sellValue(t) {
  return Math.floor(t.spent * SELL_REFUND);
}

/** The tower record, in one place: built here, paid for by the caller. */
function makeTower(key, c, r, lv, spent) {
  const d = TOWERS[key];
  return {
    key, def: d, c, r,
    x: (c + 0.5) * cell, y: (r + 0.5) * cell,
    lv, cd: d.rate, ang: -1.5708,
    spent, rec: 0, stunT: 0, kind: '', spin: Math.random() * 6,
  };
}

/** Puts a defence back on the board as it was, free. See `checkpoint.js`. */
export function reviveTower({ key, c, r, lv, spent }) {
  if (!TOWERS[key] || !canBuild(c, r)) return;
  S.towers.push(makeTower(key, c, r, lv, spent));
}

export function placeTower(key, c, r) {
  const d = TOWERS[key];
  if (S.focus < d.cost) return false;
  S.focus -= d.cost;
  S.towers.push(makeTower(key, c, r, 1, d.cost));
  sfx.build();
  burst((c + 0.5) * cell, (r + 0.5) * cell, d.col, 12, cell * 2, 0.4);
  pulse((c + 0.5) * cell, (r + 0.5) * cell, d.range * cell, d.col);
  return true;
}

export function upgradeTower(t) {
  if (!t || t.lv >= MAX_TOWER_LEVEL) return false;
  const cost = upgradeCost(t);
  if (S.focus < cost) return false;
  S.focus -= cost;
  t.lv++;
  t.spent += cost;
  burst(t.x, t.y, t.def.col, 16, cell * 2.4, 0.5);
  sfx.build();
  say(t.x, t.y - cell * 0.55, 'level ' + t.lv, t.def.col, cell * 0.3);
  pulse(t.x, t.y, stat(t, 'range'), t.def.col);
  return true;
}

export function sellTower(t) {
  if (!t) return;
  S.focus += sellValue(t);
  burst(t.x, t.y, '#7d92b5', 12, cell * 2, 0.4);
  removeTower(t);
}

/** Furthest-along valid target in range. Cloaked and AoE-immune rules live here. */
function target(t, range, kind) {
  let best = null, bd = -1;
  for (const f of S.foes) {
    if (f.dead) continue;
    if (f.def.cloak && f.revT <= 0) continue;
    if (f.def.noAoE && (kind === 'chain' || kind === 'nova')) continue;
    const dx = f.x - t.x, dy = f.y - t.y;
    if (dx * dx + dy * dy <= range * range && f.d > bd) { bd = f.d; best = f; }
  }
  return best;
}

function fireBeam(t, d, dmg, tg, mx, my) {
  fx({ k: 'beam', x1: mx, y1: my, x2: tg.x, y2: tg.y, l: 0.2, m: 0.2, c: d.col });
  hurt(tg, dmg, d);
  burst(tg.x, tg.y, d.col, 7, cell * 2.4, 0.35);
  sfx.hit();
}

function fireNova(t, d, dmg, tg) {
  const rad = d.nova * cell;
  shock(tg.x, tg.y, rad, d.col, 0.5);
  pulse(tg.x, tg.y, rad, d.col);
  for (const f of S.foes) {
    if (f.dead || f.def.noAoE) continue;
    if (Math.hypot(f.x - tg.x, f.y - tg.y) > rad) continue;
    hurt(f, dmg, d);
    if (!f.dead && !f.def.boss) f.stunT = Math.max(f.stunT, d.stun);
  }
  burst(tg.x, tg.y, d.col, 24, cell * 4, 0.5);
  shake(5);
  sfx.nova();
}

function fireChain(t, d, dmg, tg, mx, my) {
  let cur = tg, px = mx, py = my, hit = dmg;
  const used = [cur];
  for (let i = 0; i < d.chain; i++) {
    fx({ k: 'bolt', x1: px, y1: py, x2: cur.x, y2: cur.y, l: 0.2, m: 0.2, c: d.col, s: Math.random() * 99 });
    hurt(cur, hit, d);
    hit *= d.falloff;
    px = cur.x;
    py = cur.y;

    let next = null, nd = cell * CHAIN_REACH;
    for (const f of S.foes) {
      if (f.dead || used.includes(f) || f.def.noAoE) continue;
      if (f.def.cloak && f.revT <= 0) continue;
      const q = Math.hypot(f.x - px, f.y - py);
      if (q < nd) { nd = q; next = f; }
    }
    if (!next) break;
    cur = next;
    used.push(cur);
  }
  sfx.hit();
}

export function stepTowers(dt) {
  for (const t of S.towers) {
    t.spin += dt * (t.key === 'observ' ? 0.9 : 0.35);

    if (t.stunT > 0) {
      t.stunT -= dt;
      t.cd = Math.max(t.cd, 0.25);
      continue;
    }

    const range = stat(t, 'range');

    // Observability is the only thing that can uncloak Shadow AI.
    if (t.def.reveal) {
      for (const f of S.foes) {
        if (f.def.cloak && Math.hypot(f.x - t.x, f.y - t.y) < range) f.revT = 0.4;
      }
    }

    t.cd -= dt;
    if (t.rec > 0) t.rec -= dt * 5;

    const tg = target(t, range, t.def.kind);
    if (!tg) continue;

    const want = Math.atan2(tg.y - t.y, tg.x - t.x);
    t.ang += (((want - t.ang + 9.4248) % 6.28318) - Math.PI) * Math.min(1, dt * 14);
    if (t.cd > 0) continue;

    t.cd = stat(t, 'rate');
    t.rec = 1;
    const d = t.def;
    const dmg = stat(t, 'dmg');
    const mx = t.x + Math.cos(t.ang) * cell * 0.36;
    const my = t.y + Math.sin(t.ang) * cell * 0.36;
    fx({ k: 'muzzle', x: mx, y: my, ang: t.ang, l: 0.09, m: 0.09, c: d.col });
    sfx.shoot();

    if (d.kind === 'beam') fireBeam(t, d, dmg, tg, mx, my);
    else if (d.kind === 'nova') fireNova(t, d, dmg, tg);
    else if (d.kind === 'chain') fireChain(t, d, dmg, tg, mx, my);
    else {
      S.shots.push({
        x: mx, y: my, tg, dmg, c: d.col, v: d.vel * cell,
        sp: d.splash ? d.splash * cell : 0,
        slow: d.slow || 0, sd: d.slowDur || 0,
        src: d, r: d.splash ? cell * 0.17 : cell * 0.09, tr: [],
      });
    }
  }
}

function land(f, s) {
  hurt(f, s.dmg, s.src);
  if (s.slow && !f.def.slowProof && !f.dead) {
    f.slowT = s.sd;
    f.slowA = Math.max(f.slowA, s.slow);
  }
}

export function stepShots(dt) {
  for (const s of S.shots) {
    // Projectiles keep flying to where the target was if it dies mid-flight.
    const tx = s.tg && !s.tg.dead ? s.tg.x : s.lx;
    const ty = s.tg && !s.tg.dead ? s.tg.y : s.ly;
    if (tx === undefined) { s.dead = true; continue; }
    s.lx = tx;
    s.ly = ty;

    const dx = tx - s.x, dy = ty - s.y;
    const dist = Math.hypot(dx, dy);
    const step = s.v * dt;

    s.tr.push({ x: s.x, y: s.y });
    if (s.tr.length > 6) s.tr.shift();

    if (dist > step) {
      s.x += (dx / dist) * step;
      s.y += (dy / dist) * step;
      continue;
    }

    s.dead = true;
    if (s.sp) {
      shock(tx, ty, s.sp, s.c, 0.32);
      for (const f of S.foes) {
        if (!f.dead && !f.def.noAoE && Math.hypot(f.x - tx, f.y - ty) <= s.sp) land(f, s);
      }
      burst(tx, ty, s.c, 13, cell * 3, 0.4);
    } else if (s.tg && !s.tg.dead) {
      land(s.tg, s);
      burst(tx, ty, s.c, 5, cell * 1.8, 0.28);
    }
    sfx.hit();
  }
  S.shots = S.shots.filter(s => !s.dead);
}
