((config) => {
	importScripts(
		"https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js",
	);
	const { registerRoute, NavigationRoute, setDefaultHandler, setCatchHandler } =
		workbox.routing;
	const { NetworkFirst, CacheFirst, NetworkOnly } = workbox.strategies;
	const { CacheableResponsePlugin } = workbox.cacheableResponse;
	const { ExpirationPlugin } = workbox.expiration;
	workbox.core.setCacheNameDetails({ prefix: config.cachePrefix });

	self.addEventListener("message", (event) => {
		if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
	});
	self.addEventListener("install", () => self.skipWaiting());

	setCatchHandler(async ({ request }) => {
		if (request.destination === "document") {
			const offline = await workbox.precaching.matchPrecache("/offline");
			if (offline) return offline;
		}
		return Response.error();
	});

	registerRoute(
		({ url }) => url.hostname === "avatars.githubusercontent.com",
		new CacheFirst({
			cacheName: `${config.cachePrefix}-github-avatars`,
			plugins: [
				new CacheableResponsePlugin({ statuses: [0, 200] }),
				new ExpirationPlugin({
					maxEntries: 100,
					maxAgeSeconds: 7 * 24 * 60 * 60,
				}),
			],
		}),
	);
	registerRoute(
		({ url }) => url.hostname === "images.s3rve.co.uk",
		new CacheFirst({
			cacheName: `${config.cachePrefix}-resized-images`,
			plugins: [
				new CacheableResponsePlugin({ statuses: [0, 200] }),
				new ExpirationPlugin({
					maxEntries: 200,
					maxAgeSeconds: 7 * 24 * 60 * 60,
				}),
			],
		}),
	);
	registerRoute(
		new NavigationRoute(
			new NetworkFirst({
				cacheName: `${config.cachePrefix}-navigations`,
				plugins: [
					new CacheableResponsePlugin({ statuses: [200] }),
					new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 }),
				],
				networkTimeoutSeconds: 3,
			}),
			{
				denylist: [/^\/(?:api|_serverFn|profile|bookmarks|signin)(?:\/|\?|$)/],
			},
		),
	);
	registerRoute(
		({ url }) =>
			url.origin === self.location.origin &&
			url.pathname === config.schedulePath,
		new NetworkFirst({
			cacheName: `${config.cachePrefix}-schedule`,
			plugins: [
				new CacheableResponsePlugin({ statuses: [200] }),
				{
					handlerDidError: async ({ request }) =>
						(await workbox.precaching.matchPrecache(request.url)) ??
						Response.error(),
				},
			],
			networkTimeoutSeconds: 3,
		}),
	);
	workbox.precaching.precacheAndRoute(
		config.urls.map((url) => ({ url, revision: config.revision })),
	);
	setDefaultHandler(new NetworkOnly());

	self.addEventListener("activate", (event) => {
		const legacyCaches = [
			"github-avatars",
			"resized-images",
			"navigations",
			"server-functions",
			`${config.cachePrefix}-server-functions`,
		];
		event.waitUntil(
			Promise.all([
				self.clients.claim(),
				caches
					.keys()
					.then((names) =>
						Promise.all(
							names
								.filter(
									(name) =>
										name.startsWith("fosdem-pwa-") ||
										name.startsWith("workbox-") ||
										legacyCaches.includes(name),
								)
								.map((name) => caches.delete(name)),
						),
					),
			]),
		);
	});

	self.addEventListener("push", (event) => {
		if (!event.data) return;
		const data = event.data.json();
		event.waitUntil(
			self.registration.showNotification(data.title, {
				body: data.body,
				icon: "/icons/android-chrome-192x192.png",
				badge: "/icons/android-chrome-72x72.png",
				data: data.url,
			}),
		);
	});
	self.addEventListener("notificationclick", (event) => {
		event.notification.close();
		if (event.notification.data)
			event.waitUntil(self.clients.openWindow(event.notification.data));
	});
	self.addEventListener("sync", (event) => {
		if (event.tag !== "bookmark-sync") return;
		event.waitUntil(
			self.clients.matchAll().then((clients) => {
				for (const client of clients)
					client.postMessage({ type: "TRIGGER_BACKGROUND_SYNC" });
			}),
		);
	});
})(self.__SERVICE_WORKER_CONFIG__);
