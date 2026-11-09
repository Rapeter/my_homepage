// Keep the original artwork; give the homepage sticker a small, one-shot greeting.
const sticker=document.querySelector('.latest-note-sticker');
if (sticker && !sticker.closest('.hachiware-hello')) {
  const button=document.createElement('button');
  button.type='button';
  button.className='hachiware-hello';
  button.setAttribute('aria-label','和小八打个招呼');
  button.title='和小八打个招呼';
  sticker.replaceWith(button); button.append(sticker);
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let motion;
  function greet() {
    motion?.cancel();
    if (reduced.matches || !sticker.animate) return;
    motion=sticker.animate([
      {transform:'translateY(0) rotate(0)'},
      {transform:'translateY(-5px) rotate(-8deg)',offset:.2},
      {transform:'translateY(-7px) rotate(7deg)',offset:.42},
      {transform:'translateY(-3px) rotate(-4deg)',offset:.65},
      {transform:'translateY(0) rotate(0)'},
    ],{duration:600,easing:'ease-out'});
    motion.onfinish=()=>{motion=null;};
  }
  button.addEventListener('pointerenter',event=>{if (event.pointerType==='mouse') greet();});
  button.addEventListener('focus',()=>{if (button.matches(':focus-visible')) greet();});
  button.addEventListener('click',greet);
  reduced.addEventListener('change',()=>{if (reduced.matches) motion?.cancel();});
}
