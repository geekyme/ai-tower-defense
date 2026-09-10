import { START_FOCUS, START_SANITY, BUILD_TIME } from './config.js';

/**
 * The whole mutable game state for one run.
 *
 * Exported as a live binding: modules `import { S }` and always read the
 * current run. Call `newRun()` to replace it — never reassign `S` elsewhere.
 */
export let S = createRun();

export function createRun() {
  return {
    // resources
    focus: START_FOCUS,
    sanity: START_SANITY,
    max: START_SANITY,

    // progression
    wave: 0,
    endless: 0,
    best: 0,
    /** menu | brief | build | wave | paused | over | won */
    phase: 'menu',
    prev: null,
    startedAt: Date.now(),

    // timers
    t: 0,
    buildT: BUILD_TIME,
    /** Seconds the wave-clear celebration still holds the briefing back. */
    cheerT: 0,

    // entities
    queue: [],
    foes: [],
    towers: [],
    shots: [],
    sludge: [],

    // presentation-only, cleared freely on resize
    fx: [],
    parts: [],
    conf: [],
    floats: [],
    banner: null,
    cheer: null,
    shake: 0,
    flashCol: null,
    flashT: 0,

    // run stats
    killed: 0,
    leaked: 0,
    lost: 0,
    /** Waves restarted after a defeat. */
    retries: 0,

    // selection
    sel: null,
    build: null,
    /** Clock reading when `build` was last picked, which times the plot flare. */
    pickAt: -99,
    boss: null,
  };
}

export function newRun() {
  S = createRun();
  return S;
}

/** Seconds of wall-clock time the current run has been open. */
export function runDuration() {
  return Date.now() - S.startedAt;
}
