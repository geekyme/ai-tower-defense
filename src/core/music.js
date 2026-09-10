import { audioContext, soundEnabled } from './audio.js';
import { on } from './bus.js';

/**
 * The soundtrack: lo-fi, and like the blip synth next door it plays no files.
 * A small step sequencer schedules the voices ahead of the audio clock, so the
 * loop never drifts and a backgrounded tab does not run away with it.
 *
 * What makes it lo-fi rather than chiptune is mostly what is taken away. The
 * whole mix goes through one gentle lowpass, so nothing is bright. The odd
 * sixteenths land late, so nothing is on the grid. Vinyl crackle runs
 * underneath the lot. The chords are lazy sevenths, the keys are soft, and the
 * drums sit well behind them.
 *
 * Two moods, switched by the game's own events:
 *   calm    menus, briefings and the build phase — keys, bass, crackle
 *   combat  a wave is running — the drums come in and the bass walks
 *
 * There is one audio switch in the HUD, not two, so the soundtrack follows the
 * sound preference rather than keeping one of its own.
 */

const BPM = 74;
/** Seconds of music scheduled ahead of the audio clock. */
const LOOKAHEAD = 0.3;
/** How often the scheduler wakes up, in milliseconds. */
const TICK = 70;
const MASTER = 0.6;
const STEPS = 16;
/** How late an off sixteenth lands, as a fraction of one. This is the swing. */
const SWING = 0.19;
/** Everything above this is rolled off, which is most of the character. */
const TONE = 2100;

/** Four bars of ii - V - I - vi in C, voiced as sevenths without their roots. */
const PROG = [
  { bass: 38, chord: [53, 57, 60, 64] },
  { bass: 43, chord: [53, 57, 59, 62] },
  { bass: 36, chord: [55, 59, 62, 64] },
  { bass: 45, chord: [55, 57, 60, 64] },
];

const MOODS = {
  calm: {
    gain: 0.72,
    keys: [0, 10],
    bass: [0, 6],
    kick: [],
    snare: [],
    hats: false,
  },
  combat: {
    gain: 1,
    keys: [0, 6, 10],
    bass: [0, 6, 8, 14],
    kick: [0, 6, 10],
    snare: [4, 12],
    hats: true,
  },
};

let enabled = soundEnabled();
let ctx = null;
let bus = null;
let noiseBuf = null;
let crackle = null;
let timer = 0;
let nextTime = 0;
let step = 0;
let mood = 'calm';

const stepDur = () => 60 / BPM / 4;
const hz = midi => 440 * Math.pow(2, (midi - 69) / 12);
/** Off sixteenths drag behind the beat. Nothing here is quantised hard. */
const swing = i => (i % 2 ? SWING * stepDur() : 0);

/* ------------------------------------------------------------------ voices */

/** One note: an oscillator with a soft attack, through the bus. */
function note(t, freq, dur, type, peak, attack, cutoff) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
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
  osc.stop(t + dur + 0.08);
}

/**
 * The keys: a sine with a triangle an octave up under it, detuned a few cents
 * and spread across the chord, which is as close to a tired old Rhodes as two
 * oscillators get.
 */
function keys(t, chord, dur, peak) {
  chord.forEach((n, i) => {
    const at = t + i * 0.012;
    note(at, hz(n), dur, 'sine', peak, 0.035, 1500);
    note(at, hz(n + 12) * 1.002, dur * 0.7, 'triangle', peak * 0.35, 0.05, 1200);
  });
}

/** A slow swell under the keys, holding the bar together. */
function pad(t, chord, dur, peak) {
  for (const n of chord) {
    for (const cents of [-8, 8]) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(hz(n - 12), t);
      osc.detune.setValueAtTime(cents, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + dur * 0.45);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g);
      g.connect(bus);
      osc.start(t);
      osc.stop(t + dur + 0.1);
    }
  }
}

/** Filtered noise: every drum here that is not the kick. */
function hiss(t, dur, peak, cutoff, type) {
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

/** Soft and round, with none of the click of a dance kick. */
function kick(t) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(105, t);
  osc.frequency.exponentialRampToValueAtTime(46, t + 0.13);
  g.gain.setValueAtTime(0.44, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
  osc.connect(g);
  g.connect(bus);
  osc.start(t);
  osc.stop(t + 0.3);
}

/** Brushed snare: noise with a little body under it, mixed well back. */
function snare(t) {
  hiss(t, 0.19, 0.1, 1100, 'bandpass');
  note(t, 185, 0.1, 'triangle', 0.05, 0.004, 900);
}

/**
 * Vinyl crackle, looping under everything for as long as the music plays.
 * A few seconds of mostly silence with pops scattered through it: the one
 * sound here that is doing nothing but saying lo-fi.
 */
function startCrackle() {
  const seconds = 4;
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.03;
  for (let n = 0; n < seconds * 18; n++) {
    const at = Math.floor(Math.random() * (data.length - 40));
    const amp = 0.2 + Math.random() * 0.5;
    for (let i = 0; i < 30; i++) data[at + i] += (Math.random() * 2 - 1) * amp * (1 - i / 30);
  }

  const src = ctx.createBufferSource();
  const hp = ctx.createBiquadFilter();
  const g = ctx.createGain();
  src.buffer = buf;
  src.loop = true;
  hp.type = 'highpass';
  hp.frequency.value = 1200;
  g.gain.value = 0.15;
  src.connect(hp);
  hp.connect(g);
  g.connect(bus);
  src.start();
  return src;
}

/* --------------------------------------------------------------- sequencer */

/** Everything that happens on one sixteenth, scheduled at audio time `t`. */
function playStep(i, t) {
  const m = MOODS[mood];
  const bar = PROG[Math.floor(i / STEPS) % PROG.length];
  const s = i % STEPS;

  if (s === 0) pad(t, bar.chord, stepDur() * STEPS, 0.032);
  if (m.keys.includes(s)) keys(t, bar.chord, s === 0 ? 1.5 : 0.9, s === 0 ? 0.06 : 0.038);
  if (m.bass.includes(s)) {
    // The root on the downbeat, the fifth off the beat: a lazy walk.
    const root = bar.bass + (s === 0 ? 0 : 7);
    note(t, hz(root), s === 0 ? 0.85 : 0.4, 'sine', s === 0 ? 0.19 : 0.11, 0.02, 400);
  }
  if (m.kick.includes(s)) kick(t);
  if (m.snare.includes(s)) snare(t);
  if (m.hats && s % 2 === 0) hiss(t, 0.045, s % 4 === 0 ? 0.035 : 0.022, 6800);
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
    playStep(step, nextTime + swing(step));
    nextTime += stepDur();
    step = (step + 1) % bars;
  }
}

/* ------------------------------------------------------------------ public */

/** The bus, and the lowpass that keeps the whole thing behind a closed door. */
function buildChain() {
  if (bus) return;
  const tone = ctx.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = TONE;
  tone.Q.value = 0.4;
  bus = ctx.createGain();
  bus.gain.value = 0;
  bus.connect(tone);
  tone.connect(ctx.destination);

  noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.4), ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}

/**
 * Starts the loop. Browsers block audio until a gesture, so this runs off the
 * same pointer handlers that unlock the sound effects; before that it is a
 * no-op and no context is created.
 */
function startMusic() {
  if (!enabled || timer) return;
  ctx = audioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  buildChain();
  if (!crackle) crackle = startCrackle();

  bus.gain.cancelScheduledValues(ctx.currentTime);
  bus.gain.setValueAtTime(Math.max(0.0001, bus.gain.value), ctx.currentTime);
  bus.gain.linearRampToValueAtTime(MASTER * MOODS[mood].gain, ctx.currentTime + 1.8);
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
  bus.gain.linearRampToValueAtTime(MASTER * MOODS[mood].gain, ctx.currentTime + 1.6);
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
