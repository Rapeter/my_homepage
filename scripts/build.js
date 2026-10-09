import { cp, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const output = fileURLToPath(new URL('../dist/', import.meta.url));
await mkdir(output, { recursive: true });
for (const file of ['index.html', 'styles.css', 'src', 'assets']) {
  await cp(new URL(`../${file}`, import.meta.url), `${output}/${file}`, { recursive: true });
}
console.log('Built static website in dist/');
