// Progressive enhancement: links, full notes and the TOC work without JS.
import {searchNotes, highlightParts} from './note-search.js';
import {mountInterviewDraw} from './interview-draw.js';

const filters = document.querySelector('.note-filters');
if (filters) {
  const rows = [...document.querySelectorAll('.notes-list > li')];
  const list = document.querySelector('.notes-list');
  const titles = new Map(rows.map(row=>[row,row.firstElementChild.textContent]));
  const searchForm = document.querySelector('.note-search');
  const searchInput = document.querySelector('#note-search');
  const clearSearch = document.querySelector('.search-clear');
  const records = JSON.parse(document.querySelector('#note-search-index').textContent);
  mountInterviewDraw(document.querySelector('.interview-draw'), records);
  let composing = false;
  const buttons = [...filters.querySelectorAll('button')];
  const categories = document.querySelector('.note-categories');
  const categoryButtons = [...(categories?.querySelectorAll('button') || [])];
  const status = document.querySelector('[data-filter-status]');
  const readFilters = () => {
    const params = new URL(location.href).searchParams;
    return {tag:params.get('tag') || '', category:params.get('category') || '', query:(params.get('q') || '').slice(0,160)};
  };
  function marked(text, query) {
    const fragment=document.createDocumentFragment();
    for (const part of highlightParts(text,query)) {
      if (part.match) { const mark=document.createElement('mark'); mark.textContent=part.text; fragment.append(mark); }
      else fragment.append(document.createTextNode(part.text));
    }
    return fragment;
  }
  function renderHits(row, hit, query) {
    row.querySelector('.search-hits')?.remove();
    row.firstElementChild.replaceChildren(marked(titles.get(row),query));
    if (!hit) return;
    const container=document.createElement('div'); container.className='search-hits';
    const sections=hit.sections.map(section=>{
      const entry=document.createElement('div'); entry.className='search-hit';
      const link=document.createElement('a'); link.className='search-hit-title';
      link.href=`./${hit.slug}/${section.id?'#'+encodeURIComponent(section.id):''}`;
      link.append(marked(section.title || '阅读全文',query));
      const snippet=document.createElement('p'); snippet.append(marked(section.excerpt,query));
      entry.append(link,snippet); return entry;
    });
    container.append(...sections.slice(0,3));
    if (sections.length>3) {
      const more=document.createElement('details'), summary=document.createElement('summary');
      summary.textContent=`其余 ${sections.length-3} 处匹配`; more.append(summary,...sections.slice(3)); container.append(more);
    }
    row.append(container);
  }
  function apply({tag, category, query=''}, updateUrl = '') {
    const cleanQuery=query.trim().slice(0,160);
    const hits=cleanQuery?searchNotes(records,cleanQuery):[];
    const bySlug=new Map(hits.map(hit=>[hit.slug,hit]));
    let visible = 0;
    rows.forEach(row => {
      row.hidden = (Boolean(tag) && !JSON.parse(row.dataset.noteTags).includes(tag)) || (Boolean(category) && row.dataset.noteCategory !== category) || (Boolean(cleanQuery) && !bySlug.has(row.dataset.noteSlug));
      renderHits(row,row.hidden?null:bySlug.get(row.dataset.noteSlug),cleanQuery);
      if (!row.hidden) visible++;
    });
    if (cleanQuery) {
      const positions=new Map(hits.map((hit,index)=>[hit.slug,index]));
      [...rows].sort((a,b)=>(positions.get(a.dataset.noteSlug)??Infinity)-(positions.get(b.dataset.noteSlug)??Infinity)).forEach(row=>list.append(row));
    } else rows.forEach(row=>list.append(row));
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.noteFilter === tag)));
    categoryButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.categoryFilter === category)));
    clearSearch.hidden = !searchInput.value;
    status.textContent = visible
      ? `${tag ? `标签「${tag}」 · ` : ''}${cleanQuery ? `找到 ${visible} 篇相关笔记` : `${visible} 篇笔记`}`
      : cleanQuery ? '没有找到匹配内容，试试更短的关键词，或清除分类和标签限制。' : '没有符合当前分类和标签的笔记，选择「全部」查看。';
    if (updateUrl) {
      const url = new URL(location.href);
      if (tag) url.searchParams.set('tag', tag); else url.searchParams.delete('tag');
      if (category) url.searchParams.set('category', category); else url.searchParams.delete('category');
      if (cleanQuery) url.searchParams.set('q',cleanQuery); else url.searchParams.delete('q');
      if (url.href!==location.href) history[updateUrl==='replace'?'replaceState':'pushState'](null,'',url);
    }
  }
  filters.addEventListener('click', event => {
    const button = event.target.closest('button[data-note-filter]');
    if (button) apply({...readFilters(), tag:button.dataset.noteFilter}, 'push');
  });
  categories?.addEventListener('click', event => {
    const button = event.target.closest('button[data-category-filter]');
    if (button) apply({...readFilters(), tag:'', category:button.dataset.categoryFilter}, 'push');
  });
  document.querySelector('.notes-list').addEventListener('click', event => {
    const link = event.target.closest('a.content-tag');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    apply({...readFilters(), tag:new URL(link.href).searchParams.get('tag') || ''}, 'push');
  });
  const restore = () => { const state=readFilters(); searchInput.value=state.query; apply(state); };
  window.addEventListener('popstate', restore);
  const search = () => apply({...readFilters(),query:searchInput.value},'replace');
  searchInput.addEventListener('compositionstart',()=>{composing=true;});
  searchInput.addEventListener('compositionend',()=>{composing=false;search();});
  searchInput.addEventListener('input',event=>{if (!composing && !event.isComposing) search();});
  searchForm.addEventListener('submit',event=>{event.preventDefault();if (!composing) apply({...readFilters(),query:searchInput.value},'push');});
  clearSearch.addEventListener('click',()=>{searchInput.value='';apply({...readFilters(),query:''},'push');searchInput.focus();});
  restore();
  searchForm.hidden=false;
  if (categories) categories.hidden = false;
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
