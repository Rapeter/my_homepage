import test from 'node:test';
import assert from 'node:assert/strict';
import { contentStats, renderContentMeta } from '../scripts/content-meta.js';

test('counts visible Chinese characters and English words without markup, URLs or punctuation', () => {
  const html = '<p>你好，Agent harness！<a href="https://example.com/long-invisible-url">链接</a> &amp; &#20013; &#x6587;</p><!-- hidden --><script>hidden words</script><style>hidden css</style><p>next</p>';
  assert.deepEqual(contentStats(html), { words: 9, minutes: 1 });
  assert.deepEqual(contentStats('<p>！！ &nbsp; 😊</p>'), { words: 0, minutes: 1 });
});

test('estimates Chinese and English reading time separately for mixed content', () => {
  assert.deepEqual(contentStats(`<p>${'中'.repeat(300)} ${'word '.repeat(200)}</p>`), { words: 500, minutes: 2 });
  assert.equal(contentStats(`<p>${'中'.repeat(301)}</p>`).minutes, 2);
});

test('renders readable metadata and escapes author-supplied tags', () => {
  const html = renderContentMeta('<p>你好 Agent</p>', ['Agent', '<script>'], { date: '2026-10-10', dateLabel: '更新于 ' });
  assert.match(html, /datetime="2026-10-10"/);
  assert.match(html, /更新于 /);
  assert.match(html, /约 1 分钟/);
  assert.match(html, /3 字/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
});
