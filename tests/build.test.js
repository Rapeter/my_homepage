import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, readdir, readFile, access } from 'node:fs/promises';
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
  for (const path of ['lab/agent/index.html', 'assets/agent-demo.js', 'assets/theme.js', 'assets/chiikawa-stars.svg', 'notes/index.html', 'notes/agent-interview/index.html', 'notes/agent-interview.md', '404.html', 'projects/index.html', 'assets/page-tools.js', 'assets/not-found.js']) {
    const published = await access(new URL(`../dist/${path}`, import.meta.url)).then(() => true, () => false);
    assert.equal(published, true, `${path} must be published`);
  }
  const sidebar = html.match(/<aside class="sidebar"[\s\S]*?<\/aside>/)[0].replace(/(href|src)="\.\//g, '$1="../');
  for (const path of ['about/index.html', 'projects/index.html', 'notes/index.html']) {
    const page = await readFile(new URL(`../dist/${path}`, import.meta.url), 'utf8');
    assert.match(page, /class="site-header"/, `${path} must share the site header`);
    assert.ok(page.replace(/ aria-current="page"/g, '').replace('<a href="./">更多关于', '<a href="../about/">更多关于').includes(sidebar), `${path} must use the homepage sidebar`);
  }
  const note = await readFile(new URL('../dist/notes/agent-interview/index.html', import.meta.url), 'utf8');
  assert.equal((note.match(/<h2 id="q\d+"/g) || []).length, 20);
  assert.match(note, /整理中/);
  assert.match(note, /core_intent/);
});
