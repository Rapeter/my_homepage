// Read before the stylesheet paints so saved preferences apply on every page.
(() => {
  const key='zhong:theme';
  const assets=new URL('.',document.currentScript.src);
  let button, state;
  function read() {
    try { return localStorage.getItem(key)==='chiikawa'; } catch { return false; }
  }
  function apply(enabled) {
    if (enabled) document.documentElement.dataset.theme='chiikawa';
    else delete document.documentElement.dataset.theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',enabled?'#fffaf0':'#f0f9ff');
    button?.setAttribute('aria-pressed',String(enabled));
    if (state) state.textContent=enabled?'已开启':'未开启';
  }
  apply(read());
  function mount() {
    const footer=document.createElement('footer'); footer.className='site-theme';
    const friends=document.createElement('span'); friends.className='theme-friends'; friends.setAttribute('aria-hidden','true');
    for (const name of ['hachiware','usagi']) {
      const image=document.createElement('img'); image.src=new URL(`${name}-sticker.png`,assets).href;
      image.alt=''; image.width=38; image.height=42; friends.append(image);
    }
    button=document.createElement('button'); button.type='button'; button.className='theme-toggle'; button.setAttribute('aria-label','Chiikawa 模式');
    const label=document.createElement('span'); label.textContent='Chiikawa 模式';
    const track=document.createElement('span'); track.className='theme-toggle-track'; track.setAttribute('aria-hidden','true');
    state=document.createElement('span'); state.className='theme-toggle-state'; state.setAttribute('aria-hidden','true');
    button.append(label,track,state);
    button.addEventListener('click',()=>{
      const enabled=document.documentElement.dataset.theme!=='chiikawa';
      apply(enabled);
      try { localStorage.setItem(key,enabled?'chiikawa':'default'); } catch { /* The current page still switches when storage is disabled. */ }
    });
    footer.append(friends,button); document.body.append(footer);
    apply(read());
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount,{once:true}); else mount();
  window.addEventListener('storage',event=>{if (event.key===key || event.key===null) apply(read());});
  window.addEventListener('pageshow',()=>apply(read()));
})();
