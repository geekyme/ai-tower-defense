/**
 * Everything that survives a reload, in one localStorage key.
 *
 * The store is read once at load into `progress`, mutated through the helpers
 * below, and written back on every change. Every access is wrapped: private
 * browsing and blocked site data must degrade to an in-memory session rather
 * than break the game.
 */

const KEY = 'head-of-ai-defence:v1';
const MAX_SESSIONS = 40;

function emptyProgress() {
  return {
    version: 1,
    /** Highest wave ever reached (not necessarily cleared). */
    bestWave: 0,
    /** Wave numbers whose lesson has been unlocked, sorted ascending. */
    unlockedLessons: [],
    totals: { runs: 0, wavesCleared: 0, handled: 0, leaked: 0, defencesLost: 0, playMs: 0 },
    /** Newest first, capped at MAX_SESSIONS. */
    sessions: [],
    /** The run in progress, if there is one. See `saveRun` below. */
    run: null,
    prefs: { sound: true },
  };
}

function readStore() {
  const base = emptyProgress();
  let raw = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch (e) {
    return base;
  }
  if (!raw) return base;
  try {
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== 'object') return base;
    return {
      ...base,
      ...saved,
      totals: { ...base.totals, ...(saved.totals || {}) },
      prefs: { ...base.prefs, ...(saved.prefs || {}) },
      unlockedLessons: Array.isArray(saved.unlockedLessons) ? saved.unlockedLessons.slice() : [],
      sessions: Array.isArray(saved.sessions) ? saved.sessions.slice(0, MAX_SESSIONS) : [],
    };
  } catch (e) {
    return base;
  }
}

export const progress = readStore();

let warned = false;
function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress));
  } catch (e) {
    if (!warned) {
      warned = true;
      console.warn('Progress cannot be saved in this browser; this session will not be remembered.');
    }
  }
}

/* ---------------------------------------------------------------- lessons */

export function isLessonUnlocked(wave) {
  return progress.unlockedLessons.includes(wave);
}

export function unlockedCount() {
  return progress.unlockedLessons.length;
}

/** Records a cleared wave. Returns true the first time that wave is cleared. */
export function unlockLesson(wave) {
  if (progress.unlockedLessons.includes(wave)) return false;
  progress.unlockedLessons.push(wave);
  progress.unlockedLessons.sort((a, b) => a - b);
  persist();
  return true;
}

/* ---------------------------------------------------------------- records */

export function recordBestWave(wave) {
  if (wave <= progress.bestWave) return;
  progress.bestWave = wave;
  persist();
}

/**
 * Saves a finished run, keyed by `runId` so a run that is recorded at victory
 * and again when its endless continuation ends stays a single row. Lifetime
 * totals are adjusted by the difference, never double counted.
 *
 * `session` is { runId, outcome, wave, bestWave, handled, leaked,
 * defencesLost, sanity, maxSanity, towers, durationMs }.
 */
const COUNTED = { bestWave: 'wavesCleared', handled: 'handled', leaked: 'leaked',
  defencesLost: 'defencesLost', durationMs: 'playMs' };

export function recordSession(session) {
  const row = { endedAt: Date.now(), ...session };
  const at = row.runId ? progress.sessions.findIndex(s => s.runId === row.runId) : -1;
  const prev = at >= 0 ? progress.sessions[at] : null;

  if (prev) progress.sessions[at] = row;
  else progress.sessions.unshift(row);
  progress.sessions.length = Math.min(progress.sessions.length, MAX_SESSIONS);

  const t = progress.totals;
  if (!prev) t.runs += 1;
  for (const [field, total] of Object.entries(COUNTED)) {
    t[total] += (row[field] || 0) - (prev ? prev[field] || 0 : 0);
  }
  persist();
}

/* -------------------------------------------------------------- open run */

/**
 * The run in progress, held as the snapshot taken at the top of the current
 * wave. The playbook is a separate page, so opening it — or a reload, or the
 * tab being dropped on a phone — takes the live run with it. Keeping the
 * snapshot here means coming back offers to pick the run up rather than
 * sending you to wave one, which matters most past the campaign, where the
 * only other way back into endless is clearing all twenty five again.
 */
export function savedRun() {
  return progress.run;
}

export function saveRun(run) {
  progress.run = run;
  persist();
}

/** Called when the player is done with the run, not when they walk away. */
export function clearSavedRun() {
  if (!progress.run) return;
  progress.run = null;
  persist();
}

/* ------------------------------------------------------------------ prefs */

export function getPref(name) {
  return progress.prefs[name];
}

export function setPref(name, value) {
  progress.prefs[name] = value;
  persist();
}

/* ------------------------------------------------------------------ reset */

export function resetProgress() {
  Object.assign(progress, emptyProgress());
  persist();
}
