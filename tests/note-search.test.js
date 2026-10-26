import test from 'node:test';
import assert from 'node:assert/strict';

const load = () => import('../assets/note-search.js');

test('search sections index visible rendered content with the real section anchors', async () => {
  const {indexSections} = await load();
  assert.deepEqual(indexSections('<p>前言 &amp; 说明</p><h3 id="中文标题">权限</h3><p>校验 `token` &lt;script&gt;</p><h4 id="q02">TCP</h4><p>连接</p>'), [
    {id:'',title:'',text:'前言 & 说明'},
    {id:'中文标题',title:'权限',text:'权限 校验 `token` <script>'},
    {id:'q02',title:'TCP',text:'TCP 连接'},
  ]);
});

const records = [
  {slug:'one',title:'Agent 工程',description:'工程学习',tags:['Agent'],sections:[{id:'q01',title:'执行循环',text:'工具执行循环。'},{id:'q02',title:'权限',text:'TCP 和 Token 权限检查。'}]},
  {slug:'two',title:'TCP 连接',description:'网络学习',tags:['网络'],sections:[{id:'中文章节',title:'网络',text:'tcp 建立连接。'}]},
];
test('matches Chinese substrings, English case and multiple keywords across metadata and body', async () => {
  const {searchNotes} = await load();
  assert.deepEqual(searchNotes(records,'权限').map(hit=>hit.slug),['one']);
  assert.deepEqual(searchNotes(records,'TcP').map(hit=>hit.slug),['two','one']);
  assert.equal(searchNotes(records,'Agent TCP')[0].sections[0].id,'q02');
  assert.equal(searchNotes(records,'不存在').length,0);
  assert.equal(searchNotes(records,'    ').length,0);
  assert.equal(searchNotes(records,'TCP 不存在').length,0);
});
test('treats special characters literally and makes marked excerpts as text, not HTML', async () => {
  const {searchNotes,highlightParts} = await load();
  const literal=[{slug:'safe',title:'特殊内容',description:'',tags:[],sections:[{id:'x',title:'字符',text:'[] .* <img src=x onerror=alert(1)> & "你好"'}]}];
  assert.equal(searchNotes(literal,'[] .*').length,1);
  const parts=highlightParts('<img src=x onerror=alert(1)>','<img');
  assert.equal(parts.map(part=>part.text).join(''),'<img src=x onerror=alert(1)>');
  assert.equal(parts[0].match,true);
});
test('returns bounded readable excerpts centered near the hit even in long sections', async () => {
  const {searchNotes} = await load();
  const long=[{...records[0],sections:[{id:'q10',title:'长文',text:'前'.repeat(500)+'Checkpoint'+'后'.repeat(500)}]}];
  const section=searchNotes(long,'checkpoint')[0].sections[0];
  assert.ok(section.excerpt.includes('Checkpoint'));
  assert.ok(section.excerpt.length<220);
  assert.equal(section.id,'q10');
});

test('finds visible Chinese phrases spanning inline bold, links and code', async () => {
  const {indexSections,searchNotes} = await load();
  const sections=indexSections('<h3 id="业务">业务</h3><p>产品<strong>怎样被销售</strong>、<a href="https://example.com">交付</a>和<code>回款</code>。</p><p>下一段</p>');
  const corpus=[{slug:'product',title:'产品',description:'',tags:[],sections}];
  assert.equal(searchNotes(corpus,'产品怎样')[0]?.slug,'product');
  assert.equal(searchNotes(corpus,'和回款')[0]?.slug,'product');
  assert.match(sections[0].text,/回款。 下一段/,'block boundaries still separate paragraphs');
});
