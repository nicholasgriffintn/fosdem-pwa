import { glob } from 'glob'
import { writeFileSync, readFileSync, readdirSync } from 'node:fs'

const CURRENT_YEAR = new Date().getFullYear();

async function generateServiceWorker(outputDir = 'dist') {
  let manifest: Record<string, any>;

  try {
    manifest = JSON.parse(
      readFileSync('dist/server/.vite/manifest.json', 'utf-8')
    )
  } catch (error: any) {
    throw new Error('Error reading Vite manifest: ' + error.message)
  }

  if (!manifest) {
    throw new Error('Vite manifest is empty or invalid.')
  }

  const serverAssetsDir = 'dist/server/assets';
  let fosdemFunctionId: string | undefined;

  try {
    // We need to get the function ID for the server function so we can pre cache it.
    // To do this, we read the worker-entry file and extract the hash for the fosdem function.
    // Then we can use that hash to construct the server function URL.
    const workerEntryFile = readdirSync(serverAssetsDir)
      .find(f => f.startsWith('worker-entry-') && f.endsWith('.js'));

    if (workerEntryFile) {
      const workerEntryContent = readFileSync(`${serverAssetsDir}/${workerEntryFile}`, 'utf-8');
      const match = workerEntryContent.match(/"([a-f0-9]{60,})":\s*\{\s*functionName:\s*"getAllData_createServerFn_handler"/);
      if (match) {
        fosdemFunctionId = match[1];
      }
    }
  } catch (error: any) {
    console.warn('Could not find worker-entry or extract hash, falling back to manifest:', error.message);
  }

  if (!fosdemFunctionId) {
    fosdemFunctionId = Object.keys(manifest)
      .find(key => key.startsWith('src/server/functions/fosdem.ts'))
      ? manifest[
        Object.keys(manifest).find(key => key.startsWith('src/server/functions/fosdem.ts'))!
      ]?.name
      : undefined;
  }

  if (!fosdemFunctionId) {
    throw new Error('Fosdem server function hash not found.')
  }

  // This creates a payload to fetch all data for the current year, this should match what the app uses.
  const fosdemDataPayload = {
    t: {
      t: 10,
      i: 0,
      p: {
        k: ["data"],
        v: [
          {
            t: 10,
            i: 1,
            p: {
              k: ["year"],
              v: [
                {
                  t: 0,
                  s: CURRENT_YEAR
                }
              ],
              s: 1
            },
            o: 0
          }
        ],
        s: 1
      },
      o: 0
    },
    f: 31,
    m: []
  };

  const fosdemDataUrl = `/_serverFn/${fosdemFunctionId}?payload=${encodeURIComponent(JSON.stringify(fosdemDataPayload))}&createServerFn`;

  const dataUrls = [fosdemDataUrl]

  const clientFiles = await glob(`${outputDir}/client/**/*`, { nodir: true })

  const filesAndDataUrls = [...dataUrls, ...clientFiles, '/offline']

  const ignoredRoutes = [
    '/robots.txt',
    '/nitro.json',
    '/_routes.json',
    '/_redirects',
    '/_headers',
    '/sw.js',
    '/_worker.js',
    '/wrangler.json',
    '/manifest.webmanifest',
    '/favicon.ico',
    "/screenshots/2.png",
    "/screenshots/1.jpg",
    "/icons/safari-pinned-tab.svg",
    "/icons/mstile-150x150.png",
    "/icons/favicon.ico",
    "/icons/favicon-32x32.png",
    "/icons/favicon-16x16.png",
    "/icons/browserconfig.xml",
    "/icons/apple-touch-icon.png",
    "/icons/apple-touch-icon-precomposed.png",
    "/icons/apple-touch-icon-76x76.png",
    "/icons/apple-touch-icon-76x76-precomposed.png",
    "/icons/apple-touch-icon-72x72.png",
    "/icons/apple-touch-icon-72x72-precomposed.png",
    "/icons/apple-touch-icon-60x60.png",
    "/icons/apple-touch-icon-60x60-precomposed.png",
    "/icons/apple-touch-icon-57x57.png",
    "/icons/apple-touch-icon-57x57-precomposed.png",
    "/icons/apple-touch-icon-180x180.png",
    "/icons/apple-touch-icon-180x180-precomposed.png",
    "/icons/apple-touch-icon-152x152.png",
    "/icons/apple-touch-icon-152x152-precomposed.png",
    "/icons/apple-touch-icon-144x144.png",
    "/icons/apple-touch-icon-144x144-precomposed.png",
    "/icons/apple-touch-icon-120x120.png",
    "/icons/apple-touch-icon-120x120-precomposed.png",
    "/icons/apple-touch-icon-114x114.png",
    "/icons/apple-touch-icon-114x114-precomposed.png",
    "/icons/android-chrome-96x96.png",
    "/icons/android-chrome-72x72.png",
    "/icons/android-chrome-512x512.png",
    "/icons/android-chrome-48x48.png",
    "/icons/android-chrome-384x384.png",
    "/icons/android-chrome-36x36.png",
    "/icons/android-chrome-256x256.png",
    "/icons/android-chrome-192x192.png",
    "/icons/android-chrome-144x144.png",
  ]

  const assetsToCache = filesAndDataUrls
    .map(file => {
      if (file.startsWith('/_serverFn') || file.startsWith('/offline')) {
        return file
      }
      // Remove outputDir and also strip client/ or server/ prefixes
      const relativePath = file.replace(new RegExp(`^${outputDir}/`), '');
      return `/${relativePath.replace(/^(client|server)\//, '')}`
    })
    .filter(file => !ignoredRoutes.includes(file))

  const sw = `// NOTE: This file is automatically generated by scripts/generate-sw.ts
// Do not edit this file manually.
// If you need to make changes, edit the script and run 'pnpm build' again.

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

async function syncBookmarks() {
  try {
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'TRIGGER_BACKGROUND_SYNC'
      });
    });
  } catch (error) {
    console.error('Bookmark sync trigger failed:', error);
  }
}

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
    ({ url }) => url.pathname.startsWith('/_serverFn'),
    new NetworkFirst({
      cacheName: 'server-functions',
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200]
        }),
        new BackgroundSyncPlugin('server-functions-queue', {
          maxRetentionTime: 24 * 60,
          onSync: async ({ queue }) => {
            console.info('[ServiceWorker] Attempting to sync server functions queue');
            try {
              await queue.replayRequests();
              const bc = new BroadcastChannel('server-functions-sync');
              bc.postMessage({ type: 'SYNC_COMPLETE' });
              console.info('[ServiceWorker] Server functions queue sync complete');
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
    } else if (event.tag === 'bookmark-sync') {
      // Handle bookmark sync requests
      event.waitUntil(syncBookmarks());
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
}`

  writeFileSync(`${outputDir}/client/sw.js`, sw);
  console.info('Service worker generated successfully!');
}

const outputDir = process.argv[2] || 'dist';
generateServiceWorker(outputDir).catch(console.error)