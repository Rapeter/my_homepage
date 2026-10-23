import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {renderMarkdown} from '../scripts/markdown.js';

test('public interview copies keep confirmed dates and question units without identities or video clocks', async () => {
  const entries = JSON.parse(await readFile(new URL('../notes/collection.json', import.meta.url), 'utf8')).filter(entry => entry.type === 'interview');
  const expected = {
    'anker-ai-first':['2026-10-21',34,0,0],
    'bytedance-backend-first':['2026-10-20',35,1,1],
    'drip-ai-first':['2026-10-13',38,2,0],
    'sangfor-product-first':['2026-09-29',14,2,0],
  };
  assert.equal(entries.length,4);
  for (const entry of entries) {
    const [date,q,r,f] = expected[entry.slug];
    assert.equal(entry.interviewDate,date);
    const source = await readFile(new URL(`../notes/${entry.slug}.md`, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /\b\d{1,2}:\d{2}\b|[A-Z]:[\\/]|tmp\/|\.mp[34]|Folio|力拓|墨尔本|Confluence|kaizhong|71865/i);
    assert.match(source,/并非逐字稿/);
    assert.equal((source.match(/^### Q\d+/gm) || []).length,q);
    assert.equal((source.match(/^### R\d+/gm) || []).length,r);
    assert.equal((source.match(/^### F\d+/gm) || []).length,f);
    assert.doesNotMatch(source,/\]\([^)]*\.md\)/,'unpublished local follow-up links must not ship');
    const {toc} = renderMarkdown(source);
    assert.equal(new Set(toc.map(item => item.id)).size,toc.length);
  }
});
