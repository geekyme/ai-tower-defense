import { getPref, setPref } from './storage.js';

/**
 * Tiny WebAudio blip synth. No files, no library — every sound is one
 * oscillator with a decaying gain envelope.
 *
 * The context is shared with `core/music.js`: one context per page is the
 * limit browsers actually enforce, so both go through `audioContext()`.
 */

let ac = null;
let enabled = getPref('sound') !== false;
let lastShot = 0;

export function soundEnabled() {
  return enabled;
}

export function toggleSound() {
  enabled = !enabled;
  setPref('sound', enabled);
  return enabled;
}

/** The shared AudioContext, created on first use. Null if the browser has none. */
export function audioContext() {
  if (ac) return ac;
  try {
    ac = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) {
    return null;
  }
  return ac;
}

/** Browsers only allow audio after a gesture; call this from a pointer handler. */
export function unlockAudio() {
  const c = audioContext();
  if (c && c.state === 'suspended') c.resume();
  return c;
}

/**
 * @param {number} freq   start frequency in Hz
 * @param {number} dur    seconds
 * @param {string} type   oscillator type
 * @param {number} vol    peak gain
 * @param {number} [to]   frequency to glide to over `dur`
 */
export function tone(freq, dur, type, vol, to) {
  if (!enabled) return;
  const c = audioContext();
  if (!c) return;
  if (c.state === 'suspended') c.resume();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type || 'square';
  osc.frequency.setValueAtTime(freq, c.currentTime);
  if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(30, to), c.currentTime + dur);
  gain.gain.setValueAtTime(0.0001, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(vol || 0.05, c.currentTime + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + dur + 0.03);
}

/** Plays `notes` as [freq, delayMs] pairs, so fanfares stay one-liners. */
function riff(notes, dur, type, vol) {
  for (const [f, at] of notes) setTimeout(() => tone(f, dur, type, vol), at);
}

export const sfx = {
  shoot() {
    const now = performance.now();
    if (now - lastShot < 60) return;
    lastShot = now;
    tone(700, 0.045, 'square', 0.016, 430);
  },
  hit() { tone(260, 0.045, 'triangle', 0.022, 160); },
  die() { tone(190, 0.14, 'sawtooth', 0.034, 70); },
  build() { tone(440, 0.09, 'sine', 0.055, 880); },
  leak() { tone(150, 0.32, 'sawtooth', 0.085, 52); },
  boss() {
    tone(66, 0.95, 'sawtooth', 0.1, 32);
    setTimeout(() => tone(99, 0.7, 'square', 0.055, 38), 170);
  },
  power() { tone(120, 0.5, 'sawtooth', 0.085, 700); },
  wreck() { tone(300, 0.5, 'square', 0.075, 45); },
  nova() { tone(90, 0.4, 'sine', 0.09, 600); },
  unlock() { riff([[660, 0], [880, 90], [1175, 180]], 0.18, 'sine', 0.045); },
  /** Wave cleared: a rising major fanfare with a shimmer on top. */
  clear() {
    riff([[523, 0], [659, 80], [784, 160], [1046, 240]], 0.26, 'triangle', 0.075);
    riff([[1568, 300], [2093, 400]], 0.34, 'sine', 0.035);
    tone(131, 0.5, 'sine', 0.06);
  },
  win() { riff([[523, 0], [659, 110], [784, 220], [1046, 330], [1318, 440]], 0.24, 'sine', 0.055); },
};
