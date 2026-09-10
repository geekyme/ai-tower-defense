import { CAMPAIGN_WAVES } from './data/waves.js';
import { progress, unlockedCount, resetProgress } from './core/storage.js';
import { lessonListHTML, progressHTML } from './ui/lesson-list.js';
import { el, esc } from './ui/dom.js';
import { creditHTML } from './ui/credit.js';

/** Renders lessons.html from whatever this browser has stored. */

const OUTCOME_LABEL = { victory: 'held the line', defeat: 'burnt out', abandoned: 'restarted' };

function formatDuration(ms) {
  const mins = Math.round((ms || 0) / 60000);
  if (mins < 1) return 'under a minute';
  if (mins < 60) return mins + ' min';
  return Math.floor(mins / 60) + 'h ' + (mins % 60) + 'm';
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function statsHTML() {
  const t = progress.totals;
  const cells = [
    ['best wave', progress.bestWave || '—', 'var(--cyan)'],
    ['lessons', unlockedCount() + '/' + CAMPAIGN_WAVES, 'var(--violet)'],
    ['runs', t.runs, 'var(--text)'],
    ['handled', t.handled, 'var(--mint)'],
    ['got through', t.leaked, 'var(--coral)'],
    ['time played', formatDuration(t.playMs), 'var(--text)'],
  ];
  return cells
    .map(([label, value, colour]) =>
      '<div><b style="color:' + colour + '">' + esc(value) + '</b><span>' + label + '</span></div>')
    .join('');
}

function historyHTML() {
  if (!progress.sessions.length) {
    return '<p class="empty">No runs recorded yet. Sessions you play in this browser show up here.</p>';
  }
  return progress.sessions
    .map(s => {
      const outcome = OUTCOME_LABEL[s.outcome] || s.outcome;
      return '<div class="run"><b>wave ' + (s.bestWave || 0) + '</b>' +
        '<span class="tag ' + esc(s.outcome) + '">' + esc(outcome) + '</span>' +
        '<span>' + (s.handled || 0) + ' handled · ' + formatDuration(s.durationMs) + '</span>' +
        '<span class="when">' + formatDate(s.endedAt) + '</span></div>';
    })
    .join('');
}

function render() {
  const got = unlockedCount();
  el('summary').innerHTML =
    (got === CAMPAIGN_WAVES
      ? '<p class="lede">Every lesson is unlocked. This is the whole playbook — twenty five waves of it.</p>'
      : got === 0
        ? '<p class="lede">Nothing unlocked yet. Clear a wave and its lesson opens here permanently, one per wave, twenty five in total.</p>'
        : '<p class="lede">' + got + ' of ' + CAMPAIGN_WAVES + ' lessons unlocked. Each wave you clear opens one more, and it stays open.</p>') +
    progressHTML() +
    '<div class="stats">' + statsHTML() + '</div>';

  el('lessons').innerHTML = lessonListHTML({ size: 36 });
  el('history').innerHTML = '<h2>Recent runs</h2>' + historyHTML();
  el('credit').innerHTML = creditHTML();
}

el('reset').addEventListener('click', () => {
  const ok = window.confirm('Clear every unlocked lesson, run and record stored in this browser?');
  if (!ok) return;
  resetProgress();
  render();
});

render();
