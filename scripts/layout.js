import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { renderHeader, renderHeadExtras, renderPage, replaceBlock, sharedSidebar, unescapeHtml } from './site.js';

const root = new URL('../', import.meta.url);

// Replace a marked block, or insert it before `anchor` the first time a page is synced.
function upsert(html, name, content, anchor) {
  if (html.includes(`<!-- ${name} -->`)) return replaceBlock(html, name, content);
  if (!html.includes(anchor)) throw new Error(`Missing layout anchor for ${name}: ${anchor.trim()}`);
  const indent = anchor.match(/^\s*/)[0];
  return html.replace(anchor, () => `${indent}<!-- ${name} -->${content}<!-- /${name} -->\n${anchor}`);
}

async function layoutPages() {
  const posts = JSON.parse(await readFile(new URL('posts/collection.json', root), 'utf8'));
  return [
    { file: 'index.html', depth: 0, current: 'home', path: '' },
    { file: 'about/index.html', depth: 1, current: 'about', path: 'about/' },
    { file: 'lab/agent/index.html', depth: 2, current: 'lab', path: 'lab/agent/' },
    ...posts.map(({ slug }) => {
      if (!/^[a-z0-9-]+$/.test(slug)) throw new Error('Invalid article slug');
      return { file: `posts/${slug}/index.html`, depth: 2, current: 'home', section: true, path: `posts/${slug}/`, type: 'article' };
    }),
  ];
}

export async function syncLayout() {
  const home = await readFile(new URL('index.html', root), 'utf8');
  for (const page of await layoutPages()) {
    const url = new URL(page.file, root);
    const original = await readFile(url, 'utf8');
    const prefix = page.depth ? '../'.repeat(page.depth) : './';
    const title = original.match(/<title>([\s\S]*?)<\/title>/)?.[1];
    const description = original.match(/<meta name="description" content="([^"]*)"/)?.[1];
    if (!title || description === undefined) throw new Error(`Missing title or description: ${page.file}`);
    let html = original;
    if (page.file !== 'index.html') {
      let sidebar = sharedSidebar(home, prefix);
      if (page.current === 'about') sidebar = sidebar.replace(`<p class="about-link"><a href="${prefix}about/">`, '<p class="about-link"><a href="./" aria-current="page">');
      html = html.replace(/<aside class="sidebar"[\s\S]*?<\/aside>/, () => sidebar);
    }
    const extras = renderHeadExtras({ prefix, title: unescapeHtml(title), description: unescapeHtml(description), path: page.path, type: page.type, wechat: html.includes('wechat-contact') });
    html = upsert(html, 'site-head', `\n${extras}\n    `, '  </head>');
    html = upsert(html, 'site-header', renderHeader({ prefix, current: page.current, section: page.section }), '    <div class="site-layout">');
    if (html !== original) await writeFile(url, html);
  }
}

// GitHub Pages serves this file for any missing path, so its links resolve against the site root.
export async function generateNotFound() {
  const content = `<article class="reading-page not-found">
        <p class="not-found-code" aria-hidden="true">404</p>
        <h1>这个页面不存在</h1>
        <p class="page-intro">链接可能已经失效，或者地址输入有误<span data-missing-path hidden>：<code></code></span>。</p>
        <form class="not-found-search" action="notes/" method="get" role="search">
          <label for="not-found-query">在 Notes 中搜索</label>
          <div class="search-field"><input id="not-found-query" name="q" type="search" maxlength="160" placeholder="例如：Agent、TCP" autocomplete="off" /><button type="submit" class="button">搜索</button></div>
        </form>
        <nav class="not-found-links" aria-label="常用页面"><a class="button button-primary" href="./">回到首页</a><a class="button" href="projects/">看看项目</a><a class="button" href="notes/">浏览 Notes</a></nav>
      </article>`;
  let html = await renderPage({ title: '页面不存在', description: '你访问的页面不存在。', content, depth: 0, script: 'assets/not-found.js', indexable: false });
  html = html.replace('    <meta charset="UTF-8" />\n', () => `    <meta charset="UTF-8" />\n    <script>(() => { const base = document.createElement('base'); base.href = location.pathname.startsWith('/my_homepage/') ? '/my_homepage/' : '/'; document.head.append(base); })();</script>\n`);
  const url = new URL('404.html', root);
  const previous = await readFile(url, 'utf8').catch(() => '');
  if (previous !== html) await writeFile(url, html);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await syncLayout();
  await generateNotFound();
  console.log('Synced shared header, sidebar and page metadata');
}
