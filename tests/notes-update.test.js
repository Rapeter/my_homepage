import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, cp, writeFile, readFile, rm } from 'node:fs/promises';
import { resolve, join, dirname, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';

test('regenerating Notes publishes edited Markdown and new collection entries', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'homepage-notes-'));
  try {
    await mkdir(join(workspace, 'scripts'));
    await mkdir(join(workspace, 'notes'));
    for (const file of ['site.js', 'notes.js', 'markdown.js', 'content-meta.js']) await cp(new URL(`../scripts/${file}`, import.meta.url), join(workspace, 'scripts', file));
    await cp(new URL('../index.html', import.meta.url), join(workspace, 'index.html'));
    await writeFile(join(workspace, 'package.json'), '{"type":"module"}');
    const entries = [{ slug: 'first', title: '第一篇', description: '持续更新', status: '整理中', updated: '2026-10-10', tags: ['Agent', '工程化'] }];
    const generate = () => execFileSync(process.execPath, ['scripts/notes.js'], { cwd: workspace });
    await writeFile(join(workspace, 'notes', 'collection.json'), JSON.stringify(entries));
    await writeFile(join(workspace, 'notes', 'first.md'), '**Q1：原题**\n原版内容');
    generate();
    assert.match(await readFile(join(workspace, 'notes', 'first', 'index.html'), 'utf8'), /原版内容/);
    await writeFile(join(workspace, 'notes', 'first.md'), '**Q1：改题**\n更新后的内容');
    entries.push({ ...entries[0], slug: 'second', title: '第二篇' });
    await writeFile(join(workspace, 'notes', 'collection.json'), JSON.stringify(entries));
    await writeFile(join(workspace, 'notes', 'second.md'), '# 新笔记\n新的正文');
    generate();
    const updated = await readFile(join(workspace, 'notes', 'first', 'index.html'), 'utf8');
    assert.match(updated, /更新后的内容/);
    assert.match(updated, /9 字/);
    assert.match(updated, /约 1 分钟/);
    assert.match(updated, /工程化/);
    const directory = await readFile(join(workspace, 'notes', 'index.html'), 'utf8');
    assert.match(directory, /9 字/);
    assert.doesNotMatch(updated, /原版内容/);
    assert.match(await readFile(join(workspace, 'notes', 'index.html'), 'utf8'), /第一篇[\s\S]*第二篇/);
    assert.match(await readFile(join(workspace, 'notes', 'second', 'index.html'), 'utf8'), /新的正文/);
  } finally {
    if (dirname(workspace) !== resolve(tmpdir()) || !basename(workspace).startsWith('homepage-notes-')) throw new Error('Invalid temporary test directory');
    await rm(workspace, { recursive: true, force: true });
  }
});
