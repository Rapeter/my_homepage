import test from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown } from '../scripts/markdown.js';

test('publishes question headings with stable unique anchors and code as text', () => {
  const rendered = renderMarkdown('**Q1：是什么？**\n原文包含 `core_intent`。\n\n**Q1：补充**\n\n- **要点**\n\n```js\nconst x = "<script>";\n```');
  assert.deepEqual(rendered.toc.map(item => item.id), ['q1', 'q1-2']);
  assert.match(rendered.html, /<code>core_intent<\/code>/);
  assert.match(rendered.html, /<li><strong>要点<\/strong><\/li>/);
  assert.match(rendered.html, /&lt;script&gt;/);
});

test('note content cannot introduce raw HTML or executable links', () => {
  const rendered = renderMarkdown('<img src=x onerror=alert(1)>\n\n[unsafe](javascript:alert) [safe](https://example.com)');
  assert.doesNotMatch(rendered.html, /<img|href="javascript:/);
  assert.match(rendered.html, /&lt;img/);
  assert.match(rendered.html, /href="https:\/\/example.com"/);
});
