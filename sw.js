"use strict";

const CACHE = "sharqat-v4";

const FILES = [
  "./",
  "./index.html",
  "./weather.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

const STATIC_PATHS = new Set(
  FILES.map(file => new URL(file, self.registration.scope).pathname)
);

/* تثبيت النسخة الجديدة */
self.addEventListener("install", event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);

      await Promise.all(
        FILES.map(async file => {
          try {
            const request = new Request(file, {
              cache: "reload"
            });

            const response = await fetch(request);

            if (response.ok) {
              await cache.put(request, response);
            }
          } catch (error) {
            console.warn("تعذر تخزين الملف:", file, error);
          }
        })
      );

      await self.skipWaiting();
    })()
  );
});

/* تفعيل النسخة الجديدة وحذف النسخ القديمة */
self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(
        keys
          .filter(key => key.startsWith("sharqat-") && key !== CACHE)
          .map(key => caches.delete(key))
      );

      await self.clients.claim();
    })()
  );
});

/* التعامل مع الطلبات */
self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  /* لا نخزن خدمات الطقس والغبار الخارجية */
  if (url.origin !== self.location.origin) return;

  /* لا نتدخل في الملفات غير المحددة */
  if (!STATIC_PATHS.has(url.pathname) && request.mode !== "navigate") {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        /* الإنترنت أولاً */
        const response = await fetch(request);

        if (response && response.ok) {
          const cache = await caches.open(CACHE);

          const key = request.mode === "navigate"
            ? "./index.html"
            : request;

          await cache.put(key, response.clone());
        }

        return response;

      } catch (error) {
        /* عند انقطاع الإنترنت نستخدم النسخة المحفوظة */
        const cache = await caches.open(CACHE);

        const cached = await cache.match(request);

        if (cached) return cached;

        /* الصفحة الرئيسية كحل احتياطي */
        if (request.mode === "navigate") {
          const home = await cache.match("./index.html");

          if (home) return home;
        }

        return new Response(
          "لا يوجد اتصال بالإنترنت. يرجى المحاولة مرة أخرى.",
          {
            status: 503,
            headers: {
              "Content-Type": "text/plain; charset=utf-8"
            }
          }
        );
      }
    })()
  );
});
