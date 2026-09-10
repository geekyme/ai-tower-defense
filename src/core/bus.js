/**
 * Minimal event bus. It exists so the simulation never has to import the UI:
 * the engine emits, the screens listen.
 *
 * Events
 *   wave:cleared  { wave, reward, lesson }   a wave finished, lesson may be null
 *   wave:started  { wave }
 *   run:brief     { wave }                   time to show the pre-wave briefing
 *   run:won       {}                         campaign complete
 *   run:lost      {}                         sanity hit zero
 *   tower:removed { tower }                  a defence left the board
 */
const handlers = new Map();

export function on(event, fn) {
  if (!handlers.has(event)) handlers.set(event, new Set());
  handlers.get(event).add(fn);
  return () => handlers.get(event).delete(fn);
}

export function emit(event, payload) {
  const set = handlers.get(event);
  if (!set) return;
  for (const fn of [...set]) fn(payload);
}
