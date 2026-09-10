/** Seconds since load, used by anything that idles or pulses. */
let t = 0;

export function advanceClock(dt) {
  t += dt;
}

export function clock() {
  return t;
}
