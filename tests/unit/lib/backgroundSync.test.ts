import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const localStorageMocks = vi.hoisted(() => ({
	getSyncQueue: vi.fn(),
	removeFromSyncQueue: vi.fn(),
}));

const { getSyncQueue, removeFromSyncQueue } = localStorageMocks;

vi.mock("~/lib/localStorage", () => localStorageMocks);

const bookmarkMocks = vi.hoisted(() => ({
	createBookmark: vi.fn(),
	updateBookmark: vi.fn(),
	deleteBookmark: vi.fn(),
}));

const { createBookmark, updateBookmark, deleteBookmark } = bookmarkMocks;

vi.mock("~/server/functions/bookmarks", () => bookmarkMocks);

const noteMocks = vi.hoisted(() => ({
	createNote: vi.fn(),
	updateNote: vi.fn(),
	deleteNote: vi.fn(),
}));

const { createNote, updateNote, deleteNote } = noteMocks;

vi.mock("~/server/functions/notes", () => noteMocks);

import * as backgroundSync from "~/lib/backgroundSync";

describe("background sync helpers", () => {
	beforeEach(() => {
		getSyncQueue.mockReset();
		removeFromSyncQueue.mockReset();
		createBookmark.mockReset();
		updateBookmark.mockReset();
		deleteBookmark.mockReset();
		createNote.mockReset();
		updateNote.mockReset();
		deleteNote.mockReset();
		getSyncQueue.mockResolvedValue([]);
	});

	afterEach(() => {
		vi.restoreAllMocks();
		// @ts-ignore
		delete navigator.serviceWorker;
		// @ts-ignore
		delete navigator.onLine;
		delete (window as Partial<typeof window>).ServiceWorkerRegistration;
	});

	it("synchronizes bookmarks and cleans up the queue", async () => {
		getSyncQueue.mockResolvedValue([
			{
				id: "1",
				type: "bookmark",
				action: "create",
				data: { year: 2024, type: "event", slug: "talk", status: "favourited" },
			},
			{
				id: "2",
				type: "bookmark",
				action: "delete",
				data: { serverId: "server-id" },
			},
			{ id: "ignored", type: "note", action: "create", data: {} },
		]);

		createBookmark.mockResolvedValue({ success: true });
		deleteBookmark.mockResolvedValue({ success: true });

		const result = await backgroundSync.syncBookmarksToServer();

		expect(result).toEqual({
			success: true,
			syncedCount: 2,
			errors: [],
		});
		expect(removeFromSyncQueue).toHaveBeenCalledTimes(2);
	});

	it("collects bookmark sync errors", async () => {
		getSyncQueue.mockResolvedValue([
			{
				id: "1",
				type: "bookmark",
				action: "create",
				data: { year: 2024, type: "event", slug: "talk", status: "favourited" },
			},
		]);

		createBookmark.mockResolvedValue({ success: false, error: "boom" });

		const result = await backgroundSync.syncBookmarksToServer();
		expect(result.success).toBe(false);
		expect(result.errors).toContain("boom");
		expect(removeFromSyncQueue).not.toHaveBeenCalled();
	});

	it("synchronizes notes covering create, update, and delete", async () => {
		getSyncQueue.mockResolvedValue([
			{
				id: "create",
				type: "note",
				action: "create",
				data: { year: 2024, slug: "event", content: "note", time: 1 },
			},
			{
				id: "update",
				type: "note",
				action: "update",
				data: { year: 2024, slug: "event", content: "note", time: 2 },
			},
			{
				id: "delete",
				type: "note",
				action: "delete",
				data: { serverId: "server-note" },
			},
		]);

		createNote.mockResolvedValue({ success: true });
		updateNote.mockResolvedValue({ success: true });
		deleteNote.mockResolvedValue({ success: true });

		const result = await backgroundSync.syncNotesToServer();

		expect(result.success).toBe(true);
		expect(removeFromSyncQueue).toHaveBeenCalledTimes(3);
	});

	it("deduplicates concurrent syncAllOfflineData calls", async () => {
		getSyncQueue.mockResolvedValue([]);

		const first = backgroundSync.syncAllOfflineData();
		const second = backgroundSync.syncAllOfflineData();

		const [firstResult, secondResult] = await Promise.all([first, second]);

		expect(firstResult).toEqual(secondResult);
		expect(getSyncQueue).toHaveBeenCalledTimes(2);
	});

	it("registers background sync when service worker capabilities exist", async () => {
		const register = vi.fn().mockResolvedValue(undefined);

		class FakeServiceWorkerRegistration { }
		// @ts-ignore
		FakeServiceWorkerRegistration.prototype.sync = { register };

		Object.defineProperty(window, "ServiceWorkerRegistration", {
			value: FakeServiceWorkerRegistration,
			configurable: true,
		});

		Object.defineProperty(navigator, "serviceWorker", {
			value: {
				ready: Promise.resolve(new FakeServiceWorkerRegistration() as any),
			},
			configurable: true,
		});

		backgroundSync.registerBackgroundSync();
		await Promise.resolve();
		await Promise.resolve();
		expect(register).toHaveBeenCalledWith("bookmark-sync");
	});

	it("invokes sync when coming back online with pending items", async () => {
		getSyncQueue.mockResolvedValueOnce([
			{
				id: "bookmark",
				type: "bookmark",
				action: "create",
				data: {
					year: 2024,
					type: "event",
					slug: "talk",
					status: "favourited",
				},
			},
		]);
		getSyncQueue.mockResolvedValue([]);
		createBookmark.mockResolvedValue({ success: true });
		Object.defineProperty(navigator, "onLine", {
			value: true,
			configurable: true,
		});
		const dispatchSpy = vi.spyOn(window, "dispatchEvent");

		await backgroundSync.checkAndSyncOnOnline("user");

		expect(dispatchSpy).toHaveBeenCalled();
		expect(dispatchSpy.mock.calls.at(-1)?.[0].type).toBe(
			"offline-sync-completed",
		);
	});

	it("emits a failure event when sync fails", async () => {
		getSyncQueue
			.mockResolvedValueOnce([
				{
					id: "bookmark",
					type: "bookmark",
					action: "create",
					data: {
						year: 2024,
						type: "event",
						slug: "talk",
						status: "favourited",
					},
				},
			])
			.mockRejectedValueOnce(new Error("fail"))
			.mockResolvedValue([]);
		Object.defineProperty(navigator, "onLine", {
			value: true,
			configurable: true,
		});
		const dispatchSpy = vi.spyOn(window, "dispatchEvent");

		await backgroundSync.checkAndSyncOnOnline("user");

		expect(dispatchSpy).toHaveBeenCalled();
		expect(dispatchSpy.mock.calls.at(-1)?.[0].type).toBe("offline-sync-failed");
	});
});
