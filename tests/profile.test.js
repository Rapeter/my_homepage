import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, cp, writeFile, readFile, rm } from 'node:fs/promises';
import { join, dirname, resolve, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { normalizeProjects, normalizeExperience, renderHomeProjects, renderExperience, resolveHref } from '../scripts/profile.js';

test('project links accept HTTPS and site paths only, and text is escaped', () => {
  assert.equal(resolveHref('lab/agent/', '../', 'x').href, '../lab/agent/');
  assert.equal(resolveHref('https://github.com/Rapeter', '../', 'x').external, true);
  for (const bad of ['javascript:alert(1)', 'http://example.com', '//evil.example', '../secret/', 'notes/"onmouseover="x']) {
    assert.throws(() => resolveHref(bad, '', 'x'), /Unsupported link/, bad);
  }
  const projects = normalizeProjects([{ slug: 'a', title: '<b>标题</b>', summary: '摘要', links: [{ label: '源码', href: 'https://github.com/x' }] }]);
  const html = renderHomeProjects(projects);
  assert.match(html, /&lt;b&gt;标题&lt;\/b&gt;/);
  assert.match(html, /rel="noopener"/);
  assert.throws(() => normalizeProjects([{ slug: 'a', title: 't', summary: 's' }, { slug: 'a', title: 't', summary: 's' }]), /duplicate/);
  assert.throws(() => normalizeProjects([{ slug: 'a', title: 't' }]), /summary/);
});

test('empty projects show a fallback and the homepage prefers featured projects', () => {
  assert.match(renderHomeProjects([]), /empty-state/);
  const projects = normalizeProjects(['a', 'b', 'c'].map((slug, index) => ({ slug, title: slug.toUpperCase(), summary: 's', featured: index === 1 })));
  const html = renderHomeProjects(projects);
  assert.match(html, /id="b"/);
  assert.doesNotMatch(html, /id="a"|id="c"/);
});

test('experience omits empty fields and only expands entries with highlights', () => {
  const groups = normalizeExperience({ internships: [{ organization: '甲', url: 'https://a.example/' }, { organization: '乙', period: '2025.01 – 2025.06', title: '实习生', highlights: ['做了一件事'] }] });
  const html = renderExperience(groups);
  assert.equal((html.match(/<details/g) || []).length, 1);
  assert.match(html, /2025\.01 – 2025\.06/);
  assert.doesNotMatch(html, /timeline-period"><\/span>|<p class="timeline-title"><\/p>/);
  assert.doesNotMatch(html, /教育/);
  assert.throws(() => normalizeExperience({ education: [{ organization: '丙', url: 'notes/' }] }), /https/);
  assert.equal(renderExperience(normalizeExperience({})), '');
});

test('generation publishes the resume link only when the PDF exists and keeps every sidebar in sync', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'homepage-profile-'));
  try {
    for (const dir of ['scripts', 'about', 'projects', 'assets', 'lab/agent', 'posts/first']) await mkdir(join(workspace, dir), { recursive: true });
    for (const file of ['site.js', 'profile.js', 'layout.js']) await cp(new URL(`../scripts/${file}`, import.meta.url), join(workspace, 'scripts', file));
    await writeFile(join(workspace, 'package.json'), '{"type":"module"}');
    const page = (title, body, aside) => `<!doctype html>\n<html>\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="description" content="${title} 描述" />\n    <title>${title}</title>\n  </head>\n  <body>\n    <div class="site-layout">\n      <main>${body}</main>\n      ${aside}\n    </div>\n  </body>\n</html>\n`;
    await writeFile(join(workspace, 'index.html'), page('首页', '<nav><!-- resume:hero --><!-- /resume:hero --></nav><!-- projects --><!-- /projects -->', '<aside class="sidebar"><p>最新侧栏</p><p class="about-link"><a href="./about/">关于</a></p><p><!-- resume:sidebar --><!-- /resume:sidebar --></p></aside>'));
    await writeFile(join(workspace, 'about', 'index.html'), page('关于', '<!-- experience --><!-- /experience --><!-- resume --><!-- /resume -->', '<aside class="sidebar"><p>过时侧栏</p></aside>'));
    await writeFile(join(workspace, 'lab', 'agent', 'index.html'), page('实验', '', '<aside class="sidebar"><p>过时侧栏</p></aside>'));
    await writeFile(join(workspace, 'posts', 'first', 'index.html'), page('文章', '', '<aside class="sidebar"><p>过时侧栏</p></aside>'));
    await writeFile(join(workspace, 'posts', 'collection.json'), JSON.stringify([{ slug: 'first', tags: [] }]));
    await writeFile(join(workspace, 'projects', 'collection.json'), JSON.stringify([{ slug: 'demo', title: '演示', summary: '一个演示', links: [{ label: '打开', href: 'lab/agent/' }] }]));
    await writeFile(join(workspace, 'about', 'experience.json'), JSON.stringify({ internships: [{ organization: '某公司' }] }));
    const generate = () => {
      execFileSync(process.execPath, ['scripts/profile.js'], { cwd: workspace });
      execFileSync(process.execPath, ['scripts/layout.js'], { cwd: workspace });
    };

    generate();
    let home = await readFile(join(workspace, 'index.html'), 'utf8');
    assert.doesNotMatch(home, /resume\.pdf/, 'no resume link without the PDF');
    assert.match(home, /演示/);
    assert.match(await readFile(join(workspace, 'projects', 'index.html'), 'utf8'), /href="\.\.\/lab\/agent\/"/);
    const post = await readFile(join(workspace, 'posts', 'first', 'index.html'), 'utf8');
    assert.match(post, /最新侧栏/);
    assert.doesNotMatch(post, /过时侧栏/);
    assert.match(post, /href="\.\.\/\.\.\/about\/"/);
    assert.match(post, /<a href="\.\.\/\.\.\/" aria-current="true">首页<\/a>/);
    assert.match(post, /og:url" content="https:\/\/rapeter\.github\.io\/my_homepage\/posts\/first\/"/);
    const about = await readFile(join(workspace, 'about', 'index.html'), 'utf8');
    assert.match(about, /<a href="\.\.\/about\/" aria-current="page">关于我<\/a>/);
    assert.match(about, /<p class="about-link"><a href="\.\/" aria-current="page">/);
    assert.match(about, /某公司/);
    const notFound = await readFile(join(workspace, '404.html'), 'utf8');
    assert.match(notFound, /noindex/);
    assert.doesNotMatch(notFound, /og:url|canonical/);

    const snapshot = await Promise.all(['index.html', 'about/index.html', 'posts/first/index.html', 'lab/agent/index.html', '404.html'].map(file => readFile(join(workspace, file), 'utf8')));
    generate();
    const again = await Promise.all(['index.html', 'about/index.html', 'posts/first/index.html', 'lab/agent/index.html', '404.html'].map(file => readFile(join(workspace, file), 'utf8')));
    assert.deepEqual(again, snapshot, 'generation must be idempotent');

    await writeFile(join(workspace, 'assets', 'resume.pdf'), '%PDF-1.4');
    generate();
    home = await readFile(join(workspace, 'index.html'), 'utf8');
    assert.match(home, /href="\.\/assets\/resume\.pdf" download/);
    assert.match(await readFile(join(workspace, 'about', 'index.html'), 'utf8'), /href="\.\.\/assets\/resume\.pdf" download/);
    assert.match(await readFile(join(workspace, 'lab', 'agent', 'index.html'), 'utf8'), /href="\.\.\/\.\.\/assets\/resume\.pdf" download/, 'sidebar resume link reaches every page');
  } finally {
    if (dirname(workspace) !== resolve(tmpdir()) || !basename(workspace).startsWith('homepage-profile-')) throw new Error('Invalid temporary test directory');
    await rm(workspace, { recursive: true, force: true });
  }
});
