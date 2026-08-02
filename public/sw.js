/**
 * sw.js — Service Worker Massalia Archives Ouvertes
 * v3.0 — Cache-First (Assets Shell) & Stale-While-Revalidate (API v1 & GeoJSON)
 */

const CACHE_NAME = 'massalia-cache-v3.0';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/antiquite-et-fondations.html',
  '/fortifications-et-architecture-militaire.html',
  '/edifices-religieux-et-symboles.html',
  '/littoral-calanques-et-commerce-maritime.html',
  '/a-propos.html',
  '/politique-editoriale.html',
  '/mentions-legales.html',
  '/assets/css/style.css',
  '/assets/css/improvements.css',
  '/assets/js/main.js',
  '/assets/js/map-timeline-module.js',
  '/assets/js/semantic-search-engine.js',
  '/assets/search-index.json',
  '/data/geo/vestiges.geojson',
  '/data/timeline.json',
  '/api/v1/vestiges.geojson',
  '/api/v1/timeline.json',
  '/api/v1/search-index.json',
  '/manifest.json'
];

// Phase d'installation : pré-mise en cache des ressources critiques
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pré-mise en cache des assets critiques');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Phase d'activation : nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Suppression de l\'ancien cache :', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interception des requêtes réseau (SWR pour API/GeoJSON, Cache-First pour Assets Shell)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignorer les requêtes non-GET et externes hors tuiles/cdn
  if (event.request.method !== 'GET') return;

  // Requêtes API & GeoJSON -> Stale-While-Revalidate (SWR)
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/data/') || url.pathname.endsWith('.json') || url.pathname.endsWith('.geojson')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => null);

        return cachedResponse || fetchPromise || new Response(JSON.stringify({ error: "Offline" }), {
          headers: { "Content-Type": "application/json" }
        });
      })
    );
    return;
  }

  // Assets statiques et HTML -> Cache-First avec Fallback Réseau
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Rafraîchissement en arrière-plan (SWR)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse.ok) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {/* Silencieux en mode hors-ligne */});

        return cachedResponse;
      }

      return fetch(event.request).catch(() => {
        // En cas d'échec réseau complet (mode hors-ligne)
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
