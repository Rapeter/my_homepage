import { createServer } from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const root = await realpath(resolve(process.argv[2] || '.'));
const port = Number(process.env.PORT || 4173);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.js': 'text/javascript; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.pdf': 'application/pdf' };
const headers = type => ({ 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
// Mirror GitHub Pages: unknown paths get the site's 404 page.
async function notFound(response) {
  const page = await readFile(resolve(root, '404.html')).catch(() => null);
  if (page) response.writeHead(404, headers(types['.html'])).end(page);
  else response.writeHead(404).end('Not found');
}
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const pagePath = pathname.endsWith('/') ? `${pathname}index.html` : !extname(pathname) ? `${pathname}/index.html` : pathname;
    const file = await realpath(resolve(root, `.${pagePath}`));
    const relative = file.slice(root.length + 1);
    const allowed = ['index.html', '404.html', 'styles.css'].includes(relative) || ['about', 'posts', 'projects', 'assets', 'lab', 'notes'].some((dir) => relative.startsWith(`${dir}${sep}`));
    if (!file.startsWith(`${root}${sep}`) || !allowed || !types[extname(file)]) {
      await notFound(response);
      return;
    }
    const content = await readFile(file);
    response.writeHead(200, headers(types[extname(file)]));
    response.end(content);
  } catch {
    await notFound(response);
  }
});
server.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}`));
