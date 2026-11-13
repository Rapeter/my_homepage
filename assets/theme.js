// Read before the stylesheet paints so saved preferences apply on every page.
// Chiikawa mode takes precedence; otherwise dark follows the saved choice or the system setting.
(() => {
  const themeKey='zhong:theme', schemeKey='zhong:color-scheme';
  const assets=new URL('.',document.currentScript.src);
  const system=matchMedia('(prefers-color-scheme: dark)');
  const colors={default:'#f0f9ff',chiikawa:'#fffaf0',dark:'#0f1722'};
  const memory={};
  let chiikawaButton, chiikawaState, darkButton;
  function read(key) {
    try { return localStorage.getItem(key); } catch { return memory[key] ?? null; }
  }
  function write(key,value) {
    memory[key]=value;
    try { localStorage.setItem(key,value); } catch { /* The current page still switches when storage is disabled. */ }
  }
  function current() {
    if (read(themeKey)==='chiikawa') return 'chiikawa';
    const scheme=read(schemeKey);
    return scheme==='dark' || (scheme!=='light' && system.matches) ? 'dark' : 'default';
  }
  function apply() {
    const theme=current(), root=document.documentElement;
    if (theme==='default') delete root.dataset.theme; else root.dataset.theme=theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',colors[theme]);
    chiikawaButton?.setAttribute('aria-pressed',String(theme==='chiikawa'));
    if (chiikawaState) chiikawaState.textContent=theme==='chiikawa'?'已开启':'未开启';
    if (darkButton) {
      darkButton.setAttribute('aria-pressed',String(theme==='dark'));
      darkButton.title=theme==='dark'?'切换到浅色模式':'切换到深色模式';
    }
  }
  apply();
  function mountDark() {
    const slot=document.querySelector('[data-theme-actions]');
    if (!slot) return;
    darkButton=document.createElement('button'); darkButton.type='button'; darkButton.className='dark-toggle';
    darkButton.setAttribute('aria-label','深色模式');
    darkButton.innerHTML='<svg class="icon-moon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/></svg><svg class="icon-sun" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
    darkButton.addEventListener('click',()=>{
      const dark=current()!=='dark';
      write(schemeKey,dark?'dark':'light');
      if (dark) write(themeKey,'default');
      apply();
    });
    slot.append(darkButton);
  }
  function mount() {
    mountDark();
    const footer=document.createElement('footer'); footer.className='site-theme';
    const friends=document.createElement('span'); friends.className='theme-friends'; friends.setAttribute('aria-hidden','true');
    for (const name of ['hachiware','usagi']) {
      const image=document.createElement('img'); image.src=new URL(`${name}-sticker.png`,assets).href;
      image.alt=''; image.width=38; image.height=42; friends.append(image);
    }
    chiikawaButton=document.createElement('button'); chiikawaButton.type='button'; chiikawaButton.className='theme-toggle'; chiikawaButton.setAttribute('aria-label','Chiikawa 模式');
    const label=document.createElement('span'); label.textContent='Chiikawa 模式';
    const track=document.createElement('span'); track.className='theme-toggle-track'; track.setAttribute('aria-hidden','true');
    chiikawaState=document.createElement('span'); chiikawaState.className='theme-toggle-state'; chiikawaState.setAttribute('aria-hidden','true');
    chiikawaButton.append(label,track,chiikawaState);
    chiikawaButton.addEventListener('click',()=>{
      write(themeKey,current()==='chiikawa'?'default':'chiikawa');
      apply();
    });
    footer.append(friends,chiikawaButton); document.body.append(footer);
    apply();
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount,{once:true}); else mount();
  window.addEventListener('storage',event=>{if (event.key===themeKey || event.key===schemeKey || event.key===null) apply();});
  window.addEventListener('pageshow',apply);
  system.addEventListener('change',apply);
})();
