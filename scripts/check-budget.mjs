/**
 * The page weight budget, enforced rather than hoped for.
 *
 * Counts the HTML of a route plus every local asset it references. A route that
 * crosses the limit, or any JavaScript at all in the output, fails the build.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';

const DIST = 'dist';
const LIMIT = 100 * 1024;

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(path));
    else out.push(path);
  }
  return out;
}

const all = await walk(DIST);

const js = all.filter((f) => extname(f) === '.js' || extname(f) === '.mjs');
if (js.length) {
  console.error('check-budget: this site ships zero client-side JavaScript, but found:');
  for (const f of js) console.error(`  ${f}`);
  process.exit(1);
}

const assetPattern = /(?:href|src)="(\/[^"]+\.(?:css|woff2?|avif|webp|png|jpe?g|svg))"/g;
const pages = all.filter((f) => f.endsWith('.html'));

let failed = false;
const rows = [];
for (const page of pages) {
  const html = await readFile(page, 'utf8');
  let total = Buffer.byteLength(html);
  const assets = new Set([...html.matchAll(assetPattern)].map((m) => m[1]));
  for (const asset of assets) {
    try { total += (await stat(join(DIST, asset))).size; } catch { /* external or missing */ }
  }
  rows.push([page.replace(DIST, '') || '/', total, assets.size]);
  if (total > LIMIT) failed = true;
}

rows.sort((a, b) => b[1] - a[1]);
for (const [route, bytes, assets] of rows) {
  const kb = (bytes / 1024).toFixed(1).padStart(6);
  const flag = bytes > LIMIT ? '  OVER BUDGET' : '';
  console.log(`${kb} KB  ${String(assets).padStart(2)} asset(s)  ${route}${flag}`);
}
console.log(`\ncheck-budget: budget is ${LIMIT / 1024} KB per route, uncompressed, ${pages.length} routes checked`);

if (failed) process.exit(1);
