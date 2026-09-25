/** Uncompressed budgets include transitive local CSS/JS dependencies, once per route. */
import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, relative, dirname, extname } from 'node:path';

const DIST = resolve('dist');
const ROUTE_LIMIT = 150 * 1024;
const JS_LIMIT = 30 * 1024;
async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = resolve(dir, entry.name);
    files.push(...(entry.isDirectory() ? await walk(file) : [file]));
  }
  return files;
}
function localPath(reference, owner) {
  const value = reference.trim().replaceAll('&amp;', '&');
  if (!value || value.startsWith('#') || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value)) return null;
  const pathname = decodeURIComponent(value.split(/[?#]/)[0]);
  const file = pathname.startsWith('/') ? resolve(DIST, '.' + pathname) : resolve(dirname(owner), pathname);
  if (relative(DIST, file).startsWith('..')) throw new Error(`Asset escapes dist: ${value}`);
  return file;
}
function executableInlineScripts(html) {
  const bodies = [];
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = match[1];
    if (/(?:^|\s)src\s*=/i.test(attrs)) continue;
    const typeAttribute = /(?:^|\s)type\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs);
    const type = (typeAttribute ? typeAttribute[1] ?? typeAttribute[2] ?? typeAttribute[3] : '').trim().toLowerCase();
    // JSON-LD, import maps and other data blocks are HTML weight, not executable JS.
    if (!type || type === 'module' || /^(?:text|application)\/(?:x-)?(?:java|ecma)script$/.test(type) || /^text\/(?:javascript1\.[0-5]|jscript|livescript)$/.test(type)) bodies.push(match[2]);
  }
  return bodies;
}
function references(source, extension) {
  const refs = [];
  if (extension === '.html') {
    for (const [tag] of source.matchAll(/<(?:script|link|img|source|video|audio|track|input|embed|object)\b[^>]*>/gi)) {
      const name = /^<(\w+)/.exec(tag)[1].toLowerCase();
      if (name === 'link' && !/\brel\s*=\s*["'][^"']*(?:stylesheet|icon|preload|modulepreload)[^"']*["']/i.test(tag)) continue;
      for (const match of tag.matchAll(/\b(?:src|href|poster|data)\s*=\s*["']([^"']+)["']/gi)) refs.push(match[1]);
      for (const match of tag.matchAll(/\bsrcset\s*=\s*["']([^"']+)["']/gi)) {
        if (!match[1].startsWith('data:')) refs.push(...match[1].split(',').map(item => item.trim().split(/\s+/)[0]));
      }
    }
    for (const match of source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) refs.push(...references(match[1], '.css'));
    for (const match of source.matchAll(/\bstyle\s*=\s*["']([^"']*)["']/gi)) refs.push(...references(match[1], '.css'));
    for (const body of executableInlineScripts(source)) refs.push(...references(body, '.js'));
  } else if (extension === '.css') {
    for (const match of source.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)|@import\s+["']([^"']+)["']/gi)) refs.push(match[1] || match[2]);
  } else if (['.js', '.mjs'].includes(extension)) {
    // Astro/Vite emits literal ESM imports; include dynamic chunks and new URL assets.
    for (const match of source.matchAll(/(?:\b(?:import|export)\s+(?:[^;"']*?\s+from\s*)?|\bimport\s*\(\s*|\bnew\s+URL\s*\(\s*)["']([^"']+)["']/g)) refs.push(match[1]);
  }
  return refs;
}
const all = await walk(DIST);
const pages = all.filter(file => extname(file) === '.html');
if (!pages.length) throw new Error('check-budget: dist contains no HTML routes');
let failed = false;
const javascript = all.filter(file => ['.js', '.mjs', '.cjs'].includes(extname(file)));
const externalJsBytes = (await Promise.all(javascript.map(async file => (await stat(file)).size))).reduce((a, b) => a + b, 0);
// Astro may inline small modules. Count each identical body once across routes,
// while each route's HTML budget still includes its full inline copy.
const inlineScripts = new Set((await Promise.all(pages.map(async page => executableInlineScripts(await readFile(page, 'utf8'))))).flat());
const inlineJsBytes = [...inlineScripts].reduce((total, body) => total + Buffer.byteLength(body), 0);
const jsBytes = externalJsBytes + inlineJsBytes;
if (jsBytes > JS_LIMIT) failed = true;
console.log(`JavaScript: ${(jsBytes / 1024).toFixed(1)} / ${JS_LIMIT / 1024} KB across dist (${(externalJsBytes / 1024).toFixed(1)} KB files + ${(inlineJsBytes / 1024).toFixed(1)} KB unique inline)${jsBytes > JS_LIMIT ? ' OVER BUDGET' : ''}`);
for (const page of pages) {
  const seen = new Set();
  let bytes = 0;
  async function visit(file) {
    if (seen.has(file)) return;
    seen.add(file);
    const info = await stat(file);
    if (!info.isFile()) throw new Error(`Expected asset file: ${relative(DIST, file)}`);
    bytes += info.size;
    const extension = extname(file);
    if (['.html', '.css', '.js', '.mjs'].includes(extension)) {
      for (const reference of references(await readFile(file, 'utf8'), extension)) {
        const target = localPath(reference, file);
        if (target) await visit(target);
      }
    }
  }
  try { await visit(page); }
  catch (error) { failed = true; console.error(`Missing or invalid asset in ${relative(DIST, page)}: ${error.message}`); }
  if (bytes > ROUTE_LIMIT) failed = true;
  console.log(`${(bytes / 1024).toFixed(1).padStart(6)} KB  ${seen.size - 1} assets  /${relative(DIST, page).replaceAll('\\', '/')}${bytes > ROUTE_LIMIT ? ' OVER BUDGET' : ''}`);
}
console.log(`check-budget: ${ROUTE_LIMIT / 1024} KB per route; ${JS_LIMIT / 1024} KB JavaScript total; uncompressed`);
if (failed) process.exitCode = 1;
