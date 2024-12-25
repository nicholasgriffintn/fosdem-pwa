import { glob } from 'glob'
import { writeFileSync } from 'fs'
import path from 'path'

async function generateServiceWorker() {
    const files = await glob('dist/**/*', { nodir: true })

    const ignoredRoutes = [
        '/robots.txt',
        '/nitro.json',
        '/manifest.webmanifest',
        '/_routes.json',
        '/_redirects',
        '/_headers',
        '/sw.js',
        '/_worker.js',
    ]

    const assetsToCache = files
        .map(file => '/' + path.relative('dist', file))
        .filter(file => !ignoredRoutes.includes(file))

    const sw = `
    importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

    const { registerRoute, NavigationRoute, setDefaultHandler } = workbox.routing;
    const { NetworkFirst, CacheFirst, StaleWhileRevalidate } = workbox.strategies;
    const { CacheableResponsePlugin } = workbox.cacheableResponse;
    const { ExpirationPlugin } = workbox.expiration;

    self.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
      }
    });

    if (self.location.hostname === 'localhost') {
      setDefaultHandler(new NetworkFirst());
      self.skipWaiting();
      clients.claim();
    } else {
      const CACHE_NAME = 'fosdem-pwa-v${Date.now()}';
      
      setInterval(() => {
        self.registration.update();
      }, 15 * 60 * 1000); // 15 minutes

      const urlsToCache = ${JSON.stringify(assetsToCache, null, 2)};

      workbox.precaching.precacheAndRoute(
        urlsToCache.map(url => ({
          url,
          revision: CACHE_NAME
        }))
      );

      registerRoute(
        ({ url }) => url.hostname === 'r2.fosdempwa.com',
        new StaleWhileRevalidate({
          cacheName: 'fosdem-data',
          plugins: [
            new CacheableResponsePlugin({
              statuses: [0, 200]
            }),
            new ExpirationPlugin({
              maxEntries: 50,
              maxAgeSeconds: 1 * 60 * 60 // 1 hour
            })
          ]
        })
      );

      registerRoute(
        ({ url }) => url.hostname === 'avatars.githubusercontent.com',
        new CacheFirst({
          cacheName: 'github-avatars',
          plugins: [
            new CacheableResponsePlugin({
              statuses: [0, 200]
            }),
            new ExpirationPlugin({
              maxEntries: 100,
              maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
            })
          ]
        })
      );

      registerRoute(
        new NavigationRoute(
          new NetworkFirst({
            cacheName: 'navigations',
            plugins: [
              new CacheableResponsePlugin({
                statuses: [0, 200]
              }),
              new ExpirationPlugin({
                maxEntries: 50,
                maxAgeSeconds: 24 * 60 * 60 // 24 hours
              })
            ]
          })
        )
      );

      setDefaultHandler(
        new StaleWhileRevalidate({
          cacheName: 'default',
          plugins: [
            new CacheableResponsePlugin({
              statuses: [0, 200]
            }),
            new ExpirationPlugin({
              maxEntries: 50,
              maxAgeSeconds: 24 * 60 * 60 // 24 hours
            })
          ]
        })
      );

      self.addEventListener('activate', (event) => {
        event.waitUntil(
          caches.keys().then((cacheNames) => {
            return Promise.all(
              cacheNames.map((cacheName) => {
                if (!cacheName.startsWith('workbox-') && 
                    cacheName !== 'fosdem-data' && 
                    cacheName !== 'github-avatars' &&
                    cacheName !== 'navigations' &&
                    cacheName !== 'default') {
                  return caches.delete(cacheName);
                }
              })
            );
          })
        );
      });
    }
  `

    writeFileSync('dist/sw.js', sw);
    console.log('Service worker generated successfully!');
}

generateServiceWorker().catch(console.error)