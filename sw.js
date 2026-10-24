// Service Worker
// يخزّن هيكل التطبيق فقط.
// بيانات المستخدم وSupabase لا تُخزَّن هنا.

const CACHE = 'fittrack-shell-v0.3.0';

const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/styles.css',

  'js/app.js',
  'js/ui.js',
  'js/store.js',
  'js/calc.js',
  'js/theme.js',
  'js/goal.js',
  'js/config.js',
  'js/supabase.js',

  'js/data/exercises.js',
  'js/data/foods.js',

  'js/views/today.js',
  'js/views/workouts.js',
  'js/views/nutrition.js',
  'js/views/cardio.js',
  'js/views/body.js',
  'js/views/reports.js',
  'js/views/settings.js',
  'js/views/auth.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(k => k !== CACHE)
            .map(k => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // لا تعترض Supabase أو أي مصادر خارجية
  if (
    e.request.method !== 'GET' ||
    url.origin !== location.origin
  ) {
    return;
  }

  e.respondWith(
    caches.match(e.request)
      .then(hit =>
        hit ||
        fetch(e.request)
          .then(res => {
            const copy = res.clone();

            caches
              .open(CACHE)
              .then(c =>
                c.put(e.request, copy)
              );

            return res;
          })
          .catch(() =>
            caches.match('index.html')
          )
      )
  );
});
