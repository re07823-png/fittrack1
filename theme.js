import { load, save } from './store.js';

const mq = matchMedia('(prefers-color-scheme: dark)');

export const getTheme = () => {
  const theme = load('_theme', 'auto');

  return ['auto', 'light', 'dark'].includes(theme)
    ? theme
    : 'auto';
};

export function applyTheme() {
  const t = getTheme();
  const r = document.documentElement;

  if (t === 'auto') {
    delete r.dataset.theme;
  } else {
    r.dataset.theme = t;
  }

  const dark =
    t === 'dark' ||
    (t === 'auto' && mq.matches);

  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute(
      'content',
      dark ? '#0c1413' : '#edf0ee'
    );
}

export function setTheme(t) {
  save('_theme', t);
  applyTheme();
}

mq.addEventListener?.('change', applyTheme);
