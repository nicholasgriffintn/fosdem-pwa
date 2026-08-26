import { describe, expect, it, vi } from "vitest";

vi.mock("~/lib/localStorage", () => ({
	removeFromSyncQueue: vi.fn(async () => undefined),
}));

import {
	createBookmarkOptimistic,
	type CreateBookmarkInput,
} from "~/hooks/use-mutate-bookmark";

const sampleBookmark: CreateBookmarkInput = {
	year: 2026,
	type: "bookmark_event",
	slug: "talk-a",
	status: "favourited",
};

describe("createBookmarkOptimistic", () => {
	it("rolls back local bookmark when server creation fails while online", async () => {
		const createLocal = vi.fn(async () => ({ id: "local-1" } as any));
		const removeLocal = vi.fn(async () => true);
		const createServer = vi.fn(async () => {
			throw new Error("server down");
		});

		await expect(
			createBookmarkOptimistic(
				{
					createLocal,
					removeLocal,
					createServer,
					userId: "user-1",
					isOnline: () => true,
				},
				sampleBookmark,
			),
		).rejects.toThrow("server down");

		expect(createLocal).toHaveBeenCalledTimes(1);
		expect(createServer).toHaveBeenCalledTimes(1);
		// skipSync must be true: without it the rollback enqueues a *delete*
		// under the same queue key as the pending create, replacing it.
		expect(removeLocal).toHaveBeenCalledWith("local-1", true);
	});

	it("keeps the bookmark queued when the create fails because the user is offline", async () => {
		const created = { id: "local-1" } as any;
		const createLocal = vi.fn(async () => created);
		const removeLocal = vi.fn(async () => true);
		const createServer = vi.fn(async () => {
			throw new Error("Failed to fetch");
		});

		const result = await createBookmarkOptimistic(
			{
				createLocal,
				removeLocal,
				createServer,
				userId: "user-1",
				isOnline: () => false,
			},
			sampleBookmark,
		);

		// Offline bookmarking is the headline feature: the local record and its
		// queued create must survive so background sync can finish later.
		expect(result).toBe(created);
		expect(removeLocal).not.toHaveBeenCalled();
	});

	it("keeps local bookmark when user is not logged in", async () => {
		const createLocal = vi.fn(async () => ({ id: "local-2" } as any));
		const removeLocal = vi.fn(async () => true);
		const createServer = vi.fn(async () => {
			throw new Error("should not be called");
		});

		await createBookmarkOptimistic(
			{
				createLocal,
				removeLocal,
				createServer,
				userId: undefined,
			},
			sampleBookmark,
		);

		expect(createLocal).toHaveBeenCalledTimes(1);
		expect(createServer).not.toHaveBeenCalled();
		expect(removeLocal).not.toHaveBeenCalled();
	});
});
