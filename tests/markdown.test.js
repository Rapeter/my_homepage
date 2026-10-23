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

test('interview questions keep stable links and nested TOC levels', () => {
  const rendered = renderMarkdown('## 项目追问\n\n### Q01｜项目是什么？\n回答\n\n### R01｜我的反问\n内容');
  assert.deepEqual(rendered.toc.map(({id, level}) => ({id, level})), [
    {id:'项目追问',level:3}, {id:'q01',level:4}, {id:'r01',level:4},
  ]);
  assert.match(rendered.html, /id="q01"/);
});

test('comparison tables render safely rather than as pipe-delimited paragraphs', () => {
  const rendered = renderMarkdown('| 判断 | 说明 |\n|---|---|\n| **价值** | <script> & 业务 |');
  assert.match(rendered.html, /<table>/);
  assert.match(rendered.html, /<th scope="col">判断<\/th>/);
  assert.match(rendered.html, /<td><strong>价值<\/strong><\/td>/);
  assert.match(rendered.html, /&lt;script&gt;/);
});
