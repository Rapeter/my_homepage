import { createServer } from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const root = await realpath(resolve(process.argv[2] || '.'));
const port = Number(process.env.PORT || 4173);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg' };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const pagePath = pathname.endsWith('/') ? `${pathname}index.html` : !extname(pathname) ? `${pathname}/index.html` : pathname;
    const file = await realpath(resolve(root, `.${pagePath}`));
    const relative = file.slice(root.length + 1);
    const allowed = ['index.html', 'styles.css'].includes(relative) || ['about', 'posts', 'assets'].some((dir) => relative.startsWith(`${dir}${sep}`));
    if (!file.startsWith(`${root}${sep}`) || !allowed || !types[extname(file)]) {
      response.writeHead(404).end('Not found');
      return;
    }
    const content = await readFile(file);
    response.writeHead(200, { 'Content-Type': types[extname(file)], 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    response.end(content);
  } catch {
    response.writeHead(404).end('Not found');
  }
});
server.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}`));
