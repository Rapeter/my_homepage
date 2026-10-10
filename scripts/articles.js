import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { renderContentMeta } from './content-meta.js';

function replaceMetadata(html, name, metadata) {
  const start = `<!-- ${name} -->`, end = `<!-- /${name} -->`;
  const from = html.indexOf(start), to = html.indexOf(end, from + start.length);
  if (from < 0 || to < 0) throw new Error(`Missing metadata markers: ${name}`);
  return html.slice(0, from + start.length) + metadata + html.slice(to);
}

export async function generateArticles() {
  const entries = JSON.parse(await readFile(new URL('../posts/collection.json', import.meta.url), 'utf8'));
  const homeUrl = new URL('../index.html', import.meta.url);
  const originalHome = await readFile(homeUrl, 'utf8');
  let home = originalHome;
  for (const entry of entries) {
    if (!/^[a-z0-9-]+$/.test(entry.slug)) throw new Error('Invalid article slug');
    const url = new URL(`../posts/${entry.slug}/index.html`, import.meta.url);
    const original = await readFile(url, 'utf8');
    const body = original.match(/<!-- article-body -->([\s\S]*?)<!-- \/article-body -->/)?.[1];
    const date = original.match(/<time\b[^>]*datetime="([^"]+)"/)?.[1];
    if (body === undefined || !date) throw new Error(`Missing body markers or publication date: ${entry.slug}`);
    const metadata = renderContentMeta(body, entry.tags, { date });
    const page = replaceMetadata(original, 'article-meta', metadata);
    home = replaceMetadata(home, `post-meta:${entry.slug}`, metadata);
    if (page !== original) await writeFile(url, page);
  }
  if (home !== originalHome) await writeFile(homeUrl, home);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await generateArticles();
  console.log('Updated article metadata on homepage and reading pages');
}
