import { glob } from 'glob'
import { writeFileSync, readFileSync } from 'node:fs'

async function generateServiceWorker(outputDir = 'dist') {
  const manifest = JSON.parse(
    readFileSync('.vinxi/build/server/_server/.vite/manifest.json', 'utf-8')
  )

  const fosdemFunctionId = manifest['app/server/functions/fosdem.ts']?.name
  const fosdemDataPayload = {
    data: { year: "2025" },
    context: {}
  };
  const fosdemDataUrl = `/_server/?_serverFnId=${fosdemFunctionId}&_serverFnName=$$function0&payload=${encodeURIComponent(JSON.stringify(fosdemDataPayload))}`;

  const dataUrls = [fosdemDataUrl]

  const files = await glob(`${outputDir}/**/*`, { nodir: true })
  const filesAndDataUrls = [...dataUrls, ...files, '/offline']

  const ignoredRoutes = [
    '/robots.txt',
    '/nitro.json',
    '/_routes.json',
    '/_redirects',
    '/_headers',
    '/sw.js',
    '/_worker.js',
  ]

  const assetsToCache = filesAndDataUrls
    .map(file => {
      if (file.startsWith('/_server') || file.startsWith('/offline')) {
        return file
      }
      return `/${file.replace(new RegExp(`^${outputDir}/`), '')}`
    })
    .filter(file => !ignoredRoutes.includes(file))

  const sw = `
    importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

    const { registerRoute, NavigationRoute, setDefaultHandler } = workbox.routing;
    const { NetworkFirst, CacheFirst, StaleWhileRevalidate, NetworkOnly } = workbox.strategies;
    const { CacheableResponsePlugin } = workbox.cacheableResponse;
    const { ExpirationPlugin } = workbox.expiration;
    const { BackgroundSyncPlugin } = workbox.backgroundSync;
    const { BroadcastUpdatePlugin } = workbox.broadcastUpdate;

    self.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
      }
    });

    const backgroundSyncQueue = new workbox.backgroundSync.Queue('fosdemQueue', {
      maxRetentionTime: 24 * 60 // Retry for up to 24 hours (specified in minutes)
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
      
      let updateInterval;
      self.addEventListener('online', () => {
        updateInterval = setInterval(() => {
          self.registration.update();
        }, 5 * 60 * 1000); // 5 minutes
      });

      self.addEventListener('offline', () => {
        if (updateInterval) clearInterval(updateInterval);
      });

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
            }),
            new BroadcastUpdatePlugin({
              channelName: 'fosdem-data-updates',
              headersToCheck: ['etag', 'last-modified']
            }),
            new BackgroundSyncPlugin('fosdem-data-queue', {
              maxRetentionTime: 24 * 60 // Retry for up to 24 hours
            })
          ]
        })
      );

      registerRoute(
        ({ url }) => url.pathname.includes('/api/user'),
        new NetworkFirst({
          cacheName: 'user-data',
          plugins: [
            new BackgroundSyncPlugin('user-data-queue', {
              maxRetentionTime: 24 * 60,
              onSync: async ({ queue }) => {
                try {
                  await queue.replayRequests();
                  // Broadcast success to the app
                  const bc = new BroadcastChannel('user-data-sync');
                  bc.postMessage({ type: 'SYNC_COMPLETE' });
                } catch (error) {
                  // Handle sync failures
                  console.error('Background sync failed:', error);
                }
              }
            })
          ],
          networkTimeoutSeconds: 3
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
          }),
          {
            allowlist: [new RegExp('^(?!/api/).*$')], // All non-API routes
          }
        )
      );

      registerRoute(
        ({ url }) => url.pathname.startsWith('/_server'),
        new NetworkFirst({
          cacheName: 'server-functions',
          plugins: [
            new CacheableResponsePlugin({
              statuses: [0, 200]
            }),
            new BackgroundSyncPlugin('server-functions-queue', {
              maxRetentionTime: 24 * 60,
              onSync: async ({ queue }) => {
                console.log('[ServiceWorker] Attempting to sync server functions queue');
                try {
                  await queue.replayRequests();
                  const bc = new BroadcastChannel('server-functions-sync');
                  bc.postMessage({ type: 'SYNC_COMPLETE' });
                  console.log('[ServiceWorker] Server functions queue sync complete');
                } catch (error) {
                  console.error('[ServiceWorker] Server functions queue sync failed:', error);
                }
              }
            })
          ],
          networkTimeoutSeconds: 6
        })
      );

      setDefaultHandler(
        new NetworkOnly({
          plugins: [
            {
              handlerDidError: async ({ request }) => {
                const cache = await caches.open('fosdem-data');
                const cachedResponse = await cache.match(request);
                if (cachedResponse) return cachedResponse;

                return caches.match('/offline');
              }
            }
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
                    cacheName !== 'user-data' &&
                    cacheName !== 'default') {
                  return caches.delete(cacheName);
                }
              })
            );
          })
        );
      });

      self.addEventListener('sync', (event) => {
        if (event.tag === 'user-data-sync') {
          // Handle user data requests
          event.waitUntil(backgroundSyncQueue.replayRequests());
        } else if (event.tag === 'server-functions-queue') {
          // Handle server function requests
          const serverFunctionsQueue = new workbox.backgroundSync.Queue('server-functions-queue');
          event.waitUntil(serverFunctionsQueue.replayRequests());
        } else if (event.tag === 'fosdem-data-queue') {
          // Handle fosdem data requests
          const fosdemDataQueue = new workbox.backgroundSync.Queue('fosdem-data-queue');
          event.waitUntil(fosdemDataQueue.replayRequests());
        }
      });

      self.addEventListener('push', (event) => {
        if (event.data) {
          const data = event.data.json();
          self.registration.showNotification(data.title, {
            body: data.body,
            icon: '/icons/android-chrome-192x192.png',
            badge: '/icons/android-chrome-72x72.png',
            data: data.url
          });
        }
      });

      self.addEventListener('notificationclick', (event) => {
        event.notification.close();
        if (event.notification.data) {
          event.waitUntil(
            clients.openWindow(event.notification.data)
          );
        }
      });
    }
  `

  writeFileSync(`${outputDir}/sw.js`, sw);
  console.log('Service worker generated successfully!');
}

const outputDir = process.argv[2] || 'dist';
generateServiceWorker(outputDir).catch(console.error)