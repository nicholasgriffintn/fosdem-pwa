import { getSyncQueue, removeFromSyncQueue } from "~/lib/localStorage";
import { withRetry } from "~/lib/withRetry";
import {
	createBookmark,
	deleteBookmark,
	updateBookmark,
} from "~/server/functions/bookmarks";
import { createNote, updateNote, deleteNote } from "~/server/functions/notes";

let currentSyncPromise: Promise<{
	bookmarks: SyncResult;
	notes: SyncResult;
}> | null = null;

interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
	sync: {
		register(tag: string): Promise<void>;
	};
}

export interface SyncResult {
	success: boolean;
	syncedCount: number;
	errors: string[];
}

type ServerActionResult = {
	success: boolean;
	error?: string;
	statusCode?: number;
};

function normalizeServerActionResult(
	response: unknown,
	fallbackError = "Unknown error",
): ServerActionResult {
	if (response && typeof response === "object" && "success" in response) {
		const result = response as ServerActionResult;
		return {
			success: Boolean(result.success),
			error: result.error ?? (result.success ? undefined : fallbackError),
			statusCode: result.statusCode,
		};
	}

	return { success: false, error: fallbackError };
}


export async function syncBookmarksToServer(): Promise<SyncResult> {
	const syncQueue = await getSyncQueue();
	const bookmarkItems = syncQueue.filter((item) => item.type === "bookmark");

	if (bookmarkItems.length === 0) {
		return { success: true, syncedCount: 0, errors: [] };
	}

	const results = [];

	for (const item of bookmarkItems) {
		try {
			if (item.action === "create") {
				const response = await withRetry(() =>
					createBookmark({
						data: {
							year: item.data.year,
							type: item.data.type,
							slug: item.data.slug,
							status: item.data.status,
						},
					}),
				);

				const result = normalizeServerActionResult(response);
				if (result.success) {
					results.push({ success: true, id: item.id });
					await removeFromSyncQueue(item.id);
				} else if (result.statusCode === 404) {
					console.warn(`Bookmark not found (404), removing from sync queue: ${item.id}`);
					await removeFromSyncQueue(item.id);
					results.push({ success: true, id: item.id });
				} else {
					results.push({
						success: false,
						id: item.id,
						error: result.error || "Unknown error",
					});
				}
			} else if (item.action === "update") {
				if (item.data.serverId) {
					const updates: Record<string, unknown> = {
						status: item.data.status,
					};

					if (Object.prototype.hasOwnProperty.call(item.data, "priority")) {
						updates.priority = item.data.priority;
					}

					if (
						Object.prototype.hasOwnProperty.call(
							item.data,
							"last_notification_sent_at",
						)
					) {
						updates.last_notification_sent_at =
							item.data.last_notification_sent_at;
					}

					const response = await withRetry(() =>
						updateBookmark({
							data: {
								id: item.data.serverId,
								updates,
							},
						}),
					);

					const result = normalizeServerActionResult(response);
					if (result.success) {
						results.push({ success: true, id: item.id });
						await removeFromSyncQueue(item.id);
					} else if (result.statusCode === 404) {
						console.warn(`Bookmark not found (404), removing from sync queue: ${item.id}`);
						await removeFromSyncQueue(item.id);
						results.push({ success: true, id: item.id });
					} else {
						results.push({
							success: false,
							id: item.id,
							error: result.error || "Unknown error",
						});
					}
				} else {
					const response = await withRetry(() =>
						createBookmark({
							data: {
								year: item.data.year,
								type: item.data.type,
								slug: item.data.slug,
								status: item.data.status,
							},
						}),
					);

					const result = normalizeServerActionResult(response);
					if (result.success) {
						results.push({ success: true, id: item.id });
						await removeFromSyncQueue(item.id);
					} else if (result.statusCode === 404) {
						console.warn(`Bookmark not found (404), removing from sync queue: ${item.id}`);
						await removeFromSyncQueue(item.id);
						results.push({ success: true, id: item.id });
					} else {
						results.push({
							success: false,
							id: item.id,
							error: result.error || "Unknown error",
						});
					}
				}

			} else if (item.action === "delete") {
				if (item.data.serverId) {
					const response = await withRetry(() =>
						deleteBookmark({
							data: {
								id: item.data.serverId,
							},
						}),
					);
					const result = normalizeServerActionResult(response);
					if (result.success) {
						results.push({ success: true, id: item.id });
						await removeFromSyncQueue(item.id);
					} else if (result.statusCode === 404) {
						console.warn(`Bookmark not found (404), removing from sync queue: ${item.id}`);
						await removeFromSyncQueue(item.id);
						results.push({ success: true, id: item.id });
					} else {
						results.push({
							success: false,
							id: item.id,
							error: result.error || "Unknown error",
						});
					}
				} else {
					results.push({ success: true, id: item.id });
					await removeFromSyncQueue(item.id);
				}
			}
		} catch (error) {
			console.error("Sync error for bookmark:", item.id, error);
			results.push({ success: false, id: item.id, error: String(error) });
		}
	}

	const successCount = results.filter((r) => r.success).length;
	const errors = results
		.filter((r): r is { success: false; id: string; error: string } => !r.success)
		.map((r) => r.error);

	return {
		success: errors.length === 0,
		syncedCount: successCount,
		errors,
	};
}

export async function syncNotesToServer(): Promise<SyncResult> {
	const syncQueue = await getSyncQueue();
	const noteItems = syncQueue.filter((item) => item.type === "note");

	if (noteItems.length === 0) {
		return { success: true, syncedCount: 0, errors: [] };
	}

	const results = [];

	for (const item of noteItems) {
		try {
			if (item.action === "create") {
				const response = await withRetry(() =>
					createNote({
						data: {
							year: item.data.year,
							eventId: item.data.slug,
							note: item.data.content,
							time: item.data.time,
						},
					}),
				);

				const result = normalizeServerActionResult(response);
				if (result.success) {
					results.push({ success: true, id: item.id });
					await removeFromSyncQueue(item.id);
				} else if (result.statusCode === 404) {
					console.warn(`Bookmark not found (404), removing from sync queue: ${item.id}`);
					await removeFromSyncQueue(item.id);
					results.push({ success: true, id: item.id });
				} else {
					results.push({
						success: false,
						id: item.id,
						error: result.error || "Unknown error",
					});
				}
			} else if (item.action === "update") {
				if (item.data.serverId) {
					const response = await withRetry(() =>
						updateNote({
							data: {
								id: item.data.serverId,
								updates: {
									note: item.data.content,
									time: item.data.time,
								},
							},
						}),
					);
					const result = normalizeServerActionResult(response);
					if (result.success) {
						results.push({ success: true, id: item.id });
						await removeFromSyncQueue(item.id);
					} else if (result.statusCode === 404) {
						console.warn(`Bookmark not found (404), removing from sync queue: ${item.id}`);
						await removeFromSyncQueue(item.id);
						results.push({ success: true, id: item.id });
					} else {
						results.push({
							success: false,
							id: item.id,
							error: result.error || "Unknown error",
						});
					}
				} else {
					const response = await withRetry(() =>
						createNote({
							data: {
								year: item.data.year,
								eventId: item.data.slug,
								note: item.data.content,
								time: item.data.time,
							},
						}),
					);
					const result = normalizeServerActionResult(response);
					if (result.success) {
						results.push({ success: true, id: item.id });
						await removeFromSyncQueue(item.id);
					} else if (result.statusCode === 404) {
						console.warn(`Bookmark not found (404), removing from sync queue: ${item.id}`);
						await removeFromSyncQueue(item.id);
						results.push({ success: true, id: item.id });
					} else {
						results.push({
							success: false,
							id: item.id,
							error: result.error || "Unknown error",
						});
					}
				}
			} else if (item.action === "delete") {
				if (item.data.serverId) {
					const response = await withRetry(() =>
						deleteNote({
							data: {
								id: item.data.serverId,
							},
						}),
					);
					const result = normalizeServerActionResult(response);
					if (result.success) {
						results.push({ success: true, id: item.id });
						await removeFromSyncQueue(item.id);
					} else if (result.statusCode === 404) {
						console.warn(`Bookmark not found (404), removing from sync queue: ${item.id}`);
						await removeFromSyncQueue(item.id);
						results.push({ success: true, id: item.id });
					} else {
						results.push({
							success: false,
							id: item.id,
							error: result.error || "Unknown error",
						});
					}
				} else {
					results.push({ success: true, id: item.id });
					await removeFromSyncQueue(item.id);
				}
			}
		} catch (error) {
			console.error("Sync error for note:", item.id, error);
			results.push({ success: false, id: item.id, error: String(error) });
		}
	}

	const successCount = results.filter((r) => r.success).length;
	const errors = results
		.filter((r): r is { success: false; id: string; error: string } => !r.success)
		.map((r) => r.error);

	return {
		success: errors.length === 0,
		syncedCount: successCount,
		errors,
	};
}

export async function syncAllOfflineData(): Promise<{
	bookmarks: SyncResult;
	notes: SyncResult;
}> {
	if (currentSyncPromise) {
		return currentSyncPromise;
	}

	currentSyncPromise = (async () => {
		const [bookmarkResult, noteResult] = await Promise.all([
			syncBookmarksToServer(),
			syncNotesToServer(),
		]);

		return {
			bookmarks: bookmarkResult,
			notes: noteResult,
		};
	})();

	try {
		return await currentSyncPromise;
	} finally {
		currentSyncPromise = null;
	}
}

export function registerBackgroundSync() {
	if (
		typeof window === "undefined" ||
		typeof navigator === "undefined" ||
		!("serviceWorker" in navigator)
	) {
		return;
	}

	const ServiceWorkerRegistrationCtor = (
		window as typeof window & {
			ServiceWorkerRegistration?: typeof window.ServiceWorkerRegistration;
		}
	).ServiceWorkerRegistration;

	if (
		!ServiceWorkerRegistrationCtor ||
		!("sync" in ServiceWorkerRegistrationCtor.prototype)
	) {
		return;
	}

	navigator.serviceWorker.ready
		.then((registration) => {
			const registrationWithSync =
				registration as ServiceWorkerRegistrationWithSync;

			registrationWithSync.sync
				.register("bookmark-sync")
				.catch((error: Error) => {
					console.error("Background sync registration failed:", error);
				});
		})
		.catch((error) => {
			console.warn("Service worker not ready for background sync:", error);
		});
}

export async function checkAndSyncOnOnline(userId?: string) {
	if (typeof navigator === "undefined" || typeof window === "undefined") {
		return;
	}

	if (navigator.onLine && userId) {
		const syncQueue = await getSyncQueue();
		if (syncQueue.length > 0) {
			const wasRunning = !!currentSyncPromise;
			if (!wasRunning) {
				console.info("Syncing offline data...");
			}
			try {
				const results = await syncAllOfflineData();
				if (!wasRunning) {
					console.info("Sync completed:", results);
				}

				window.dispatchEvent(
					new CustomEvent("offline-sync-completed", {
						detail: results,
					}),
				);
			} catch (error) {
				console.error("Sync failed:", error);

				window.dispatchEvent(
					new CustomEvent("offline-sync-failed", {
						detail: error,
					}),
				);
			}
		}
	}
}
