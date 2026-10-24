import { icon } from './ui.js';
import { isConfigured, getSession } from './supabase.js';
import today from './views/today.js';
import workouts from './views/workouts.js';
import nutrition from './views/nutrition.js';
import cardio from './views/cardio.js';
import body from './views/body.js';
import settings from './views/settings.js';
import auth from './views/auth.js';
import reports from './views/reports.js';
import { getTheme, setTheme, applyTheme } from './theme.js';

const routes = { today, workouts, nutrition, cardio, body, reports, settings };
const tabs = ['today', 'workouts', 'nutrition', 'cardio', 'body', 'reports'];
const $ = id => document.getElementById(id);
let session = null;

$('settings-link').innerHTML = icon('settings');
const TH = ['auto', 'light', 'dark'], THL = { auto: 'تلقائي', light: 'نهاري', dark: 'ليلي' };
const paint = () => { $('theme').textContent = THL[getTheme()]; };
applyTheme(); paint();
$('theme').onclick = () => { setTheme(TH[(TH.indexOf(getTheme()) + 1) % 3]); paint(); };
$('nav').innerHTML = tabs.map(k =>
  `<a href="#/${k}" data-r="${k}">${icon(k)}<span>${routes[k].title}</span></a>`).join('');

function render() {
  const key = location.hash.replace('#/', '') || 'today';
  const needsLogin = isConfigured() && !session;
if (!routes[key] && !needsLogin) {
  location.hash = '#/today';
  return;
}
  $('title').textContent = view.title;
  document.title = view.title + ' — FitTrack';
  $('nav').hidden = needsLogin;
  document.querySelectorAll('#nav a').forEach(a =>
    a.dataset.r === key ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
  const notice = !isConfigured()
    ? '<div class="notice">وضع الهيكل: لم يتم ربط Supabase بعد، ولا تُحفظ أي بيانات.</div>' : '';
  $('view').innerHTML = notice + view.render();
  view.mount?.(async () => { session = await getSession(); render(); });
  $('view').focus({ preventScroll: true });
  scrollTo(0, 0);
}

async function start() {
  if (isConfigured()) session = await getSession();
  addEventListener('hashchange', render);
  render();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}
start();
