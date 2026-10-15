import { escapeHtml } from './site.js';

// Count the rendered body, excluding markup, link destinations and page chrome.
export function contentStats(html) {
  const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  const text = html.replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (_, entity) => {
      if (!entity.startsWith('#')) return entities[entity.toLowerCase()];
      const point = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
      return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : ' ';
    });
  const chinese = (text.match(/\p{Script=Han}/gu) || []).length;
  const other = (text.replace(/\p{Script=Han}/gu, ' ').match(/[\p{L}\p{N}][\p{L}\p{N}\p{M}]*(?:['’_-][\p{L}\p{N}\p{M}]+)*/gu) || []).length;
  return { words: chinese + other, minutes: Math.max(1, Math.ceil(chinese / 300 + other / 200)) };
}

const icon = (body) => `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const calendar = icon('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>');
const clock = icon('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>');
const document = icon('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h6"/>');
const tagIcon = icon('<path d="M20 13l-7 7a2 2 0 0 1-3 0l-8-8V3h9l9 7a2 2 0 0 1 0 3Z"/><circle cx="7.5" cy="7.5" r="1"/>');

export function renderContentMeta(html, tags = [], { date, dateLabel = '', tagBase = '' } = {}) {
  const { words, minutes } = contentStats(html);
  const dateItem = date ? `<span class="meta-item">${calendar}<span>${escapeHtml(dateLabel)}<time datetime="${escapeHtml(date)}">${escapeHtml(date)}</time></span></span>` : '';
  const tagItems = tags.map(tag => tagBase
    ? `<a class="content-tag" href="${escapeHtml(tagBase)}?tag=${escapeHtml(encodeURIComponent(tag))}">${escapeHtml(tag)}</a>`
    : `<span class="content-tag">${escapeHtml(tag)}</span>`).join('');
  return `<div class="content-meta" aria-label="文章信息">${dateItem}<span class="meta-item">${clock}<span>约 ${minutes} 分钟</span></span><span class="meta-item" title="汉字逐字、英文按词统计；仅计算正文">${document}<span>${words.toLocaleString('zh-CN')} 字</span></span>${tags.length ? `<span class="meta-item meta-tags">${tagIcon}<span class="tag-list">${tagItems}</span></span>` : ''}</div>`;
}
