/**
 * abya.tv service worker — deliberately minimal.
 *
 * Jobs:
 *   1. Exist, so the app is installable (share_target requires install).
 *   2. Cache-first for /api/thumb/* — stills are immutable per video id, so
 *      the directory grid keeps rendering offline and repeat visits never
 *      re-fetch. Same-origin only: this preserves the zero-third-party rule.
 *   3. Stale-while-revalidate for hashed static assets (/_next/static/).
 *
 * NOT jobs: page/navigation caching (reviews revalidate hourly server-side;
 * serving stale HTML would trade honesty for offline breadth), analytics of
 * any kind, push. There is no fetch logging, no ID, no state beyond the cache.
 */

const VERSION = 'v1';
const THUMB_CACHE = `thumbs-${VERSION}`;
const STATIC_CACHE = `static-${VERSION}`;
const THUMB_LIMIT = 400;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = [THUMB_CACHE, STATIC_CACHE];
      for (const key of await caches.keys()) {
        if (!keep.includes(key)) await caches.delete(key);
      }
      await self.clients.claim();
    })()
  );
});

async function trimCache(name, limit) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  // FIFO trim; thumbnails are tiny, this just bounds unbounded growth.
  for (let i = 0; i < keys.length - limit; i++) await cache.delete(keys[i]);
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok) {
    cache.put(request, res.clone());
    trimCache(cacheName, THUMB_LIMIT);
  }
  return res;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  const refresh = fetch(request)
    .then((res) => {
      if (res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => hit);
  return hit ?? refresh;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // never touch cross-origin

  if (url.pathname.startsWith('/api/thumb/')) {
    event.respondWith(cacheFirst(request, THUMB_CACHE));
  } else if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
  }
  // Everything else: straight to the network, untouched.
});
