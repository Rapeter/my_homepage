import { escapeHtml } from './site.js';

function inline(text) {
  const pattern = /`([^`]+)`|\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^\s)]+)\)|\*([^*]+)\*/g;
  let html = '', start = 0;
  for (const match of text.matchAll(pattern)) {
    html += escapeHtml(text.slice(start, match.index));
    const [, code, strong, label, url, emphasis] = match;
    if (code) html += `<code>${escapeHtml(code)}</code>`;
    else if (strong) html += `<strong>${escapeHtml(strong)}</strong>`;
    else if (label) {
      const safe = /^(https?:\/\/|mailto:|#|\.\.?\/)/i.test(url) && !/[\u0000-\u0020\\]/.test(url);
      html += safe ? `<a href="${escapeHtml(url)}">${escapeHtml(label)}</a>` : escapeHtml(label);
    } else html += `<em>${escapeHtml(emphasis)}</em>`;
    start = match.index + match[0].length;
  }
  return html + escapeHtml(text.slice(start));
}

// A small, escaped Markdown subset for repository-owned notes. Raw HTML is text.
export function renderMarkdown(source) {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const html = [], toc = [], ids = new Set();
  const isBlock = line => !line.trim() || /^(#{1,6}\s|\*\*Q\d+|\s*[-*+]\s|\s*\d+[.)]\s|>|```)/.test(line);
  for (let i = 0; i < lines.length;) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (line.startsWith('```')) {
      const code = []; i++;
      while (i < lines.length && !lines[i].startsWith('```')) code.push(lines[i++]);
      if (i < lines.length) i++;
      html.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`); continue;
    }
    const question = line.match(/^\*\*(Q(\d+).*?)\*\*\s*$/);
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (question || heading) {
      const title = question ? question[1] : heading[2];
      const base = question ? `q${question[2]}` : title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'section';
      let id = base, suffix = 2;
      while (ids.has(id)) id = `${base}-${suffix++}`;
      ids.add(id);
      const level = question ? 2 : Math.min(6, heading[1].length + 1);
      html.push(`<h${level} id="${id}">${inline(title)}</h${level}>`);
      toc.push({ id, title }); i++; continue;
    }
    const list = line.match(/^\s*(?:([-*+])|(\d+)[.)])\s+(.+)$/);
    if (list) {
      const tag = list[2] ? 'ol' : 'ul';
      const start = list[2] && list[2] !== '1' ? ` start="${Number(list[2])}"` : '';
      const items = [];
      while (i < lines.length) {
        const item = lines[i].match(/^\s*(?:([-*+])|(\d+)[.)])\s+(.+)$/);
        if (!item || Boolean(item[2]) !== Boolean(list[2])) break;
        items.push(`<li>${inline(item[3])}</li>`); i++;
      }
      html.push(`<${tag}${start}>${items.join('')}</${tag}>`); continue;
    }
    if (line.startsWith('>')) {
      const quotes = [];
      while (i < lines.length && lines[i].startsWith('>')) quotes.push(lines[i++].replace(/^>\s?/, ''));
      html.push(`<blockquote><p>${inline(quotes.join('\n'))}</p></blockquote>`); continue;
    }
    const paragraph = [line]; i++;
    while (i < lines.length && !isBlock(lines[i])) paragraph.push(lines[i++]);
    html.push(`<p>${inline(paragraph.join('\n'))}</p>`);
  }
  return { html: html.join('\n'), toc };
}
