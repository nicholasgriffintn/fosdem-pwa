/// <reference lib="WebWorker" />

import { Storage, Strategy } from '@remix-pwa/cache';
import { cacheFirst, networkFirst } from '@remix-pwa/strategy';
import type { DefaultFetchHandler } from '@remix-pwa/sw';
import { RemixNavigationHandler, matchRequest } from '@remix-pwa/sw';
import { registerAllSyncs } from '@remix-pwa/sync';

declare let self: ServiceWorkerGlobalScope;

const PAGES = 'page-cache';
const DATA = 'data-cache';
const ASSETS = 'assets-cache';

// Open the caches and wrap them in `RemixCache` instances.
const dataCache = Storage.open(DATA, {
  ttl: 10 * 60000, // 10 minutes
  strategy: Strategy['NETWORK_FIRST'],
});
const documentCache = Storage.open(PAGES, {
  ttl: 10 * 60000, // 10 minutes
  strategy: Strategy['NETWORK_FIRST'],
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

const dataHandler = networkFirst({
  cache: dataCache,
});

const assetsHandler = cacheFirst({
  cache: assetCache,
  cacheQueryOptions: {
    ignoreSearch: true,
    ignoreVary: true,
  },
});

const documentHandler = networkFirst({
  cache: documentCache,
});

// The default fetch event handler will be invoke if the
// route is not matched by any of the worker action/loader.
export const defaultFetchHandler: DefaultFetchHandler = ({
  context,
  request,
}) => {
  if (request.method.toUpperCase() !== 'GET') {
    return context.fetchFromServer();
  }

  if (request.url.includes('/api/') || request.url.includes('api.')) {
    return context.fetchFromServer();
  }

  if (request.url.includes('/action/') || request.url.includes('action.')) {
    return context.fetchFromServer();
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
