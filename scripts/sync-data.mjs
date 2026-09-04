/**
 * Copies the canonical JSON from the profile repository into src/data/.
 *
 * The data lives in EduardoTBuss/data/ and is written by that repository's
 * generator. Duplicating it here would guarantee drift, so it is copied at
 * build time and gitignored. In CI the workflow checks the profile repo out
 * into a temporary directory and points DATA_SOURCE at it.
 */
import { cp, mkdir, access } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const FILES = [
  'profile.json', 'research.json', 'publications.json',
  'projects.json', 'github.json', 'now.json', 'cv.json',
];

const source = resolve(process.env.DATA_SOURCE ?? '../EduardoTBuss/data');
const target = resolve('src/data');

try {
  await access(source);
} catch {
  console.error(
    `\nsync-data: cannot find the data source at\n  ${source}\n\n` +
    `Clone https://github.com/EduardoTBuss/EduardoTBuss next to this repository,\n` +
    `or set DATA_SOURCE to the directory holding the JSON files.\n`
  );
  process.exit(1);
}

await mkdir(target, { recursive: true });
for (const file of FILES) {
  try {
    await cp(join(source, file), join(target, file));
  } catch {
    console.error(`sync-data: missing required file ${file} in ${source}`);
    process.exit(1);
  }
}
console.log(`sync-data: copied ${FILES.length} files from ${source}`);
