/**
 * Renders the social preview images and the PNG touch icons.
 *
 * The site itself has no build step and no dependencies; this is an optional
 * one-off you run when the art in `scripts/og-card.html` or the favicon
 * changes, and the PNGs it writes are committed:
 *
 *   npm i -g playwright && npx playwright install chromium
 *   node scripts/render-og.mjs
 *
 * Screenshotting `scripts/og-card.html` by hand at 1200x630 works just as well.
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cards = [['game', 'assets/og-game.png'], ['playbook', 'assets/og-playbook.png']];
const icons = [180, 512];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });

await page.goto('file://' + join(root, 'scripts/og-card.html'));
await page.evaluate(() => document.fonts.ready);
for (const [id, out] of cards) {
  await page.locator('#' + id).screenshot({ path: join(root, out) });
  console.log('wrote ' + out);
}

// The favicon is an SVG; iOS and Android still want a square PNG.
const favicon = readFileSync(join(root, 'assets/favicon.svg'), 'utf8');
for (const size of icons) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<body style="margin:0;background:#0a1020">
       <div style="width:${size}px;height:${size}px">${favicon.replace('<svg', '<svg width="100%" height="100%"')}</div>
     </body>`
  );
  const out = `assets/icon-${size}.png`;
  await page.screenshot({ path: join(root, out) });
  console.log('wrote ' + out);
}

await browser.close();
