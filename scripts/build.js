import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateNotes } from './notes.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(root, 'dist');
await generateNotes();
// Only clean the fixed build directory inside this repository.
if (dirname(output) !== resolve(root)) throw new Error('Invalid build output directory');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of ['index.html', 'styles.css', 'assets', 'about', 'posts', 'lab', 'notes']) {
  await cp(new URL(`../${file}`, import.meta.url), `${output}/${file}`, { recursive: true });
}
console.log('Built static website in dist/');
