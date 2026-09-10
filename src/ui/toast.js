import { esc } from './dom.js';

/**
 * A short notice at the foot of the screen. Used for a lesson unlocking and
 * for telling you where a shared card went, so it lives on its own rather
 * than inside either of them.
 *
 * @param {string} title
 * @param {string} sub
 * @param {{href: string, label: string}} [link] optional action on the right
 */
export function toast(title, sub, link) {
  const node = document.createElement('div');
  node.className = 'toast';
  node.innerHTML = '<b>' + esc(title) + '</b><span>' + esc(sub) + '</span>' +
    (link ? '<a href="' + esc(link.href) + '">' + esc(link.label) + '</a>' : '');
  document.body.appendChild(node);
  requestAnimationFrame(() => node.classList.add('in'));
  setTimeout(() => {
    node.classList.remove('in');
    setTimeout(() => node.remove(), 400);
  }, 4200);
}
