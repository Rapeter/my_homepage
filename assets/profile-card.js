// React Bits Profile Card adaptation for a static website. See profile-card.LICENSE.txt.
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
const clamp = value => Math.max(-1, Math.min(1, value));

document.querySelectorAll('[data-profile-card]').forEach(card => {
  const current = { x: 0, y: 0, light: 0 };
  const target = { x: 0, y: 0, light: 0 };
  let frame = 0;
  let previousTime = 0;
  let touchId = null;

  const write = () => {
    card.style.setProperty('--tilt-x', `${-current.y * 9}deg`);
    card.style.setProperty('--tilt-y', `${current.x * 11}deg`);
    card.style.setProperty('--light-x', `${50 + current.x * 50}%`);
    card.style.setProperty('--light-y', `${50 + current.y * 50}%`);
    card.style.setProperty('--foil-x', `${50 - current.x * 25}%`);
    card.style.setProperty('--foil-y', `${50 - current.y * 25}%`);
    card.style.setProperty('--card-light', String(current.light));
  };
  const animate = now => {
    // Time-based easing keeps the same feel on 60 Hz and high-refresh displays.
    const blend = 1 - Math.exp(-Math.min(64, now - previousTime || 16) / 75);
    previousTime = now;
    let moving = false;
    for (const key of ['x', 'y', 'light']) {
      current[key] += (target[key] - current[key]) * blend;
      if (Math.abs(target[key] - current[key]) < .001) current[key] = target[key];
      else moving = true;
    }
    write();
    frame = moving ? requestAnimationFrame(animate) : 0;
  };
  const aim = (x, y, light = 1) => {
    if (motion.matches) return;
    target.x = clamp(x); target.y = clamp(y); target.light = light;
    if (!frame) { previousTime = performance.now(); frame = requestAnimationFrame(animate); }
  };
  const reset = () => {
    touchId = null;
    aim(0, 0, 0);
  };
  const stop = () => {
    cancelAnimationFrame(frame); frame = 0; touchId = null;
    Object.assign(current, { x: 0, y: 0, light: 0 });
    Object.assign(target, current);
    write();
  };
  const point = event => {
    const bounds = card.getBoundingClientRect();
    if (bounds.width && bounds.height) aim((event.clientX - bounds.left) / bounds.width * 2 - 1, (event.clientY - bounds.top) / bounds.height * 2 - 1);
  };
  card.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') point(event); });
  card.addEventListener('pointermove', event => { if (event.pointerType === 'mouse' || event.pointerId === touchId) point(event); });
  card.addEventListener('pointerleave', event => { if (event.pointerType === 'mouse') reset(); });
  card.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse') { touchId = event.pointerId; point(event); }
  });
  window.addEventListener('pointerup', event => { if (event.pointerId === touchId) reset(); });
  window.addEventListener('pointercancel', event => { if (event.pointerId === touchId) reset(); });
  card.addEventListener('focusin', () => aim(0, 0, .5));
  card.addEventListener('focusout', event => { if (!card.contains(event.relatedTarget)) reset(); });
  card.addEventListener('keydown', event => {
    if (event.target !== card) return;
    const directions = { ArrowLeft: [-.3, 0], ArrowRight: [.3, 0], ArrowUp: [0, -.3], ArrowDown: [0, .3] };
    if (directions[event.key]) {
      event.preventDefault();
      const [x, y] = directions[event.key];
      aim(target.x + x, target.y + y);
    } else if (event.key === 'Escape') reset();
  });
  motion.addEventListener('change', stop);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  window.addEventListener('blur', stop);
  window.addEventListener('pagehide', stop);
  write();
});
