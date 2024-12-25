import { glob } from 'glob'
import { writeFileSync, readFileSync } from 'fs'
import path from 'path'

async function generateServiceWorker(outputDir = 'dist') {
    const manifest = JSON.parse(
        readFileSync('.vinxi/build/server/_server/.vite/manifest.json', 'utf-8')
    )

    const functionId = manifest['app/functions/getFosdemData.ts'].name

    const fosdemDataPayload = {
        data: { year: "2025" },
        context: {}
    };

    const fosdemDataUrl = `/_server/?_serverFnId=${functionId}&_serverFnName=$$function0&payload=${encodeURIComponent(JSON.stringify(fosdemDataPayload))}`;

    const files = await glob(`${outputDir}/**/*`, { nodir: true })

    const ignoredRoutes = [
        '/manifest.webmanifest',
        '/robots.txt',
        '/nitro.json',
        '/_routes.json',
        '/_redirects',
        '/_headers',
        '/sw.js',
        '/_worker.js',
    ]

    const assetsToCache = files
        .map(file => '/' + path.relative(outputDir, file))
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

      self.addEventListener('activate', event => {
        event.waitUntil(clients.claim());
      });
      
      setInterval(() => {
        self.registration.update();
      }, 15 * 60 * 1000); // 15 minutes

      const fosdemDataUrl = '${fosdemDataUrl}';

      self.addEventListener('install', (event) => {
        event.waitUntil(
          Promise.all([
            caches.open(CACHE_NAME).then((cache) => {
              return cache.addAll(${JSON.stringify(assetsToCache, null, 2)});
            }),
            caches.open('server-functions').then((cache) => {
              return fetch(fosdemDataUrl, {
                headers: {
                  'accept': 'application/json',
                  'content-type': 'application/json'
                }
              })
              .then(response => {
                return cache.put(fosdemDataUrl, response.clone());
              });
            })
          ])
        );
      });

      registerRoute(
        ({ url }) => url.pathname.startsWith('/_server'),
        new StaleWhileRevalidate({
          cacheName: 'server-functions',
          plugins: [
            new CacheableResponsePlugin({
              statuses: [0, 200]
            })
          ]
        })
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

    writeFileSync(`${outputDir}/sw.js`, sw);
    console.log('Service worker generated successfully!');
}

const outputDir = process.argv[2] || 'dist';
generateServiceWorker(outputDir).catch(console.error)