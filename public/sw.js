// ─── Quibla Service Worker ───────────────────────────────
// Caches the app shell so it loads offline.
// API calls (Qibla bearing, city name) always go to the network.

const CACHE = 'quibla-v1'

const SHELL = [
  '/',
  '/index.html',
  '/icon.svg',
  '/manifest.json',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css',
  'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap',
]

// ── Install: cache app shell ──────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(SHELL))
  )
  self.skipWaiting()
})

// ── Activate: remove old caches ───────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// ── Fetch: cache-first for shell, network-first for API ───
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  // Always fetch API and external geocoding live
  if (url.pathname.startsWith('/api/') || url.hostname === 'nominatim.openstreetmap.org') {
    event.respondWith(fetch(event.request))
    return
  }

  // Cache-first for everything else (app shell + CDN assets)
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached
      return fetch(event.request).then(response => {
        // Cache successful GET responses
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone()
          caches.open(CACHE).then(cache => cache.put(event.request, clone))
        }
        return response
      }).catch(() => {
        // Offline fallback — serve the app shell
        if (event.request.destination === 'document') {
          return caches.match('/')
        }
      })
    })
  )
})
