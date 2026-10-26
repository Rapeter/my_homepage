import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { renderPage, escapeHtml } from './site.js';
import { renderMarkdown } from './markdown.js';
import { renderContentMeta } from './content-meta.js';
import { indexSections } from '../assets/note-search.js';

async function save(url, content) {
  const previous = await readFile(url, 'utf8').catch(() => '');
  if (previous !== content) await writeFile(url, content);
}

function renderToc(toc) {
  const root = {level:0, children:[]}, stack = [root];
  for (const item of toc) {
    while (stack.length > 1 && stack.at(-1).level >= item.level) stack.pop();
    const node = {...item, children:[]};
    stack.at(-1).children.push(node); stack.push(node);
  }
  const render = nodes => `<ol>${nodes.map(item => `<li><a href="#${escapeHtml(item.id)}">${escapeHtml(item.title)}</a>${item.children.length ? render(item.children) : ''}</li>`).join('')}</ol>`;
  return render(root.children);
}

export async function generateNotes() {
  const entries = JSON.parse(await readFile(new URL('../notes/collection.json', import.meta.url), 'utf8'));
  for (const entry of entries) {
    if (!/^[a-z0-9-]+$/.test(entry.slug)) throw new Error('Note slug must contain lowercase letters, numbers or hyphens');
  }
  const homeUrl = new URL('../index.html', import.meta.url);
  const home = await readFile(homeUrl, 'utf8');
  const latest = [...entries].sort((a, b) => b.updated.localeCompare(a.updated) || (b.interviewDate || '').localeCompare(a.interviewDate || ''))[0];
  const latestHtml = latest
    ? `<p data-latest-note><span class="update-label">最新笔记</span><a href="./notes/${escapeHtml(latest.slug)}/">${escapeHtml(latest.title)}</a><time datetime="${escapeHtml(latest.updated)}">更新于 ${escapeHtml(latest.updated)}</time></p>`
    : '<p data-latest-note hidden></p>';
  // Keep the homepage entry in sync when notes are added or their dates change.
  await save(homeUrl, home.replace(/<!-- latest-note -->[\s\S]*?<!-- \/latest-note -->/, `<!-- latest-note -->${latestHtml}<!-- /latest-note -->`));
  const list = [], searchIndex = [];
  for (const entry of [...entries].sort((a, b) => (b.interviewDate || b.updated).localeCompare(a.interviewDate || a.updated))) {
    const source = await readFile(new URL(`../notes/${entry.slug}.md`, import.meta.url), 'utf8');
    const interview = entry.type === 'interview';
    const rendered = renderMarkdown(interview ? source.replace(/^# [^\n]+\r?\n+/, '') : source);
    const toc = rendered.toc;
    searchIndex.push({slug:entry.slug, title:entry.title, description:entry.description, tags:entry.tags || [], sections:indexSections(rendered.html)});
    const html = interview ? rendered.html.replace(/(<h[2-6] id="([qrf]\d+(?:-\d+)?)">)([\s\S]*?)(<\/h[2-6]>)/g, (_, open, id, title, close) => `${open}${title} <a class="question-link" href="#${id}" aria-label="链接到此问题">#</a>${close}`) : rendered.html;
    const metadata = renderContentMeta(html, entry.tags, { date: entry.updated, dateLabel: '更新于 ', tagBase: '../' });
    const interviewDate = interview && entry.interviewDate ? `面试于 <time datetime="${escapeHtml(entry.interviewDate)}">${escapeHtml(entry.interviewDate)}</time> · ` : '';
    const content = `<article class="reading-page notes-page" data-note-id="${escapeHtml(entry.slug)}">
      <nav class="breadcrumbs" aria-label="位置"><a href="../../">首页</a><span aria-hidden="true">›</span><a href="../">Notes</a><span aria-hidden="true">›</span>${escapeHtml(entry.title)}</nav>
      <h1>${escapeHtml(entry.title)}</h1>
      ${metadata}
      <p class="note-meta">${interviewDate}${escapeHtml(entry.status)} · <a href="../${entry.slug}.md" download>${interview ? '下载公开版' : 'Markdown 原文'}</a></p>
      <p class="page-intro">${escapeHtml(entry.description)}</p>
      <button type="button" class="resume-reading" data-resume-reading hidden>继续阅读</button>
      ${toc.length ? `<details class="note-toc"><summary>目录 · ${toc.length} 个条目<span class="toc-position" aria-hidden="true"></span></summary>${renderToc(toc)}</details>` : ''}
      <div class="prose note-body">${html}</div>
      <p class="back-link"><a href="../">← 回到 Notes</a></p>
    </article>`;
    const directory = new URL(`../notes/${entry.slug}/`, import.meta.url);
    await mkdir(directory, { recursive: true });
    await save(new URL('index.html', directory), await renderPage({ title: entry.title, description: entry.description, content, depth: 2, script: 'assets/notes.js' }));
    const listMetadata = renderContentMeta(html, entry.tags, { date: entry.updated, dateLabel: '更新于 ', tagBase: './' });
    list.push(`<li data-note-slug="${escapeHtml(entry.slug)}" data-note-category="${interview ? 'interview' : 'learning'}" data-note-tags="${escapeHtml(JSON.stringify(entry.tags || []))}"><a href="./${entry.slug}/">${escapeHtml(entry.title)}</a>${listMetadata}<p class="note-meta">${interviewDate}${escapeHtml(entry.status)}</p><p>${escapeHtml(entry.description)}</p></li>`);
  }
  const tags = [...new Set(entries.flatMap(entry => entry.tags || []))];
  await save(new URL('../notes/index.html', import.meta.url), await renderPage({ title: 'Notes', description: '持续整理和更新的学习笔记。', content: `<article class="reading-page notes-page">
    <nav class="breadcrumbs" aria-label="位置"><a href="../">首页</a><span aria-hidden="true">›</span>Notes</nav>
    <h1>Notes</h1><p class="page-intro">边学边记，持续整理和更新。</p>
    <form class="note-search" role="search" hidden>
      <label for="note-search">搜索笔记与面试记录</label>
      <div class="search-field"><input id="note-search" name="q" type="search" maxlength="160" placeholder="搜索正文，如：权限、Checkpoint、TCP" aria-describedby="search-help" autocomplete="off" /><button type="button" class="search-clear" hidden>清除搜索</button></div>
      <p id="search-help">多个关键词可用空格分隔，也可以结合分类和标签筛选。</p>
    </form>
    <div class="note-categories" role="group" aria-label="笔记分类" hidden><button type="button" data-category-filter="" aria-pressed="true">全部</button><button type="button" data-category-filter="learning" aria-pressed="false">学习笔记</button><button type="button" data-category-filter="interview" aria-pressed="false">面试记录</button></div>
    <div class="note-filters" role="group" aria-label="按标签筛选笔记" hidden><button type="button" data-note-filter="" aria-pressed="true">全部</button>${tags.map(tag => `<button type="button" data-note-filter="${escapeHtml(tag)}" aria-pressed="false">${escapeHtml(tag)}</button>`).join('')}</div>
    <p class="filter-status" data-filter-status role="status" hidden></p>
    <ul class="notes-list">${list.join('\n')}</ul>
    <script id="note-search-index" type="application/json">${JSON.stringify(searchIndex).replace(/[<>&\u2028\u2029]/g, char => `\\u${char.charCodeAt(0).toString(16).padStart(4,'0')}`)}</script>
  </article>`, script: 'assets/notes.js' }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await generateNotes();
  console.log('Generated Notes pages from Markdown');
}
