import { S } from '../core/state.js';
import { cell, at, TOTAL, exitPoint } from '../core/view.js';
import { sfx } from '../core/audio.js';
import { emit } from '../core/bus.js';
import { spawn, scale } from './spawn.js';
import { POWERS, touchTowers } from './powers.js';
import { say, flash, shake, pulse } from './effects.js';

const MAX_SLUDGE = 26;
/**
 * How many defences one threat can take down with it on its walk.
 *
 * See `touchTowers`: uncapped, these scale with the length of the lane rather
 * than with the count in the wave, and a wave carrying twenty of them is not
 * harder, it is unplayable — twenty pagers walking the board end to end leave
 * every defence stunned for the whole wave, and no board answers that because
 * no board is firing. Attrition is lowest because what it takes does not come
 * back when the threat dies.
 */
const TAKES = { attrition: 2, sunset: 4, hijack: 4, page: 5 };

/** Per-threat behaviour that fires every frame, before movement. */
function tickBehaviour(f, D, dt) {
  if (f.fl > 0) f.fl -= dt;
  if (f.revT > 0) f.revT -= dt;

  if (D.regen && f.hp < f.max) f.hp = Math.min(f.max, f.hp + D.regen * dt * scale());
  if (D.heal && f.hp < f.max) f.hp = Math.min(f.max, f.hp + D.heal * dt);
  if (D.grow) {
    f.max += D.grow * dt;
    f.hp = Math.min(f.max, f.hp + D.grow * dt);
  }
  if (f.shMax) {
    f.shT += dt;
    if (f.shT > 3 && f.shield < f.shMax) f.shield = Math.min(f.shMax, f.shield + f.shMax * 0.085 * dt);
  }
  if (D.drain) S.focus = Math.max(0, S.focus - D.drain * dt);
  if (D.accel) f.acc = Math.min(2.0, f.acc + D.accel * dt);

  if (D.spawn) {
    f.sT -= dt;
    if (f.sT <= 0) {
      f.sT = D.spawn[1];
      spawn(D.spawn[0], Math.max(0, f.d - cell * 0.5));
    }
  }

  if (D.power) {
    f.pT -= dt;
    if (f.pT <= 0) {
      f.pT = D.pcd;
      POWERS[D.power](f);
    }
  }

  // Bosses that replicate as their health crosses fixed thresholds.
  if (D.phases) {
    const p = f.hp / f.max;
    while (f.phase < D.phases.length && p < D.phases[f.phase]) {
      f.phase++;
      for (let i = 0; i < 4; i++) spawn('subagent', Math.max(0, f.d - cell * 0.4 * i));
      spawn('hallu', Math.max(0, f.d - cell * 0.6));
      spawn('inject', Math.max(0, f.d - cell * 0.9));
      say(f.x, f.y - cell, 'replicating', '#ff3b6b', cell * 0.32);
      pulse(f.x, f.y, cell * 4, '#ff3b6b', 0.7);
      shake(11);
    }
  }

  if (D.sludge) {
    f.slT -= dt;
    if (f.slT <= 0) {
      f.slT = 0.9;
      if (S.sludge.length < MAX_SLUDGE) S.sludge.push({ x: f.x, y: f.y, r: cell * 1.05, l: 7, m: 7 });
    }
  }

  // Threats that attack defences by walking past them.
  if (D.sunset) {
    touchTowers(f, 1.3, TAKES.sunset, t => {
      t.stunT = Math.max(t.stunT, 5);
      t.kind = 'sunset';
      say(t.x, t.y - cell * 0.5, 'sunset', '#ff7a3c', cell * 0.26);
    });
  }
  if (D.hijack) {
    touchTowers(f, 1.2, TAKES.hijack, t => {
      t.stunT = Math.max(t.stunT, 4);
      t.kind = 'hijack';
      say(t.x, t.y - cell * 0.5, 'injected', '#ff4d7a', cell * 0.26);
    });
  }
  if (D.page) {
    touchTowers(f, 1.2, TAKES.page, t => {
      t.stunT = Math.max(t.stunT, 2.5);
      t.kind = 'paged';
      say(t.x, t.y - cell * 0.5, 'paged', '#ff9f43', cell * 0.26);
    });
  }
  if (D.attrition) {
    // A defence already at base level costs the threat nothing: returning
    // false keeps its budget for one it can actually take a level from.
    touchTowers(f, 1.3, TAKES.attrition, t => {
      if (t.lv <= 1) return false;
      t.lv--;
      say(t.x, t.y - cell * 0.5, 'they left', '#ffd0a0', cell * 0.26);
      pulse(t.x, t.y, cell * 0.9, '#ffd0a0', 0.5);
    });
  }
}

function reachYou(f, D) {
  f.dead = true;
  S.sanity -= D.dmg;
  S.leaked++;
  shake(D.dmg * 2.4);
  sfx.leak();
  flash('#ff3b4e', 0.3);
  const exit = exitPoint();
  say(exit.x - cell, exit.y - cell * 0.6, '-' + D.dmg, '#ff6b6b', cell * 0.4);
  if (S.boss === f) S.boss = null;
  if (S.sanity <= 0) {
    S.sanity = 0;
    emit('run:lost', {});
  }
}

export function stepFoes(dt) {
  for (const f of S.foes) {
    if (f.dead) continue;
    const D = f.def;

    tickBehaviour(f, D, dt);

    let sp = f.spd * (1 + (f.acc || 0));
    if (f.stunT > 0) {
      f.stunT -= dt;
      sp = 0;
    } else if (f.slowT > 0) {
      f.slowT -= dt;
      sp *= 1 - f.slowA;
    }

    f.d += sp * dt;
    f.w += dt * 6;

    const p = at(f.d);
    let ox = 0, oy = 0;
    if (D.weave) {
      const s = Math.sin(f.w * 1.4) * cell * D.weave;
      ox = p.nx * s;
      oy = p.ny * s;
    }
    f.x = p.x + ox;
    f.y = p.y + oy;
    f.ang = p.ang;

    if (D.spd >= 2.0) {
      f.tr.push({ x: f.x, y: f.y });
      if (f.tr.length > 5) f.tr.shift();
    }

    if (f.d >= TOTAL) reachYou(f, D);
  }

  S.foes = S.foes.filter(f => !f.dead);

  for (const s of S.sludge) s.l -= dt;
  S.sludge = S.sludge.filter(s => s.l > 0);
}
