const CACHE = 'sharqat-v3';
const FILES = [
  './',
  './index.html',
  './weather.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

/* تثبيت: حفظ الملفات واحداً واحداً حتى لا يفشل التثبيت إذا نقص ملف */
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      Promise.all(FILES.map((f) => c.add(new Request(f, { cache: 'reload' })).catch(() => null)))
    )
  );
  self.skipWaiting();
});

/* تفعيل: حذف الكاش القديم */
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (!/^https?:$/.test(url.protocol)) return;

  /* الإنترنت أولاً لكل الطلبات، والكاش فقط عند انقطاع الاتصال */
  e.respondWith(
    fetch(req, { cache: 'no-store' })
      .then((res) => {
        if (res && (res.ok || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: true }).then((cached) =>
          cached || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)
        )
      )
  );
});
