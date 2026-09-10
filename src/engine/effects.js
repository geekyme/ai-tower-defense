import { S } from '../core/state.js';
import { cell, W } from '../core/view.js';

/**
 * Queues cosmetic effects onto the run state. These only push records —
 * `render/` decides what they look like.
 */

const MAX_PARTICLES = 360;

export function burst(x, y, colour, count, speed, life) {
  for (let i = 0; i < count; i++) {
    if (S.parts.length > MAX_PARTICLES) return;
    const a = Math.random() * 6.283;
    const s = speed * (0.35 + Math.random());
    S.parts.push({
      x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
      l: life || 0.5, m: life || 0.5, c: colour, r: 1 + Math.random() * 2.4,
    });
  }
}

/** Floating combat text. */
export function say(x, y, txt, colour, size) {
  S.floats.push({ x, y, txt, c: colour, l: 1, sz: size || cell * 0.3 });
}

/** Full-screen colour wash. */
export function flash(colour, secs) {
  S.flashCol = colour;
  S.flashT = secs || 0.3;
}

export function shake(amount) {
  S.shake = Math.max(S.shake, amount);
}

export function fx(record) {
  S.fx.push(record);
}

export function pulse(x, y, radius, colour, life) {
  S.fx.push({ k: 'pulse', x, y, l: life || 0.45, m: life || 0.45, r: radius, c: colour });
}

export function shock(x, y, radius, colour, life) {
  S.fx.push({ k: 'shock', x, y, l: life || 0.42, m: life || 0.42, r: radius, c: colour });
}

export function banner(txt, sub, secs) {
  S.banner = { txt, sub, l: secs || 2.8 };
}

/**
 * The wave-clear card: a big centred title that pops in, holds, and fades.
 * `lines` are the smaller rows under it.
 */
export function cheer(txt, sub, lines, secs) {
  const life = secs || 2.6;
  S.cheer = { txt, sub, lines: lines || [], l: life, m: life };
}

/** Paper ribbons that fall and spin. Cosmetic only, like everything here. */
export function confetti(count, colours) {
  for (let i = 0; i < count; i++) {
    if (S.conf.length > MAX_PARTICLES) return;
    const life = 1.6 + Math.random() * 1.4;
    S.conf.push({
      x: Math.random() * W,
      y: -cell * (0.2 + Math.random() * 2.2),
      vx: (Math.random() - 0.5) * cell * 2.4,
      vy: cell * (1.2 + Math.random() * 1.6),
      g: cell * 2.2,
      d: 0.995,
      spin: (Math.random() - 0.5) * 9,
      a: Math.random() * 6.283,
      sq: cell * (0.12 + Math.random() * 0.12),
      l: life, m: life,
      c: colours[(Math.random() * colours.length) | 0],
      r: 1,
    });
  }
}
