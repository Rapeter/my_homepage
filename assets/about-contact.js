const group = document.querySelector('.wechat-contact');
if (group) {
  const button = group.querySelector('.wechat-toggle');
  const popup = group.querySelector('.wechat-popup');
  let pinned = false;
  const show = visible => {
    popup.hidden = !visible;
    button.setAttribute('aria-expanded', String(visible));
  };
  group.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse') show(true);
  });
  group.addEventListener('pointerleave', () => {
    if (!pinned && !group.contains(document.activeElement)) show(false);
  });
  group.addEventListener('focusin', event => {
    if (event.target.matches(':focus-visible')) show(true);
  });
  group.addEventListener('focusout', event => {
    if (!group.contains(event.relatedTarget)) { pinned = false; show(false); }
  });
  button.addEventListener('click', () => { pinned = !pinned; show(pinned); });
  document.addEventListener('pointerdown', event => {
    if (!group.contains(event.target)) { pinned = false; show(false); }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !popup.hidden) {
      pinned = false; button.focus({ preventScroll: true }); show(false);
    }
  });
}
