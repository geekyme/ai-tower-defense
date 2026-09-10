/** Element lookups, in one place so the HTML contract is easy to audit. */

export const el = id => document.getElementById(id);

export const refs = {
  get app() { return el('app'); },
  get stage() { return el('stage'); },
  get canvas() { return el('cv'); },
  get shop() { return el('shop'); },
  get overlay() { return el('ov'); },
  get overlayBox() { return el('ovBox'); },
  get overlayScroll() { return el('ovScroll'); },
  get inspect() { return el('inspect'); },
  get preview() { return el('preview'); },
  get callRow() { return el('callRow'); },
  get callBtn() { return el('callBtn'); },
  get callBonus() { return el('callBonus'); },
};

/** Escapes text before it goes into an innerHTML template. */
export function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
