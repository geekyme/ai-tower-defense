import { LESSONS, lessonEra } from '../data/lessons.js';
import { ERAS, CAMPAIGN_WAVES } from '../data/waves.js';
import { THREATS } from '../data/threats.js';
import { threatThumbnail } from '../render/shapes.js';
import { isLessonUnlocked, unlockedCount } from '../core/storage.js';
import { esc } from './dom.js';

/**
 * Shared rendering for the playbook, used by both the in-game overlay and
 * lessons.html so the two can never drift apart.
 */

/** One lesson row. Locked rows show the wave that opens them and nothing else. */
export function lessonCardHTML(lesson, { size = 34, showEra = false } = {}) {
  const open = isLessonUnlocked(lesson.wave);
  const threat = THREATS[lesson.threat];
  const era = ERAS[lessonEra(lesson)];

  const body = open
    ? '<p class="ls-counter"><u>In game</u>' + esc(lesson.counter) + '</p>' +
      '<p class="ls-lesson"><u>At work</u>' + esc(lesson.lesson) + '</p>'
    : '<p class="ls-locked">Clear wave ' + lesson.wave + ' to unlock this lesson.</p>';

  return '<article class="ls' + (open ? '' : ' locked') + '">' +
    '<img src="' + threatThumbnail(lesson.threat, size) + '" width="' + size + '" height="' + size +
    '" alt="" aria-hidden="true">' +
    '<div class="ls-body">' +
      '<div class="ls-meta">wave ' + lesson.wave +
        (showEra ? ' · ' + esc(era.n.split('·')[0].trim()) : '') +
        ' · ' + (open ? esc(threat.n) : 'locked') + '</div>' +
      '<h3>' + (open ? esc(lesson.title) : 'Not unlocked yet') + '</h3>' +
      body +
    '</div></article>';
}

/** Every lesson, grouped under its era heading. */
export function lessonListHTML(opts = {}) {
  return ERAS.map((era, i) => {
    const inEra = LESSONS.filter(l => lessonEra(l) === i);
    const open = inEra.filter(l => isLessonUnlocked(l.wave)).length;
    return '<section class="ls-era">' +
      '<div class="ls-era-head"><h2>' + esc(era.n) + '</h2>' +
      '<span>' + open + '/' + inEra.length + '</span></div>' +
      '<p class="ls-era-sub">' + esc(era.s) + '</p>' +
      inEra.map(l => lessonCardHTML(l, opts)).join('') +
      '</section>';
  }).join('');
}

/** Campaign progress bar, sized by how many lessons are unlocked. */
export function progressHTML() {
  const got = unlockedCount();
  const pct = Math.round((got / CAMPAIGN_WAVES) * 100);
  const left = CAMPAIGN_WAVES - got;
  return '<div class="progrow"><span>playbook</span><span>' +
    (left > 0
      ? '<b>' + got + '</b> of ' + CAMPAIGN_WAVES + ' lessons · ' + left + ' wave' + (left === 1 ? '' : 's') + ' to go'
      : '<b>all ' + CAMPAIGN_WAVES + ' lessons unlocked</b>') +
    '</span></div><div class="prog"><i style="width:' + pct + '%"></i></div>';
}
