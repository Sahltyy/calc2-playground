/* Calc 2 Playground: keeps a copy of the app on this device so it opens with no connection.
   Pages: try the network first (so you get updates), fall back to the saved copy when offline or slow.
   Everything else (fonts, icons): saved copy first. */
const CACHE = 'calc2-__VERSION__';
const CORE = ['./', './index.html', /*__ASSETS__*/];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('calc2-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const saved = () => caches.match('./index.html').then((r) => r || caches.match('./'));

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(new Promise((resolve) => {
      let done = false;
      const finish = (r) => { if (!done && r) { done = true; resolve(r); } };
      // a slow connection should not keep you waiting: after 3.5s, open the saved copy
      const timer = setTimeout(() => saved().then(finish), 3500);
      fetch(req)
        .then((res) => {
          if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put('./index.html', copy)); }
          clearTimeout(timer); finish(res);
        })
        .catch(() => { clearTimeout(timer); saved().then((r) => finish(r || Response.error())); });
    }));
    return;
  }
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }))
  );
});
