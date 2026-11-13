// Show the missing address and suggest its last segment as a Notes search.
const segment = location.pathname.split('/').filter(Boolean).filter(part => part !== 'my_homepage').at(-1) || '';
let words = '';
try { words = decodeURIComponent(segment).replace(/\.html?$/, '').replace(/[-_]+/g, ' ').trim().slice(0, 160); } catch { /* Malformed escapes keep the field empty. */ }
const shown = document.querySelector('[data-missing-path]');
if (shown && location.pathname.length > 1) {
  shown.querySelector('code').textContent = location.pathname;
  shown.hidden = false;
}
const input = document.querySelector('#not-found-query');
if (input && words && words !== 'index') input.value = words;

// Keep the skip link on the missing URL rather than resolving it against <base>.
const skip = document.querySelector('.skip-link');
if (skip) skip.href = new URL('#content', location.href).href;
