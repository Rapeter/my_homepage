import { readFile } from 'node:fs/promises';

export const escapeHtml = (value) => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

export async function renderPage({ title, description, content, depth = 1, script = '' }) {
  const prefix = '../'.repeat(depth);
  const home = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const sidebar = home.match(/<aside class="sidebar"[\s\S]*?<\/aside>/)[0]
    .replace(/href="\.\//g, `href="${prefix}`);
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#f0f9ff" />
    <meta name="description" content="${escapeHtml(description)}" />
    <title>${escapeHtml(title)} · Zhong</title>
    <link rel="icon" href="${prefix}assets/favicon.svg" type="image/svg+xml" />
    <link rel="stylesheet" href="${prefix}styles.css" />
${script ? `    <script type="module" src="${prefix}${script}"></script>\n` : ''}  </head>
  <body>
    <a class="skip-link" href="#content">跳到正文</a>
    <div class="site-layout">
      <main id="content" class="main-column" tabindex="-1">${content}</main>
      ${sidebar}
    </div>
  </body>
</html>
`;
}
