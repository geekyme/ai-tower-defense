import { audioContext, soundEnabled } from './audio.js';
import { on } from './bus.js';

/**
 * The soundtrack. Like the blip synth next door it plays no files: a small
 * step sequencer schedules oscillators ahead of the clock, so the loop never
 * drifts and the tab can be backgrounded without it running away.
 *
 * Two moods, switched by the game's own events:
 *   calm    menus, briefings and the build phase — pad and a slow bass
 *   combat  a wave is running — drums, a driving bass and an arpeggio
 *
 * There is one audio switch in the HUD, not two, so the soundtrack follows the
 * sound preference rather than keeping one of its own.
 */

const BPM = 92;
/** Seconds of music scheduled ahead of the audio clock. */
const LOOKAHEAD = 0.3;
/** How often the scheduler wakes up, in milliseconds. */
const TICK = 70;
const MASTER = 0.16;
const STEPS = 16;

/** Four bars in A minor: i - VI - III - VII. Bass root, then the triad. */
const PROG = [
  { bass: 45, chord: [57, 60, 64] },
  { bass: 41, chord: [53, 57, 60] },
  { bass: 48, chord: [55, 60, 64] },
  { bass: 43, chord: [55, 59, 62] },
];

const MOODS = {
  calm: { gain: 0.55, bass: [0, 8], hats: false, arp: false, kick: [0], snare: [] },
  combat: { gain: 1, bass: [0, 3, 6, 8, 11, 14], hats: true, arp: true, kick: [0, 8, 11], snare: [4, 12] },
};

let enabled = soundEnabled();
let ctx = null;
let bus = null;
let noiseBuf = null;
let timer = 0;
let nextTime = 0;
let step = 0;
let mood = 'calm';

const stepDur = () => 60 / BPM / 4;
const hz = midi => 440 * Math.pow(2, (midi - 69) / 12);

/* ------------------------------------------------------------------ voices */

/** One short oscillator note through the music bus. */
function note(t, freq, dur, type, peak, cutoff) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.014);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g);
  if (cutoff) {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(cutoff, t);
    g.connect(f);
    f.connect(bus);
  } else {
    g.connect(bus);
  }
  osc.start(t);
  osc.stop(t + dur + 0.06);
}

/** A slow swell, two detuned triangles wide apart. Held for a whole bar. */
function pad(t, chord, dur, peak) {
  for (let i = 0; i < chord.length; i++) {
    for (const cents of [-7, 7]) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(hz(chord[i]), t);
      osc.detune.setValueAtTime(cents, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + dur * 0.4);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g);
      g.connect(bus);
      osc.start(t);
      osc.stop(t + dur + 0.08);
    }
  }
}

/** Filtered noise, which is every drum that is not the kick. */
function hiss(t, dur, peak, cutoff, type) {
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = ctx.createBufferSource();
  const f = ctx.createBiquadFilter();
  const g = ctx.createGain();
  src.buffer = noiseBuf;
  f.type = type || 'highpass';
  f.frequency.setValueAtTime(cutoff, t);
  g.gain.setValueAtTime(peak, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f);
  f.connect(g);
  g.connect(bus);
  src.start(t);
  src.stop(t + dur + 0.02);
}

function kick(t) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(125, t);
  osc.frequency.exponentialRampToValueAtTime(42, t + 0.11);
  g.gain.setValueAtTime(0.5, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
  osc.connect(g);
  g.connect(bus);
  osc.start(t);
  osc.stop(t + 0.24);
}

/* --------------------------------------------------------------- sequencer */

/** Everything that happens on one sixteenth, scheduled at audio time `t`. */
function playStep(i, t) {
  const m = MOODS[mood];
  const bar = PROG[Math.floor(i / STEPS) % PROG.length];
  const s = i % STEPS;

  if (s === 0) pad(t, bar.chord, stepDur() * STEPS, 0.055);
  if (m.bass.includes(s)) {
    // The root on the downbeat, an octave up off the beat, so the line moves.
    const root = bar.bass + (s === 0 ? 0 : 12);
    note(t, hz(root), s === 0 ? 0.5 : 0.19, 'sawtooth', s === 0 ? 0.15 : 0.09, 620);
  }
  if (m.kick.includes(s)) kick(t);
  if (m.snare.includes(s)) hiss(t, 0.16, 0.14, 1400);
  if (m.hats && s % 2 === 0) hiss(t, 0.035, s % 4 === 0 ? 0.05 : 0.03, 7200);
  if (m.arp) {
    const tones = [...bar.chord, bar.chord[0] + 12];
    note(t, hz(tones[(i * 3) % tones.length] + 12), 0.16, 'square', 0.028, 3200);
  }
}

function pump() {
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume();
    return;
  }
  const bars = STEPS * PROG.length;
  while (nextTime < ctx.currentTime + LOOKAHEAD) {
    if (nextTime < ctx.currentTime) nextTime = ctx.currentTime + 0.05;
    playStep(step, nextTime);
    nextTime += stepDur();
    step = (step + 1) % bars;
  }
}

/* ------------------------------------------------------------------ public */

/**
 * Starts the loop. Browsers block audio until a gesture, so this is called
 * from the same pointer handlers that unlock the sound effects; before that
 * it is a no-op and no context is created.
 */
function startMusic() {
  if (!enabled || timer) return;
  ctx = audioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  if (!bus) {
    bus = ctx.createGain();
    bus.gain.value = 0;
    bus.connect(ctx.destination);
  }
  bus.gain.cancelScheduledValues(ctx.currentTime);
  bus.gain.setValueAtTime(Math.max(0.0001, bus.gain.value), ctx.currentTime);
  bus.gain.linearRampToValueAtTime(MASTER * MOODS[mood].gain, ctx.currentTime + 1.4);
  nextTime = ctx.currentTime + 0.08;
  timer = setInterval(pump, TICK);
  pump();
}

/** Fades out and stops scheduling. `startMusic()` brings it back. */
function stopMusic(fade) {
  if (timer) {
    clearInterval(timer);
    timer = 0;
  }
  if (bus && ctx) {
    bus.gain.cancelScheduledValues(ctx.currentTime);
    bus.gain.setValueAtTime(Math.max(0.0001, bus.gain.value), ctx.currentTime);
    bus.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + (fade === undefined ? 0.8 : fade));
  }
}

/** Follows the HUD's one sound switch. */
function setEnabled(value) {
  enabled = value;
  if (enabled) startMusic();
  else stopMusic(0.35);
}

/** 'calm' between waves, 'combat' during one. Crossfades the level. */
function setMood(next) {
  if (!MOODS[next] || next === mood) return;
  mood = next;
  if (!ctx || !bus || !timer) return;
  bus.gain.cancelScheduledValues(ctx.currentTime);
  bus.gain.setValueAtTime(Math.max(0.0001, bus.gain.value), ctx.currentTime);
  bus.gain.linearRampToValueAtTime(MASTER * MOODS[mood].gain, ctx.currentTime + 1.2);
}

/** Wires the soundtrack to the run's events. Call once at start-up. */
export function initMusic() {
  on('audio:wake', startMusic);
  on('audio:enabled', setEnabled);
  on('wave:started', () => setMood('combat'));
  on('run:brief', () => setMood('calm'));
  on('run:lost', () => stopMusic(1.6));
  on('run:won', () => stopMusic(2.2));

  // A backgrounded tab keeps its timers but should not keep playing.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopMusic(0.4);
    else if (enabled) startMusic();
  });
}
