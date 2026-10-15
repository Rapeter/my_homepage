import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { renderPage, escapeHtml } from './site.js';
import { renderMarkdown } from './markdown.js';
import { renderContentMeta } from './content-meta.js';

async function save(url, content) {
  const previous = await readFile(url, 'utf8').catch(() => '');
  if (previous !== content) await writeFile(url, content);
}

export async function generateNotes() {
  const entries = JSON.parse(await readFile(new URL('../notes/collection.json', import.meta.url), 'utf8'));
  for (const entry of entries) {
    if (!/^[a-z0-9-]+$/.test(entry.slug)) throw new Error('Note slug must contain lowercase letters, numbers or hyphens');
  }
  const homeUrl = new URL('../index.html', import.meta.url);
  const home = await readFile(homeUrl, 'utf8');
  const latest = [...entries].sort((a, b) => b.updated.localeCompare(a.updated))[0];
  const latestHtml = latest
    ? `<p data-latest-note><span class="update-label">最新笔记</span><a href="./notes/${escapeHtml(latest.slug)}/">${escapeHtml(latest.title)}</a><time datetime="${escapeHtml(latest.updated)}">${escapeHtml(latest.updated)}</time></p>`
    : '<p data-latest-note hidden></p>';
  // Keep the homepage entry in sync when notes are added or their dates change.
  await save(homeUrl, home.replace(/<!-- latest-note -->[\s\S]*?<!-- \/latest-note -->/, `<!-- latest-note -->${latestHtml}<!-- /latest-note -->`));
  const list = [];
  for (const entry of entries) {
    const source = await readFile(new URL(`../notes/${entry.slug}.md`, import.meta.url), 'utf8');
    const { html, toc } = renderMarkdown(source);
    const metadata = renderContentMeta(html, entry.tags, { date: entry.updated, dateLabel: '更新于 ', tagBase: '../' });
    const content = `<article class="reading-page notes-page" data-note-id="${escapeHtml(entry.slug)}">
      <nav class="breadcrumbs" aria-label="位置"><a href="../../">首页</a><span aria-hidden="true">›</span><a href="../">Notes</a><span aria-hidden="true">›</span>${escapeHtml(entry.title)}</nav>
      <h1>${escapeHtml(entry.title)}</h1>
      ${metadata}
      <p class="note-meta">${escapeHtml(entry.status)} · <a href="../${entry.slug}.md" download>Markdown 原文</a></p>
      <p class="page-intro">${escapeHtml(entry.description)}</p>
      <button type="button" class="resume-reading" data-resume-reading hidden>继续阅读</button>
      ${toc.length ? `<details class="note-toc"><summary>目录 · ${toc.length} 个条目<span class="toc-position" aria-hidden="true"></span></summary><ol>${toc.map(item => `<li><a href="#${item.id}">${escapeHtml(item.title)}</a></li>`).join('')}</ol></details>` : ''}
      <div class="prose note-body">${html}</div>
      <p class="back-link"><a href="../">← 回到 Notes</a></p>
    </article>`;
    const directory = new URL(`../notes/${entry.slug}/`, import.meta.url);
    await mkdir(directory, { recursive: true });
    await save(new URL('index.html', directory), await renderPage({ title: entry.title, description: entry.description, content, depth: 2, script: 'assets/notes.js' }));
    const listMetadata = renderContentMeta(html, entry.tags, { date: entry.updated, dateLabel: '更新于 ', tagBase: './' });
    list.push(`<li data-note-tags="${escapeHtml(JSON.stringify(entry.tags || []))}"><a href="./${entry.slug}/">${escapeHtml(entry.title)}</a>${listMetadata}<p class="note-meta">${escapeHtml(entry.status)} · ${toc.length} 个条目</p><p>${escapeHtml(entry.description)}</p></li>`);
  }
  const tags = [...new Set(entries.flatMap(entry => entry.tags || []))];
  await save(new URL('../notes/index.html', import.meta.url), await renderPage({ title: 'Notes', description: '持续整理和更新的学习笔记。', content: `<article class="reading-page notes-page">
    <nav class="breadcrumbs" aria-label="位置"><a href="../">首页</a><span aria-hidden="true">›</span>Notes</nav>
    <h1>Notes</h1><p class="page-intro">边学边记，持续整理和更新。</p>
    <div class="note-filters" role="group" aria-label="按标签筛选笔记" hidden><button type="button" data-note-filter="" aria-pressed="true">全部</button>${tags.map(tag => `<button type="button" data-note-filter="${escapeHtml(tag)}" aria-pressed="false">${escapeHtml(tag)}</button>`).join('')}</div>
    <p class="filter-status" data-filter-status role="status" hidden></p>
    <ul class="notes-list">${list.join('\n')}</ul>
  </article>`, script: 'assets/notes.js' }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await generateNotes();
  console.log('Generated Notes pages from Markdown');
}
