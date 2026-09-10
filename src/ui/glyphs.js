/**
 * Inline SVG marks for each defence, used in the shop card, the build preview
 * and the inspect panel.
 *
 * Strokes and fills use `currentColor`, so a glyph takes the tower colour from
 * whatever `color` the caller sets — no per-colour string building.
 */
const GLYPHS = {
  evalsuite:
    '<path d="M6 16l5 5 9-11" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<rect x="19" y="17" width="8" height="8" rx="2" fill="currentColor"/>',
  guardrail:
    '<path d="M16 3l11 5v8c0 7-4.6 11.6-11 13-6.4-1.4-11-6-11-13V8z" fill="currentColor" opacity=".85"/>' +
    '<path d="M11 16l4 4 7-8" fill="none" stroke="#07281a" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
  observ:
    '<circle cx="16" cy="16" r="3.4" fill="currentColor"/>' +
    '<g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">' +
    '<path d="M23.4 8.6a10.5 10.5 0 0 1 0 14.8M8.6 23.4a10.5 10.5 0 0 1 0-14.8M27 5a15 15 0 0 1 0 22M5 27A15 15 0 0 1 5 5"/></g>',
  router:
    '<circle cx="16" cy="16" r="3.2" fill="currentColor"/>' +
    '<g fill="currentColor"><circle cx="16" cy="4" r="2.6"/><circle cx="16" cy="28" r="2.6"/>' +
    '<circle cx="4" cy="16" r="2.6"/><circle cx="28" cy="16" r="2.6"/></g>' +
    '<g stroke="currentColor" stroke-width="1.8"><path d="M16 7v6M16 19v6M7 16h6M19 16h6"/></g>',
  council:
    '<path d="M4 26h24M16 4l11 5H5z" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linejoin="round"/>' +
    '<path d="M10 12v11M16 12v11M22 12v11" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  killswitch:
    '<circle cx="16" cy="17" r="10" fill="none" stroke="currentColor" stroke-width="2.6"/>' +
    '<path d="M16 4v10" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
};

/**
 * @param {string} key    tower key
 * @param {string} colour any CSS colour
 * @param {number} [px]   rendered size in pixels
 */
export function glyph(key, colour, px) {
  const size = px || 28;
  return '<svg viewBox="0 0 32 32" width="' + size + '" height="' + size +
    '" style="color:' + colour + '" aria-hidden="true">' + (GLYPHS[key] || '') + '</svg>';
}
