/// <reference lib="WebWorker" />

import { Storage, Strategy } from '@remix-pwa/cache';
import { cacheFirst, staleWhileRevalidate } from '@remix-pwa/strategy';
import type { DefaultFetchHandler } from '@remix-pwa/sw';
import { RemixNavigationHandler, matchRequest } from '@remix-pwa/sw';
import { registerAllSyncs } from '@remix-pwa/sync';
import { Push } from '@remix-pwa/push/worker';

declare let self: ServiceWorkerGlobalScope;

const PAGES = 'page-cache';
const DATA = 'data-cache';
const ASSETS = 'assets-cache';

// Open the caches and wrap them in `RemixCache` instances.
const dataCache = Storage.open(DATA, {
  ttl: 10 * 60000, // 10 minutes
  strategy: Strategy['STALE_WHILE_REVALIDATE'],
});
const documentCache = Storage.open(PAGES, {
  ttl: 10 * 60000, // 10 minutes
  strategy: Strategy['STALE_WHILE_REVALIDATE'],
});
const assetCache = Storage.open(ASSETS, {
  ttl: 60 * 60 * 24 * 7 * 1_000, // 7 days
  strategy: Strategy['CACHE_FIRST'],
});

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(self.clients.claim());
});

const dataHandler = staleWhileRevalidate({
  cache: dataCache,
});

const assetsHandler = cacheFirst({
  cache: assetCache,
  cacheQueryOptions: {
    ignoreSearch: true,
    ignoreVary: true,
  },
});

const documentHandler = staleWhileRevalidate({
  cache: documentCache,
});

// The default fetch event handler will be invoke if the
// route is not matched by any of the worker action/loader.
export const defaultFetchHandler: DefaultFetchHandler = ({
  context,
  request,
}) => {
  if (request.method.toUpperCase() !== 'GET') {
    return fetch(request);
  }

  if (request.url.includes('/api/') || request.url.includes('api.')) {
    return fetch(request);
  }

  if (request.url.includes('/action/') || request.url.includes('action.')) {
    return fetch(request);
  }

  const type = matchRequest(request, [
    '/build/',
    '/icons/',
    '/images/',
    '/screenshots/',
    'favicon.ico',
  ]);

  if (type === 'asset') {
    return assetsHandler(context.event.request);
  }

  if (type === 'loader') {
    return dataHandler(context.event.request);
  }

  return documentHandler(context.event.request);
};

const handler = new RemixNavigationHandler({
  dataCache,
  documentCache,
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  event.waitUntil(handler.handle(event));
});

registerAllSyncs(['favourite-item', 'set-theme']);

class CustomPush extends Push {
  async handlePush(event: PushEvent): Promise<void> {
    const { data } = event;
    const jsonData = data?.json();
    console.log(jsonData, 'data');
    await self.registration.showNotification(jsonData.title, jsonData.options);
  }

  async handleNotificationClick(event: NotificationEvent): Promise<void> {
    console.log(event, 'event');
  }

  async handleNotificationClose(event: NotificationEvent): Promise<void> {
    console.log(event, 'event');
  }

  async handleError(error: ErrorEvent): Promise<void> {
    console.error(error, 'error');
  }
}

const pushHandler = new CustomPush();

self.addEventListener('push', (event: PushEvent) => {
  event.waitUntil(pushHandler.handlePush(event));
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  console.log(event, 'event');
});

self.addEventListener('notificationclose', (event: NotificationEvent) => {
  console.log(event, 'event');
});

self.addEventListener('error', (error: ErrorEvent) => {
  console.error(error, 'error');
});
