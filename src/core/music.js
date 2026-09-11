import { audioContext, soundEnabled } from './audio.js';
import { on } from './bus.js';

/**
 * The soundtrack: electronic, four-on-the-floor, and like the blip synth next
 * door it plays no files. A small step sequencer schedules the voices ahead of
 * the audio clock, so the loop never drifts and a backgrounded tab does not run
 * away with it.
 *
 * What makes it dance music rather than chiptune is mostly the groove and the
 * gain staging. The kick lands on every beat, the bass rolls on the offbeats
 * between them, the open hat answers it, and a detuned supersaw stabs across
 * the top. Every kick ducks the melodic voices for a fraction of a second,
 * which is the sidechain pump the whole genre is built on.
 *
 * Two moods, switched by the game's own events:
 *   calm    menus, briefings and the build phase — the breakdown: pad, pluck
 *           and a long bass, with the master filter half closed
 *   combat  a wave is running — the drop: kick, rolling bass, claps, hats,
 *           stabs, and the filter wide open
 *
 * There is one audio switch in the HUD, not two, so the soundtrack follows the
 * sound preference rather than keeping one of its own.
 */

const BPM = 128;
/** Seconds of music scheduled ahead of the audio clock. */
const LOOKAHEAD = 0.3;
/** How often the scheduler wakes up, in milliseconds. */
const TICK = 60;
const MASTER = 0.48;
const STEPS = 16;

/** Four bars of i - VI - III - VII in A minor: the workhorse dance loop. */
const PROG = [
  { bass: 33, chord: [57, 60, 64, 67] },
  { bass: 41, chord: [57, 60, 65, 69] },
  { bass: 36, chord: [55, 60, 64, 67] },
  { bass: 43, chord: [59, 62, 67, 71] },
];

/**
 * Sixteenths, counted from zero. Beats are 0, 4, 8, 12; the offbeat eighths
 * that carry the bass and the open hat are 2, 6, 10, 14.
 */
const MOODS = {
  calm: {
    gain: 0.66,
    // Half closed, so the breakdown sounds like the drop heard through a wall.
    tone: 1500,
    kick: [],
    clap: [],
    hats: false,
    crash: false,
    bass: [0, 8],
    bassLong: true,
    stab: [0],
    arp: [0, 4, 6, 8, 12, 14],
  },
  combat: {
    gain: 1,
    tone: 7200,
    kick: [0, 4, 8, 12],
    clap: [4, 12],
    hats: true,
    crash: true,
    bass: [2, 6, 10, 14],
    bassLong: false,
    stab: [2, 6, 10, 14],
    arp: [0, 2, 4, 6, 8, 10, 12, 14],
  },
};

/** Which chord note the pluck picks on each eighth, so the arp walks up and back. */
const ARP = [0, 2, 1, 3, 2, 0, 3, 1];

let enabled = soundEnabled();
let ctx = null;
let bus = null;
let voices = null;
let tone = null;
let noiseBuf = null;
let timer = 0;
let nextTime = 0;
let step = 0;
let mood = 'calm';

const stepDur = () => 60 / BPM / 4;
const hz = midi => 440 * Math.pow(2, (midi - 69) / 12);

/* ------------------------------------------------------------------ voices */

/** One oscillator with a gain envelope, through the melodic (ducked) bus. */
function note(t, freq, dur, type, peak, attack, cutoff, detune) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (detune) osc.detune.setValueAtTime(detune, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g);
  if (cutoff) {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(cutoff, t);
    g.connect(f);
    f.connect(voices);
  } else {
    g.connect(voices);
  }
  osc.start(t);
  osc.stop(t + dur + 0.06);
}

/**
 * A supersaw chord stab: three sawtooths per note, spread a few cents either
 * side of pitch. The beating between them is the whole sound.
 */
function stab(t, chord, dur, peak) {
  chord.forEach((n, i) => {
    for (const cents of [-11, 0, 11]) {
      note(t + i * 0.004, hz(n), dur, 'sawtooth', peak, 0.006, 3800, cents);
    }
  });
}

/** A pluck: one saw with a snap on the front and a filter that shuts behind it. */
function pluck(t, freq, dur, peak) {
  const osc = ctx.createOscillator();
  const f = ctx.createBiquadFilter();
  const g = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq, t);
  f.type = 'lowpass';
  f.Q.value = 6;
  f.frequency.setValueAtTime(5200, t);
  f.frequency.exponentialRampToValueAtTime(700, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(f);
  f.connect(g);
  g.connect(voices);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

/** A slow saw swell under the chord, holding the bar together. */
function pad(t, chord, dur, peak) {
  for (const n of chord) {
    for (const cents of [-9, 9]) {
      note(t, hz(n - 12), dur, 'sawtooth', peak, dur * 0.4, 1300, cents);
    }
  }
}

/** The bass: a sine sub with a square over it, both well under the kick. */
function bass(t, midi, dur, peak) {
  note(t, hz(midi), dur, 'sine', peak, 0.01, 0);
  note(t, hz(midi), dur * 0.8, 'square', peak * 0.34, 0.008, 340);
}

/** Filtered noise: every drum here that is not the kick. */
function hiss(t, dur, peak, cutoff, type, q) {
  const src = ctx.createBufferSource();
  const f = ctx.createBiquadFilter();
  const g = ctx.createGain();
  src.buffer = noiseBuf;
  f.type = type || 'highpass';
  f.frequency.setValueAtTime(cutoff, t);
  if (q) f.Q.value = q;
  g.gain.setValueAtTime(peak, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f);
  f.connect(g);
  g.connect(bus);
  src.start(t);
  src.stop(t + dur + 0.02);
}

/**
 * The kick, straight to the bus so it never ducks itself: a fast pitch drop
 * with a click of noise on the transient.
 */
function kick(t) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(45, t + 0.08);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.62, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
  osc.connect(g);
  g.connect(bus);
  osc.start(t);
  osc.stop(t + 0.28);
  hiss(t, 0.02, 0.05, 2600);
  duck(t);
}

/** A clap: three noise bursts a few milliseconds apart, then the tail. */
function clap(t) {
  for (const at of [0, 0.011, 0.022]) hiss(t + at, 0.035, 0.075, 1500, 'bandpass', 1.1);
  hiss(t + 0.03, 0.14, 0.045, 1300, 'bandpass', 0.8);
}

/** A crash, opening the four-bar cycle. */
function crash(t) {
  hiss(t, 1.1, 0.06, 5200);
}

/**
 * The sidechain. Every kick pulls the melodic bus down and lets it back up
 * before the next eighth, which is what makes the loop breathe.
 */
function duck(t) {
  const g = voices.gain;
  g.cancelScheduledValues(t);
  g.setValueAtTime(1, t);
  g.linearRampToValueAtTime(0.42, t + 0.02);
  g.linearRampToValueAtTime(1, t + stepDur() * 1.7);
}

/* --------------------------------------------------------------- sequencer */

/** Everything that happens on one sixteenth, scheduled at audio time `t`. */
function playStep(i, t) {
  const m = MOODS[mood];
  const barIndex = Math.floor(i / STEPS) % PROG.length;
  const bar = PROG[barIndex];
  const s = i % STEPS;

  if (s === 0) {
    pad(t, bar.chord, stepDur() * STEPS, 0.026);
    if (m.crash && barIndex === 0) crash(t);
  }
  if (m.kick.includes(s)) kick(t);
  if (m.clap.includes(s)) clap(t);
  if (m.hats) {
    // Closed hats on the offbeat sixteenths, the open hat on the eighths.
    if (s % 2 === 1) hiss(t, 0.035, 0.026, 7600);
    if (s % 4 === 2) hiss(t, 0.12, 0.032, 6400);
  }
  if (m.bass.includes(s)) {
    // The root, with the octave on the last offbeat so the roll goes somewhere.
    const root = bar.bass + (s === 14 ? 12 : 0);
    bass(t, root, m.bassLong ? stepDur() * 7 : stepDur() * 1.5, m.bassLong ? 0.2 : 0.26);
  }
  if (m.stab.includes(s)) stab(t, bar.chord, stepDur() * 1.3, 0.026);
  if (m.arp.includes(s)) {
    const n = bar.chord[ARP[(i / 2 | 0) % ARP.length]] + 12;
    pluck(t, hz(n), stepDur() * 1.6, mood === 'calm' ? 0.05 : 0.038);
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
 * The bus, the ducked sub-bus the melodic voices share, and the master filter
 * that opens for the drop and half closes for the breakdown.
 */
function buildChain() {
  if (bus) return;
  tone = ctx.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = MOODS[mood].tone;
  tone.Q.value = 0.6;
  bus = ctx.createGain();
  bus.gain.value = 0;
  voices = ctx.createGain();
  voices.gain.value = 1;
  voices.connect(bus);
  bus.connect(tone);
  tone.connect(ctx.destination);

  noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 1.2), ctx.sampleRate);
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

  bus.gain.cancelScheduledValues(ctx.currentTime);
  bus.gain.setValueAtTime(Math.max(0.0001, bus.gain.value), ctx.currentTime);
  bus.gain.linearRampToValueAtTime(MASTER * MOODS[mood].gain, ctx.currentTime + 1.2);
  nextTime = ctx.currentTime + 0.08;
  // Always come in on a downbeat, so the first thing heard is the beat.
  step = 0;
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

/**
 * 'calm' between waves, 'combat' during one. The level and the master filter
 * both ride across, so a wave starting sounds like the filter opening up.
 */
function setMood(next) {
  if (!MOODS[next] || next === mood) return;
  mood = next;
  if (!ctx || !bus || !timer) return;
  const now = ctx.currentTime;
  const ramp = next === 'combat' ? 0.7 : 1.4;
  bus.gain.cancelScheduledValues(now);
  bus.gain.setValueAtTime(Math.max(0.0001, bus.gain.value), now);
  bus.gain.linearRampToValueAtTime(MASTER * MOODS[mood].gain, now + ramp);
  tone.frequency.cancelScheduledValues(now);
  tone.frequency.setValueAtTime(tone.frequency.value, now);
  tone.frequency.exponentialRampToValueAtTime(MOODS[mood].tone, now + ramp);
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
