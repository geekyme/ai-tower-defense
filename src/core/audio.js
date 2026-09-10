import { getPref, setPref } from './storage.js';

/**
 * Tiny WebAudio blip synth. No files, no library — every sound is one
 * oscillator with a decaying gain envelope.
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

/** Browsers only allow audio after a gesture; call this from a pointer handler. */
export function unlockAudio() {
  if (!enabled || ac) return;
  tone(880, 0.02, 'sine', 0.008);
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
  if (!ac) {
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      return;
    }
  }
  if (ac.state === 'suspended') ac.resume();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type || 'square';
  osc.frequency.setValueAtTime(freq, ac.currentTime);
  if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(30, to), ac.currentTime + dur);
  gain.gain.setValueAtTime(0.0001, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(vol || 0.05, ac.currentTime + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + dur + 0.03);
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
  unlock() { [660, 880, 1175].forEach((f, i) => setTimeout(() => tone(f, 0.18, 'sine', 0.045), i * 90)); },
  win() { [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => tone(f, 0.24, 'sine', 0.055), i * 110)); },
};
