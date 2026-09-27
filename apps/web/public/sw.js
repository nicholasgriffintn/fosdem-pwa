self.addEventListener("install", (event) => {
	console.log("Service Worker installed");
	self.skipWaiting();
});

self.addEventListener("activate", (event) => {
	console.log("Service Worker activated");
	event.waitUntil(clients.claim());
});

self.addEventListener("fetch", (event) => {
	event.respondWith(fetch(event.request));
});

self.addEventListener("error", (event) => {
	console.error("Service Worker error:", event.error);
});

self.addEventListener("unhandledrejection", (event) => {
	console.error("Service Worker unhandled rejection:", event.reason);
});

self.addEventListener("push", (event) => {
	if (event.data) {
		const data = event.data.json();
		self.registration.showNotification(data.title, {
			body: data.body,
			icon: "/icons/android-chrome-192x192.png",
			badge: "/icons/android-chrome-72x72.png",
			data: data.url,
		});
	}
});

self.addEventListener("notificationclick", (event) => {
	event.notification.close();
	if (event.notification.data) {
		event.waitUntil(clients.openWindow(event.notification.data));
	}
});
