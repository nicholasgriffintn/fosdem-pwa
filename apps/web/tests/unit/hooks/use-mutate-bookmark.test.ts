import { describe, expect, it, vi } from "vitest";

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
	it("rolls back local bookmark when server creation fails", async () => {
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
				},
				sampleBookmark,
			),
		).rejects.toThrow("server down");

		expect(createLocal).toHaveBeenCalledTimes(1);
		expect(createServer).toHaveBeenCalledTimes(1);
		expect(removeLocal).toHaveBeenCalledWith("local-1");
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
