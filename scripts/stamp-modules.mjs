/**
 * Stamps a version onto every module URL. Deploy only — it rewrites the files
 * in place, so run it on a checkout that is about to be published, never on
 * the one you are working in.
 *
 *   node scripts/stamp-modules.mjs <version>
 *
 * Browsers *link* ES modules rather than merely fetching them, so a visitor
 * holding one stale file from a previous deploy while another arrives fresh
 * gets an import that no longer matches, and the whole graph fails to run: a
 * black page, not a degraded one. Safari is particularly happy to keep serving
 * a module it already has, reload or no reload. A version on every module URL
 * makes a deploy's files a set that can only be fetched together.
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const version = (process.argv[2] || String(Date.now())).slice(0, 12);

/** `from './x.js'` and `import('./x.js')`, the only two forms this site uses. */
const IMPORT = /(\bfrom\s*|\bimport\s*\(\s*)(['"])(\.{1,2}\/[^'"]+?\.js)\2/g;
/** The entry points, which the HTML names directly. */
const ENTRY = /(<script type="module" src=")([^"]+\.js)(")/g;

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...walk(path));
    else if (name.endsWith('.js')) out.push(path);
  }
  return out;
}

function stamp(path, pattern, replacement) {
  const before = readFileSync(path, 'utf8');
  const after = before.replace(pattern, replacement);
  if (after !== before) writeFileSync(path, after);
  return (before.match(pattern) || []).length;
}

let count = 0;
for (const path of walk('src')) {
  count += stamp(path, IMPORT, (m, lead, q, spec) => lead + q + spec + '?v=' + version + q);
}
for (const path of ['index.html', 'lessons.html']) {
  count += stamp(path, ENTRY, (m, lead, spec, tail) => lead + spec + '?v=' + version + tail);
}

console.log('stamped', count, 'module URLs with v=' + version);
