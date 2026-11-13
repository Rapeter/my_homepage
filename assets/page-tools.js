// Back-to-top on every page; a reading progress bar on article and note pages.
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const article = document.querySelector('.reading-page:not(.about-page) > .prose')?.closest('.reading-page');

const top = document.createElement('button');
top.type = 'button';
top.className = 'back-to-top';
top.setAttribute('aria-label', '回到顶部');
top.title = '回到顶部';
top.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
top.dataset.visible = 'false';
top.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: reduced.matches ? 'instant' : 'smooth' });
  document.getElementById('content')?.focus({ preventScroll: true });
});
document.body.append(top);

let bar;
if (article) {
  bar = document.createElement('div');
  bar.className = 'reading-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.append(bar);
}

let frame = 0;
function update() {
  frame = 0;
  top.dataset.visible = String(scrollY > innerHeight * .8);
  if (!bar) return;
  const start = article.getBoundingClientRect().top + scrollY;
  const distance = article.offsetHeight - innerHeight;
  const progress = distance > 0 ? Math.min(1, Math.max(0, (scrollY - start) / distance)) : 1;
  bar.style.setProperty('--progress', progress.toFixed(4));
  bar.hidden = distance <= 0;
}
const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
addEventListener('scroll', schedule, { passive: true });
addEventListener('resize', schedule);
update();
