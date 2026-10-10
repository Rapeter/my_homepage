import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, cp, writeFile, readFile, rm } from 'node:fs/promises';
import { join, dirname, resolve, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';

test('editing article body or tags updates both homepage and article metadata', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'homepage-articles-'));
  try {
    await mkdir(join(workspace, 'scripts'));
    await mkdir(join(workspace, 'posts', 'first'), { recursive: true });
    for (const file of ['articles.js', 'content-meta.js', 'site.js']) await cp(new URL(`../scripts/${file}`, import.meta.url), join(workspace, 'scripts', file));
    await writeFile(join(workspace, 'package.json'), '{"type":"module"}');
    await writeFile(join(workspace, 'index.html'), '<li><a href="./posts/first/">第一篇</a><!-- post-meta:first --><!-- /post-meta:first --></li>');
    const entries = [{ slug: 'first', tags: ['随笔'] }];
    const collection = join(workspace, 'posts', 'collection.json');
    await writeFile(collection, JSON.stringify(entries));
    const article = join(workspace, 'posts', 'first', 'index.html');
    await writeFile(article, '<h1>第一篇</h1><!-- article-meta --><time datetime="2026-10-09">日期</time><!-- /article-meta --><!-- article-body --><p>你好 Agent</p><!-- /article-body --><aside>不计入正文</aside>');
    const generate = () => execFileSync(process.execPath, ['scripts/articles.js'], { cwd: workspace });
    generate();
    const first = await readFile(article, 'utf8');
    assert.match(first, /3 字/);
    assert.match(first, /随笔/);
    await writeFile(article, first.replace('<p>你好 Agent</p>', `<p>${'中'.repeat(301)}</p>`));
    entries[0].tags = ['工程化'];
    await writeFile(collection, JSON.stringify(entries));
    generate();
    for (const file of ['index.html', 'posts/first/index.html']) {
      const html = await readFile(join(workspace, file), 'utf8');
      assert.match(html, /301 字/);
      assert.match(html, /约 2 分钟/);
      assert.match(html, /工程化/);
      assert.match(html, /datetime="2026-10-09"/);
      assert.doesNotMatch(html, /随笔/);
    }
    const updated = await readFile(article, 'utf8');
    generate();
    assert.equal(await readFile(article, 'utf8'), updated, 'repeated generation must be stable');
  } finally {
    if (dirname(workspace) !== resolve(tmpdir()) || !basename(workspace).startsWith('homepage-articles-')) throw new Error('Invalid temporary test directory');
    await rm(workspace, { recursive: true, force: true });
  }
});
