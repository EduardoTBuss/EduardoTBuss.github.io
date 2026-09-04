/**
 * Every project page tells the same story in the same order. Six pages that
 * share a shape read as a collection; six pages that each invent their own read
 * as six loose essays. This check is what keeps that true over time.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const DIR = 'src/content/projects';
const REQUIRED = [
  'Problem',
  'Approach',
  'Architecture',
  'Measured results',
  'Engineering decisions',
  'Limitations',
  'Links',
];

const errors = [];
const files = (await readdir(DIR)).filter((f) => f.endsWith('.md'));

if (files.length === 0) errors.push(`${DIR}: no project pages found`);

for (const file of files) {
  const raw = await readFile(join(DIR, file), 'utf8');
  const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
  const where = `${DIR}/${file}`;

  const headings = [...body.matchAll(/^##\s+(.+?)\s*$/gm)].map((m) => m[1]);

  if (headings.length !== REQUIRED.length ||
      headings.some((h, i) => h !== REQUIRED[i])) {
    errors.push(
      `${where}: section headings must be exactly, in order:\n` +
      `  expected: ${REQUIRED.join(' | ')}\n` +
      `  found:    ${headings.join(' | ') || '(none)'}`
    );
  }

  if (/^#\s+/m.test(body)) {
    errors.push(`${where}: the body must not contain an H1 (the page title is the H1)`);
  }

  // Architecture is one paragraph on purpose: it forces the whole design to be
  // stated as a single connected thought instead of a bullet list.
  const architecture = body.split(/^##\s+/m).find((s) => s.startsWith('Architecture'));
  if (architecture) {
    const content = architecture.replace(/^Architecture\r?\n/, '').trim();
    const paragraphs = content.split(/\r?\n\s*\r?\n/).filter(Boolean);
    if (paragraphs.length !== 1) {
      errors.push(`${where}: "## Architecture" must be exactly one paragraph, found ${paragraphs.length}`);
    }
    if (/^\s*[-*+]\s/m.test(content)) {
      errors.push(`${where}: "## Architecture" must not contain a list`);
    }
  }
}

if (errors.length) {
  console.error(`\ncheck-project-pages: ${errors.length} problem(s)\n`);
  for (const e of errors) console.error(`  ${e}\n`);
  process.exit(1);
}
console.log(`check-project-pages: ${files.length} pages, all with the ${REQUIRED.length} required sections in order`);
