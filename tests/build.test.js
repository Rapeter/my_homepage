import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, readdir, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));

test('building replaces stale output so removed chat and feed files cannot be published', async () => {
  await mkdir(new URL('../dist/src/', import.meta.url), { recursive: true });
  await writeFile(new URL('../dist/src/knowledge.js', import.meta.url), '// obsolete chat');
  await writeFile(new URL('../dist/atom.xml', import.meta.url), '<feed>obsolete</feed>');
  execFileSync(process.execPath, ['scripts/build.js'], { cwd: root });
  const entries = await readdir(new URL('../dist/', import.meta.url));
  assert.equal(entries.includes('src'), false, 'removed chat assets must not survive a rebuild');
  assert.equal(entries.includes('atom.xml'), false, 'removed subscription feed must not survive a rebuild');
  const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /src\/app\.js|chat-form|数字分身/);
});
