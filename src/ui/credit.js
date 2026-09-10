/** Who made this. Single source of truth — both pages render from here. */
export const AUTHOR = {
  line: 'Made by a fellow head of AI',
  url: 'https://www.linkedin.com/in/geekyme/',
  label: 'LinkedIn',
};

export function creditHTML() {
  return '<p class="credit">' + AUTHOR.line +
    ' · <a href="' + AUTHOR.url + '" target="_blank" rel="noopener noreferrer">' +
    AUTHOR.label + '</a></p>';
}
