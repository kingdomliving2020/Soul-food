/*
 * Soul Food — Lightweight PWA Service Worker
 *
 * Intentionally minimal: provides installability + offline fallback for the
 * app shell only. We deliberately do NOT cache API responses, PDFs, or any
 * download tokens — those must always be fresh and tied to the live session.
 *
 * Strategy:
 *   - HTML/navigation requests: network-first, fall back to cached shell.
 *   - Static assets (JS/CSS/images from same origin): cache-first.
 *   - /api/* and download tokens: always bypass cache (network-only).
 */

const VERSION = 'sofu-pwa-v1';
const SHELL_CACHE = `${VERSION}-shell`;
const ASSET_CACHE = `${VERSION}-assets`;

const SHELL_URLS = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((n) => !n.startsWith(VERSION))
          .map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Never cache API calls, downloads, or auth.
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('/downloads/') ||
    url.pathname.includes('/auth/')
  ) {
    return; // Let the network handle it directly.
  }

  // Only handle same-origin requests.
  if (url.origin !== self.location.origin) return;

  // HTML navigations: network-first, fall back to cached shell.
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // Static assets: cache-first.
  if (
    url.pathname.match(/\.(?:js|css|png|jpg|jpeg|webp|svg|ico|woff2?|ttf)$/i)
  ) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(ASSET_CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        });
      })
    );
  }
});
