// Progressive enhancement: links, full notes and the TOC work without JS.
const filters = document.querySelector('.note-filters');
if (filters) {
  const rows = [...document.querySelectorAll('.notes-list > li')];
  const buttons = [...filters.querySelectorAll('button')];
  const status = document.querySelector('[data-filter-status]');
  function apply(tag, updateUrl = false) {
    let visible = 0;
    rows.forEach(row => {
      row.hidden = Boolean(tag) && !JSON.parse(row.dataset.noteTags).includes(tag);
      if (!row.hidden) visible++;
    });
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.noteFilter === tag)));
    status.textContent = visible ? `${tag ? `标签「${tag}」 · ` : ''}${visible} 篇笔记` : '没有这个标签的笔记，选择「全部」查看。';
    if (updateUrl) {
      const url = new URL(location.href);
      if (tag) url.searchParams.set('tag', tag); else url.searchParams.delete('tag');
      history.pushState(null, '', url);
    }
  }
  filters.addEventListener('click', event => {
    const button = event.target.closest('button[data-note-filter]');
    if (button) apply(button.dataset.noteFilter, true);
  });
  document.querySelector('.notes-list').addEventListener('click', event => {
    const link = event.target.closest('a.content-tag');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    apply(new URL(link.href).searchParams.get('tag') || '', true);
  });
  window.addEventListener('popstate', () => apply(new URL(location.href).searchParams.get('tag') || ''));
  apply(new URL(location.href).searchParams.get('tag') || '');
  filters.hidden = status.hidden = false;
}

const note = document.querySelector('[data-note-id]');
if (note) {
  note.classList.add('is-enhanced');
  const toc = note.querySelector('.note-toc');
  const links = [...note.querySelectorAll('.note-toc a')];
  const headings = links.map(link => document.getElementById(decodeURIComponent(link.hash.slice(1))));
  const resume = note.querySelector('[data-resume-reading]');
  const key = `zhong:reading:${location.pathname}`;
  let saved = null, active = null, frame = 0, saveTimer = 0;
  try {
    const value = JSON.parse(localStorage.getItem(key));
    if (value?.version === 1 && headings.some(heading => heading.id === value.id)
      && Number.isFinite(value.offset) && value.offset >= 0) saved = value;
  } catch { /* Storage can be disabled; reading still works. */ }
  if (saved && !location.hash) {
    resume.textContent = `继续阅读：${document.getElementById(saved.id).textContent}`;
    resume.hidden = false;
  }
  function margin() { return (toc?.getBoundingClientRect().height || 0) + 20; }
  function update() {
    frame = 0;
    const threshold = margin() + 4;
    active = null;
    for (const heading of headings) {
      if (heading.getBoundingClientRect().top <= threshold) active = heading;
      else break;
    }
    // The last section can be too short to reach the top of the viewport.
    if (scrollY + innerHeight >= document.documentElement.scrollHeight - 2) {
      const last = headings.at(-1);
      if (last && last.getBoundingClientRect().top < innerHeight) active = last;
    }
    links.forEach(link => {
      if (active && decodeURIComponent(link.hash.slice(1)) === active.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    const position = toc?.querySelector('.toc-position');
    if (position) position.textContent = active ? active.textContent : '';
  }
  function save() {
    if (!active) return;
    const offset = Math.max(0, margin() - active.getBoundingClientRect().top);
    try { localStorage.setItem(key, JSON.stringify({version:1, id:active.id, offset})); } catch { /* Optional storage. */ }
  }
  function onScroll() {
    if (!frame) frame = requestAnimationFrame(update);
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { update(); save(); }, 160);
  }
  function sizeToc() {
    note.style.setProperty('--note-offset', `${margin()}px`);
    update();
  }
  if (toc) {
    // Opening the directory changes the space headings need beneath it.
    new ResizeObserver(sizeToc).observe(toc);
    toc.addEventListener('toggle', sizeToc);
  }
  resume.addEventListener('click', () => {
    const heading = document.getElementById(saved.id);
    // Settle the controls before measuring the restored section position.
    resume.hidden = true;
    const position = toc?.querySelector('.toc-position');
    if (position) position.textContent = heading.textContent;
    const index = headings.indexOf(heading);
    const nextHeading = headings[index + 1];
    const maxOffset = nextHeading ? nextHeading.offsetTop - heading.offsetTop - 1 : heading.parentElement.getBoundingClientRect().bottom - heading.getBoundingClientRect().top;
    const offset = Math.min(saved.offset, Math.max(0, maxOffset));
    window.scrollTo({top:heading.getBoundingClientRect().top + scrollY - margin() + offset, behavior:'instant'});
    update();
  });
  window.addEventListener('scroll', onScroll, {passive:true});
  window.addEventListener('resize', sizeToc);
  window.addEventListener('pagehide', () => { update(); save(); });
  sizeToc();
}
