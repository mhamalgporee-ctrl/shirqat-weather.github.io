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
