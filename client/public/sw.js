const CACHE_NAME = "smart-security-life-shell-v3";
const APP_SHELL = ["/", "/manifest.json", "/icon.png", "/icon-512.png"];

async function refreshCache(request, cache) {
  try {
    const response = await fetch(request, { cache: "no-store" });
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return null;
  }
}

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    Promise.all([
      clients.claim(),
      caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))),
    ]),
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin || requestUrl.pathname.startsWith("/api/")) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(event.request) || (event.request.mode === "navigate" ? await cache.match("/") : null);
    const refresh = refreshCache(event.request, cache);
    event.waitUntil(refresh);

    if (cached) return cached;
    const networkResponse = await refresh;
    if (networkResponse) return networkResponse;
    return new Response("التطبيق غير متاح حالياً دون اتصال", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  })());
});

self.addEventListener("sync", event => {
  if (event.tag !== "smart-security-life-offline-sync") return;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(openClients => {
      openClients.forEach(client => client.postMessage({ type: "smart-security-life-offline-sync-request" }));
    }),
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(openClients => {
      const matchingClient = openClients.find(client => new URL(client.url).origin === self.location.origin);
      if (matchingClient) return matchingClient.focus().then(() => matchingClient.navigate(targetUrl));
      return clients.openWindow(targetUrl);
    }),
  );
});
