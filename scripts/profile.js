import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { escapeHtml, renderPage, replaceBlock } from './site.js';

const root = new URL('../', import.meta.url);
export const resumeFile = 'assets/resume.pdf';
const homeFeaturedLimit = 4;

async function save(url, content) {
  const previous = await readFile(url, 'utf8').catch(() => '');
  if (previous !== content) await writeFile(url, content);
}

const text = (value, field, required = false) => {
  if (value === undefined || value === null || value === '') {
    if (required) throw new Error(`Missing required field: ${field}`);
    return '';
  }
  if (typeof value !== 'string') throw new Error(`Field must be a string: ${field}`);
  return value.trim();
};
const list = (value, field) => {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error(`Field must be an array: ${field}`);
  return value.map((item, index) => text(item, `${field}[${index}]`, true));
};

// External links must use HTTPS; internal links are paths relative to the site root.
export function resolveHref(href, prefix, field) {
  const value = text(href, field, true);
  if (/^https:\/\/[^\s"'<>]+$/.test(value)) return { href: value, external: true };
  if (/^(?:[a-z0-9][a-z0-9-]*\/)*(?:#[a-z0-9-]+)?$/.test(value)) return { href: `${prefix}${value}`, external: false };
  throw new Error(`Unsupported link in ${field}: ${value}`);
}

export function normalizeProjects(entries) {
  if (!Array.isArray(entries)) throw new Error('projects/collection.json must be an array');
  const slugs = new Set();
  return entries.map((entry, index) => {
    const at = `projects[${index}]`;
    const slug = text(entry.slug, `${at}.slug`, true);
    if (!/^[a-z0-9-]+$/.test(slug) || slugs.has(slug)) throw new Error(`Invalid or duplicate project slug: ${slug}`);
    slugs.add(slug);
    const links = (entry.links || []).map((link, linkIndex) => ({ label: text(link.label, `${at}.links[${linkIndex}].label`, true), href: text(link.href, `${at}.links[${linkIndex}].href`, true) }));
    for (const [linkIndex, link] of links.entries()) resolveHref(link.href, '', `${at}.links[${linkIndex}].href`);
    return {
      slug,
      title: text(entry.title, `${at}.title`, true),
      summary: text(entry.summary, `${at}.summary`, true),
      role: text(entry.role, `${at}.role`),
      period: text(entry.period, `${at}.period`),
      stack: list(entry.stack, `${at}.stack`),
      highlights: list(entry.highlights, `${at}.highlights`),
      links,
      featured: entry.featured === true,
    };
  });
}

function renderLinks(links, prefix) {
  if (!links.length) return '';
  return `<p class="project-links">${links.map(link => {
    const { href, external } = resolveHref(link.href, prefix, 'link');
    return `<a href="${escapeHtml(href)}"${external ? ' rel="noopener"' : ''}>${escapeHtml(link.label)}${external ? '<span class="visually-hidden">（外部链接）</span> ↗' : ' →'}</a>`;
  }).join('')}</p>`;
}

export function renderProjectCard(project, { prefix, level, detailed }) {
  const meta = [project.role, project.period].filter(Boolean).map(escapeHtml).join(' · ');
  return `<li class="project-card" id="${escapeHtml(project.slug)}"><article>
  <h${level}>${escapeHtml(project.title)}</h${level}>
  ${meta ? `<p class="project-meta">${meta}</p>` : ''}
  <p class="project-summary">${escapeHtml(project.summary)}</p>
  ${detailed && project.highlights.length ? `<ul class="project-highlights">${project.highlights.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}
  ${project.stack.length ? `<ul class="project-stack" aria-label="技术栈">${project.stack.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}
  ${renderLinks(project.links, prefix)}
</article></li>`.replace(/^[ \t]+\r?\n/gm, '');
}

const emptyProjects = prefix => `<p class="empty-state">项目正在整理中。可以先看看 <a href="${prefix}notes/">Notes</a> 或 <a href="${prefix}lab/agent/">Agent 小实验</a>。</p>`;

export function renderHomeProjects(projects) {
  const featured = projects.filter(project => project.featured);
  const shown = (featured.length ? featured : projects).slice(0, homeFeaturedLimit);
  if (!shown.length) return emptyProjects('./');
  return `<ul class="project-grid">${shown.map(project => renderProjectCard(project, { prefix: './', level: 3, detailed: false })).join('')}</ul>`;
}

export function renderProjectsPage(projects) {
  return `<article class="reading-page projects-page">
      <nav class="breadcrumbs" aria-label="位置"><a href="../">首页</a><span aria-hidden="true">›</span>项目</nav>
      <h1>项目</h1>
      <p class="page-intro">我做过和正在做的东西，每个项目都附有可以直接查看的链接。</p>
      ${projects.length ? `<ul class="project-grid project-grid-detailed">${projects.map(project => renderProjectCard(project, { prefix: '../', level: 2, detailed: true })).join('')}</ul>` : emptyProjects('../')}
      <p class="back-link"><a href="../">← 回到首页</a></p>
    </article>`;
}

export function normalizeExperience(data) {
  const groups = [['internships', '实习'], ['education', '教育']];
  return groups.map(([key, label]) => {
    const entries = data?.[key] ?? [];
    if (!Array.isArray(entries)) throw new Error(`about/experience.json ${key} must be an array`);
    return {
      label,
      entries: entries.map((entry, index) => {
        const at = `${key}[${index}]`;
        if (entry.url && !resolveHref(entry.url, '', `${at}.url`).external) throw new Error(`${at}.url must be an https:// link`);
        return {
          organization: text(entry.organization, `${at}.organization`, true),
          url: entry.url ? text(entry.url, `${at}.url`) : '',
          title: text(entry.title, `${at}.title`),
          period: text(entry.period, `${at}.period`),
          summary: text(entry.summary, `${at}.summary`),
          highlights: list(entry.highlights, `${at}.highlights`),
        };
      }),
    };
  }).filter(group => group.entries.length);
}

export function renderExperience(groups) {
  if (!groups.length) return '';
  const item = entry => {
    const name = entry.url ? `<a href="${escapeHtml(entry.url)}" rel="noopener">${escapeHtml(entry.organization)}</a>` : escapeHtml(entry.organization);
    return `<li class="timeline-item">
  <div class="timeline-head"><h4>${name}</h4>${entry.period ? `<span class="timeline-period">${escapeHtml(entry.period)}</span>` : ''}</div>
  ${entry.title ? `<p class="timeline-title">${escapeHtml(entry.title)}</p>` : ''}
  ${entry.summary ? `<p class="timeline-summary">${escapeHtml(entry.summary)}</p>` : ''}
  ${entry.highlights.length ? `<details class="timeline-details"><summary>主要工作 · ${entry.highlights.length} 项</summary><ul>${entry.highlights.map(point => `<li>${escapeHtml(point)}</li>`).join('')}</ul></details>` : ''}
</li>`.replace(/^[ \t]+\r?\n/gm, '');
  };
  return `<section class="experience" aria-labelledby="experience-heading">
  <h2 id="experience-heading">经历</h2>
  ${groups.map(group => `<h3 class="timeline-group">${group.label}</h3><ol class="timeline">${group.entries.map(item).join('')}</ol>`).join('\n  ')}
</section>`;
}

export const renderResume = (prefix, available, variant) => {
  if (!available) return '';
  const href = `${prefix}${resumeFile}`;
  if (variant === 'sidebar') return ` <a href="${href}" download>下载简历（PDF）→</a>`;
  return `<a class="button${variant === 'about' ? ' button-primary' : ''}" href="${href}" download>下载简历（PDF）</a>`;
};

export async function generateProfile() {
  const projects = normalizeProjects(JSON.parse(await readFile(new URL('projects/collection.json', root), 'utf8')));
  const experience = normalizeExperience(JSON.parse(await readFile(new URL('about/experience.json', root), 'utf8')));
  const resume = await access(new URL(resumeFile, root)).then(() => true, () => false);

  const homeUrl = new URL('index.html', root);
  let home = await readFile(homeUrl, 'utf8');
  home = replaceBlock(home, 'projects', renderHomeProjects(projects));
  home = replaceBlock(home, 'resume:hero', renderResume('./', resume, 'hero'));
  home = replaceBlock(home, 'resume:sidebar', renderResume('./', resume, 'sidebar'));
  await save(homeUrl, home);

  const aboutUrl = new URL('about/index.html', root);
  let about = await readFile(aboutUrl, 'utf8');
  about = replaceBlock(about, 'experience', renderExperience(experience));
  about = replaceBlock(about, 'resume', resume ? `<p class="resume-download">${renderResume('../', resume, 'about')}</p>` : '');
  await save(aboutUrl, about);

  await mkdir(new URL('projects/', root), { recursive: true });
  await save(new URL('projects/index.html', root), await renderPage({ title: '项目', description: 'Zhong 做过和正在做的项目，附源码与演示链接。', content: renderProjectsPage(projects), depth: 1, path: 'projects/', current: 'projects' }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await generateProfile();
  console.log('Generated projects, experience and resume links');
}
