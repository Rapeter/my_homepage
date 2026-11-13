import { readFile } from 'node:fs/promises';

export const siteUrl = 'https://rapeter.github.io/my_homepage/';

export const escapeHtml = (value) => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
export const unescapeHtml = (value) => String(value).replace(/&(amp|lt|gt|quot|#39);/g, (_, name) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" }[name]));

export function replaceBlock(html, name, content) {
  const start = `<!-- ${name} -->`, end = `<!-- /${name} -->`;
  const from = html.indexOf(start), to = html.indexOf(end, from + start.length);
  if (from < 0 || to < 0) throw new Error(`Missing markers: ${name}`);
  return html.slice(0, from + start.length) + content + html.slice(to);
}

const navItems = [
  { key: 'home', label: '首页', href: '' },
  { key: 'projects', label: '项目', href: 'projects/' },
  { key: 'notes', label: 'Notes', href: 'notes/' },
  { key: 'lab', label: '小实验', href: 'lab/agent/' },
  { key: 'about', label: '关于我', href: 'about/' },
];

// `section` marks a page that belongs to a nav item without being that page, such as an article.
export function renderHeader({ prefix, current = '', section = false }) {
  const links = navItems.map(item => {
    const state = item.key === current ? ` aria-current="${section ? 'true' : 'page'}"` : '';
    return `<a href="${prefix}${item.href}"${state}>${item.label}</a>`;
  }).join('');
  return `<header class="site-header"><a class="site-brand" href="${prefix}"><img class="site-brand-avatar" src="${prefix}assets/avatar-small.jpg" alt="" width="32" height="32" /><span>Zhong</span></a><nav class="site-nav" aria-label="站点导航">${links}</nav><div class="site-header-actions" data-theme-actions></div></header>`;
}

export function renderHeadExtras({ prefix, title, description, path = '', type = 'website', wechat = false, indexable = true }) {
  const url = `${siteUrl}${path}`;
  const scripts = [
    `<script type="module" src="${prefix}assets/page-tools.js"></script>`,
    ...(wechat ? [`<script type="module" src="${prefix}assets/about-contact.js"></script>`] : []),
  ];
  if (!indexable) return ['<meta name="robots" content="noindex" />', ...scripts].map(line => `    ${line}`).join('\n');
  return [
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    `<meta property="og:site_name" content="Zhong" />`,
    `<meta property="og:locale" content="zh_CN" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    `<meta property="og:image" content="${siteUrl}assets/avatar.jpg" />`,
    `<meta name="twitter:card" content="summary" />`,
    ...scripts,
  ].map(line => `    ${line}`).join('\n');
}

// The homepage sidebar is the single source for every page's sidebar.
export function sharedSidebar(home, prefix) {
  const sidebar = home.match(/<aside class="sidebar"[\s\S]*?<\/aside>/)?.[0];
  if (!sidebar) throw new Error('Homepage sidebar is missing');
  return sidebar.replace(/(href|src)="\.\//g, (_, attribute) => `${attribute}="${prefix}`);
}

export async function renderPage({ title, description, content, depth = 1, script = '', path = '', current = '', section = false, indexable = true }) {
  const prefix = depth ? '../'.repeat(depth) : './';
  const home = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const sidebar = sharedSidebar(home, prefix);
  const fullTitle = `${title} · Zhong`;
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#f0f9ff" />
    <meta name="description" content="${escapeHtml(description)}" />
    <title>${escapeHtml(fullTitle)}</title>
    <link rel="icon" href="${prefix}assets/favicon-avatar.ico" type="image/x-icon" />
    <script src="${prefix}assets/theme.js"></script>
    <link rel="stylesheet" href="${prefix}styles.css" />
${renderHeadExtras({ prefix, title: fullTitle, description, path, type: depth > 1 ? 'article' : 'website', wechat: sidebar.includes('wechat-contact'), indexable })}
${script ? `    <script type="module" src="${prefix}${script}"></script>\n` : ''}  </head>
  <body>
    <a class="skip-link" href="#content">跳到正文</a>
    ${renderHeader({ prefix, current, section })}
    <div class="site-layout">
      <main id="content" class="main-column" tabindex="-1">${content}</main>
      ${sidebar}
    </div>
  </body>
</html>
`;
}
